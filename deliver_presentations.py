import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import quote, urlparse

import requests

BUCKET = "project-assets"
EXPECTED_PROJECT_REF = "uydxfxifaquwmltonhbl"
OUT = Path("presentation_output")
QA_DIR = OUT / "qa"
MANIFEST_PATH = OUT / "delivery-manifest.json"

PDF_RE = re.compile(r"^CLIENT-(\d+)-(.+)-Material-Selection\.pdf$")


def fail(message: str) -> None:
    raise RuntimeError(message)


def client_slug(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    if not slug:
        fail(f"Cannot derive client slug from name: {name!r}")
    return slug


def required_credentials() -> tuple[str, str]:
    url = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()

    missing = []
    if not url:
        missing.append("SUPABASE_URL")
    if not key:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")
    if missing:
        fail(
            "Presentation delivery not attempted: missing required GitHub Actions "
            "secret(s): " + ", ".join(missing)
        )

    parsed = urlparse(url)
    expected_host = f"{EXPECTED_PROJECT_REF}.supabase.co"
    if parsed.scheme != "https" or parsed.hostname != expected_host:
        fail(
            "Presentation delivery not attempted: SUPABASE_URL does not target "
            f"the approved Innerspace-ai-sales project ({EXPECTED_PROJECT_REF}). "
            f"Expected host {expected_host!r}; got {parsed.hostname!r}."
        )

    return url, key


def selected_client_ids() -> list[str]:
    raw = os.environ.get("PRESENTATION_CLIENT_IDS", "").strip()
    if not raw:
        fail(
            "Presentation delivery not attempted: PRESENTATION_CLIENT_IDS is empty. "
            "Delivery requires an explicit client selection."
        )
    ids = []
    for value in raw.split(","):
        value = value.strip()
        if not value:
            continue
        ids.append(value.zfill(2))
    if not ids:
        fail("Presentation delivery not attempted: no valid client IDs selected.")
    return ids


def load_clients() -> dict[str, dict]:
    from presentation_jobs.batch_20260921 import CLIENTS

    return {str(client["id"]).zfill(2): client for client in CLIENTS}


def discover_deliveries() -> list[dict]:
    selected = selected_client_ids()
    clients = load_clients()
    deliveries = []

    for client_id in selected:
        client = clients.get(client_id)
        if client is None:
            fail(f"Unknown selected client ID: {client_id}")

        matches = sorted(OUT.glob(f"CLIENT-{client_id}-*-Material-Selection.pdf"))
        if len(matches) != 1:
            fail(
                f"Client {client_id}: expected exactly one final PDF after QA, "
                f"found {len(matches)}."
            )
        pdf_path = matches[0]
        match = PDF_RE.match(pdf_path.name)
        if not match:
            fail(f"Client {client_id}: unexpected final PDF filename {pdf_path.name!r}")

        qa_path = QA_DIR / f"CLIENT-{client_id}-layout-qa.json"
        if not qa_path.is_file():
            fail(f"Client {client_id}: final layout QA file is missing: {qa_path}")

        try:
            qa = json.loads(qa_path.read_text(encoding="utf-8"))
        except Exception as exc:
            fail(f"Client {client_id}: cannot read layout QA JSON: {exc}")

        if qa.get("ok") is not True:
            fail(
                f"Client {client_id}: layout QA is not PASS. "
                "No Supabase upload will be attempted."
            )

        if not pdf_path.is_file() or pdf_path.stat().st_size <= 0:
            fail(f"Client {client_id}: final PDF is missing or empty.")

        slug = client_slug(client["name"])
        base = f"presentations/{client_id}-{slug}"
        pdf_object_path = f"{base}/{pdf_path.name}"
        qa_object_path = f"{base}/layout-qa.json"

        deliveries.append(
            {
                "client_id": client_id,
                "client_name": client["name"],
                "pdf_filename": pdf_path.name,
                "bucket": BUCKET,
                "object_path": pdf_object_path,
                "qa_object_path": qa_object_path,
                "_pdf_path": pdf_path,
                "_qa_path": qa_path,
            }
        )

    # Fail closed before the first network request if the selected output set is incomplete.
    if len(deliveries) != len(selected):
        fail("Delivery preflight did not resolve every selected client.")

    return deliveries


def upload_object(
    supabase_url: str,
    service_role_key: str,
    object_path: str,
    local_path: Path,
    content_type: str,
) -> None:
    encoded = quote(object_path, safe="/")
    endpoint = f"{supabase_url}/storage/v1/object/{BUCKET}/{encoded}"
    headers = {
        "Authorization": f"Bearer {service_role_key}",
        "apikey": service_role_key,
        "Content-Type": content_type,
        "x-upsert": "true",
    }

    with local_path.open("rb") as handle:
        response = requests.post(endpoint, headers=headers, data=handle, timeout=120)

    if response.status_code < 200 or response.status_code >= 300:
        detail = response.text[:500]
        fail(
            f"Supabase upload failed for {BUCKET}/{object_path}: "
            f"HTTP {response.status_code}: {detail}"
        )


def write_manifest(deliveries: list[dict]) -> None:
    public_rows = [
        {
            "client_id": item["client_id"],
            "client_name": item["client_name"],
            "pdf_filename": item["pdf_filename"],
            "bucket": item["bucket"],
            "object_path": item["object_path"],
            "qa_object_path": item["qa_object_path"],
        }
        for item in deliveries
    ]
    MANIFEST_PATH.write_text(
        json.dumps({"deliveries": public_rows}, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    # Credentials and the complete QA-passed file set are validated before upload.
    supabase_url, service_role_key = required_credentials()
    deliveries = discover_deliveries()

    for item in deliveries:
        upload_object(
            supabase_url,
            service_role_key,
            item["object_path"],
            item["_pdf_path"],
            "application/pdf",
        )
        upload_object(
            supabase_url,
            service_role_key,
            item["qa_object_path"],
            item["_qa_path"],
            "application/json",
        )
        print(
            f"Delivered client {item['client_id']}: "
            f"{item['bucket']}/{item['object_path']}"
        )
        print(
            f"Delivered QA client {item['client_id']}: "
            f"{item['bucket']}/{item['qa_object_path']}"
        )

    write_manifest(deliveries)
    print(f"Delivery manifest: {MANIFEST_PATH}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
