# -*- coding: utf-8 -*-
import os, json
HERE = os.path.dirname(__file__)
OUT  = os.path.join(HERE, '..', 'assessment', 'starting-point', 'en', 'index.html')

tpl   = open(os.path.join(HERE, 'index_template.html'), encoding='utf-8').read()
qs    = open(os.path.join(HERE, 'intake_questions.html'), encoding='utf-8').read()
qids  = json.load(open(os.path.join(HERE, 'intake_qids.json'), encoding='utf-8'))

html = tpl.replace('<!--QUESTIONS-->', qs)
html = html.replace('/*QIDS*/[]', json.dumps(qids))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w', encoding='utf-8').write(html)
print('wrote', os.path.normpath(OUT), '(%d bytes)' % len(html.encode('utf-8')))
print('qids:', qids)
