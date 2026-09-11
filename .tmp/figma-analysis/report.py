import json
from pathlib import Path
root=Path('.tmp/figma-analysis');ns=json.loads((root/'document.json').read_text(encoding='utf8'))['nodeChanges']
def k(g):return f"{g.get('sessionID')}:{g.get('localID')}"
by={k(n['guid']):n for n in ns};ch={}
for n in ns:ch.setdefault(k(n.get('parentIndex',{}).get('guid',{})),[]).append(n)
for a in ch.values():a.sort(key=lambda n:n.get('parentIndex',{}).get('position',''))
def walk(n,depth=0,seen=()):
 i=k(n['guid']);out={a:n[a] for a in ['type','name','size','transform','fontName','fontSize','lineHeight','stackMode','stackSpacing','stackHorizontalPadding','stackVerticalPadding','stackPaddingRight','stackPaddingBottom','cornerRadius','fillPaints','strokePaints'] if a in n}
 if 'textData' in n:out['text']=n['textData'].get('characters')
 if n.get('symbolData'):out['symbol']=k(n['symbolData']['symbolID']);out['overrides']=[{a:v for a,v in o.items() if a not in ['prototypeInteractions','fillGeometry','strokeGeometry']} for o in n['symbolData'].get('symbolOverrides',[])]
 lines=[' '*depth+i+' '+json.dumps(out,ensure_ascii=False)]
 if depth<10 and i not in seen:
  children=ch.get(i,[])
  if not children and out.get('symbol'):children=ch.get(out['symbol'],[])
  for c in children:lines+=walk(c,depth+1,seen+(i,))
 return lines
for n in ch['1:16']:
 if n['type']=='FRAME':(root/(k(n['guid']).replace(':','-')+'.txt')).write_text('\n'.join(walk(n)),encoding='utf8')
print('\n'.join(k(n['guid'])+' '+n['name'] for n in ch['1:16'] if n['type']=='FRAME'))
