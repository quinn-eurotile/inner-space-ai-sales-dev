import os
from presentation_builder import PresentationBuilder
from presentation_jobs.batch_20260921 import PRODUCTS, CLIENTS

# Presentation Builder v1.0 compatibility entry point.
# Orchestration supplies structured data; this layer only selects/builds jobs.
raw_ids=os.getenv('PRESENTATION_CLIENT_IDS','').strip()
if raw_ids:
    wanted={x.strip().zfill(2) for x in raw_ids.split(',') if x.strip()}
    jobs=[c for c in CLIENTS if c['id'] in wanted]
else:
    jobs=CLIENTS
if not jobs:
    raise RuntimeError('No presentation jobs selected')

builder=PresentationBuilder(PRODUCTS)
paths=[]
for job in jobs:
    p,_=builder.build(job); paths.append(p)
print('Generated',len(paths),'PDFs')
for p in paths: print(p)
