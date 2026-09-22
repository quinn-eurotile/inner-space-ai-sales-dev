import json,hashlib
from presentation_jobs.batch_20260921 import PRODUCTS,CLIENTS
BASELINE_SOURCE_TRUTH_SHA256='de320a5222b1bcef856251d05c2ff08b5b63d1c83cda86ee6049e5c124cd7394'
def test_source_truth_snapshot_unchanged():
    payload=json.dumps({'PRODUCTS':PRODUCTS,'CLIENTS':CLIENTS},sort_keys=True,separators=(',',':'),ensure_ascii=False)
    assert hashlib.sha256(payload.encode()).hexdigest()==BASELINE_SOURCE_TRUTH_SHA256
def test_four_validation_clients_unchanged():
    assert [c['id'] for c in CLIENTS if c['id'] in {'10','11','12','13'}]==['10','11','12','13']
