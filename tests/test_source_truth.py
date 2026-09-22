import json,hashlib
from presentation_jobs.batch_20260921 import PRODUCTS,CLIENTS
BASELINE_SOURCE_TRUTH_SHA256='fd223a33a6fb652c78d1ba75981048c3ccb477435f6bc246bfb17446790814f2'
def test_source_truth_snapshot_unchanged():
    payload=json.dumps({'PRODUCTS':PRODUCTS,'CLIENTS':CLIENTS},sort_keys=True,separators=(',',':'),ensure_ascii=False)
    assert hashlib.sha256(payload.encode()).hexdigest()==BASELINE_SOURCE_TRUTH_SHA256
def test_four_validation_clients_unchanged():
    assert [c['id'] for c in CLIENTS if c['id'] in {'10','11','12','13'}]==['10','11','12','13']
