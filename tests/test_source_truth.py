import json,hashlib
from presentation_jobs.batch_20260921 import PRODUCTS,CLIENTS
BASELINE_SOURCE_TRUTH_SHA256='27d34fe8ebfdf9f2d0a0c12ae538b7a549935d3f0368e5e6bf58b06f7d2b3693'
def test_source_truth_snapshot_unchanged():
    payload=json.dumps({'PRODUCTS':PRODUCTS,'CLIENTS':CLIENTS},sort_keys=True,separators=(',',':'),ensure_ascii=False)
    assert hashlib.sha256(payload.encode()).hexdigest()==BASELINE_SOURCE_TRUTH_SHA256
def test_four_validation_clients_unchanged():
    assert [c['id'] for c in CLIENTS if c['id'] in {'10','11','12','13'}]==['10','11','12','13']
