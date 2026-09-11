from pathlib import Path
import struct,json
root=Path('.tmp/figma-analysis')
class Reader:
 def __init__(self,b): self.b=b;self.i=0
 def byte(self):
  v=self.b[self.i];self.i+=1;return v
 def uint(self):
  v=0;s=0
  while True:
   b=self.byte();v|=(b&127)<<s;s+=7
   if b<128:return v
 def sint(self):
  v=self.uint();return ~(v>>1) if v&1 else v>>1
 def string(self):
  e=self.b.index(0,self.i);s=self.b[self.i:e].decode('utf8');self.i=e+1;return s
 def float(self):
  if self.b[self.i]==0:self.i+=1;return 0
  v=struct.unpack_from('<I',self.b,self.i)[0];self.i+=4
  return struct.unpack('<f',struct.pack('<I',((v<<23)|(v>>9))&0xffffffff))[0]
r=Reader((root/'chunk0.bin').read_bytes());defs=[]
for _ in range(r.uint()):
 name=r.string();kind=r.byte();fields=[]
 for _ in range(r.uint()): fields.append(dict(name=r.string(),type=r.sint(),array=bool(r.byte()&1),id=r.uint()))
 defs.append(dict(name=name,kind=kind,fields=fields))
(root/'schema.json').write_text(json.dumps(defs),encoding='utf8')
r=Reader((root/'chunk1.bin').read_bytes())
def read(t):
 if t<0:return [lambda:bool(r.byte()),r.byte,r.sint,r.uint,r.float,r.string,r.sint,r.uint][~t]()
 d=defs[t]
 if d['kind']==0:
  v=r.uint();return next((f['name'] for f in d['fields'] if f['id']==v),v)
 result={};fields=d['fields'];index=0;lookup={f['id']:f for f in fields}
 while True:
  if d['kind']==2:
   k=r.uint()
   if k==0:break
   f=lookup[k]
  else:
   if index==len(fields):break
   f=fields[index];index+=1
  result[f['name']]=[read(f['type']) for _ in range(r.uint())] if f['array'] else read(f['type'])
 return result
msg=read(next(i for i,d in enumerate(defs) if d['name']=='Message'))
(root/'document.json').write_text(json.dumps(msg,ensure_ascii=False),encoding='utf8')
print('Read bytes',r.i,len(r.b),'Keys',list(msg),'Nodes',len(msg.get('nodeChanges',[])))
for n in msg.get('nodeChanges',[])[:8]: print(str(n)[:1600])
