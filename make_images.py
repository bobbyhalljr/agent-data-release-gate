from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
p=Path('/home/cua/workspace/2026-10-10-instant-data-gate/images')
bg='#0b0920'; panel='#18142e'; cyan='#67eee0'; purple='#ac97ff'; white='#f7f1ff'; muted='#b3acc9'; red='#ff86a2'
def f(n,b=False):return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans'+('-Bold' if b else '')+'.ttf',n)
def text(d,xy,s,n=28,color=white,b=False,maxw=1450):
 assert d.textbbox((0,0),s,font=f(n,b))[2]<=maxw,(s,n,maxw)
 d.text(xy,s,font=f(n,b),fill=color)
def base(title,sub,h=900):
 im=Image.new('RGB',(1600,h),bg);d=ImageDraw.Draw(im)
 for x in range(0,1600,80):d.line((x,0,x,h),fill='#15112b')
 text(d,(70,40),'BHJR  /  AI ENGINEERING',20,cyan,True)
 text(d,(70,105),title,48,white,True)
 text(d,(70,176),sub,25,muted)
 return im,d
def box(d,r,title,lines,col=cyan):
 d.rounded_rectangle(r,24,fill=panel,outline=col,width=2)
 x,y,x2,y2=r;text(d,(x+26,y+24),title,27,col,True,maxw=x2-x-52)
 for i,s in enumerate(lines):text(d,(x+26,y+85+45*i),s,25,white,maxw=x2-x-52)
def arrow(d,a,b):
 d.line((*a,*b),width=5,fill=purple);x,y=b;d.polygon([(x,y),(x-17,y-12),(x-17,y+12)],fill=purple)
im,d=base('Your agent bought a tool.','Who got your data?  |  Composio Instant launched October 8, 2026',672)
box(d,(70,255,720,535),'READ-ONLY SEARCH',['Company name: public','Renewal notes: internal','Both can travel in an input.'],red)
box(d,(850,255,1530,535),'CHECK DATA BEFORE DISPATCH',['Known recipient + task scope','Trusted field classifications','Only the permitted projection.'])
text(d,(70,605),'25 local checks  /  Fictional fixtures  /  No provider call',22,muted);im.save(p/'cover.png')
im,d=base('Read-only does not mean data stays home.','The operation can be identical. The disclosure is different.')
box(d,(70,280,735,620),'APPROVED PUBLIC INPUT',['Example Robotics','example.com','Research provider receives these.'])
box(d,(865,280,1530,620),'PRIVATE CONTEXT IN INPUT',['Internal renewal discussion','Added to the same search query','Research route denies this field.'],red)
text(d,(70,725),'A read-only hint describes the operation.',34,white,True)
text(d,(70,785),'Your application still decides what information may leave.',32,cyan);im.save(p/'read-only.png')
im,d=base('Let the model select. Let the app supply.','The proposal contains identifiers, not outgoing free text.')
box(d,(70,300,440,625),'MODEL PROPOSAL',['tool','recordIds','fields'],purple)
box(d,(600,300,1040,625),'APPLICATION GATE',['Task + recipient scope','Tenant ownership','Field classifications'])
box(d,(1200,300,1530,625),'PROJECTION',['Known recipient','Selected values','All or nothing'],purple)
arrow(d,(450,445),(590,445));arrow(d,(1050,445),(1190,445))
text(d,(70,735),'Trusted records and policy come from application state.',31,white,True)
text(d,(70,790),'Extra query or label keys are rejected.',29,cyan);im.save(p/'projection.png')
im,d=base('Four calls. Four concrete decisions.','Exact fixture outcomes. No provider requests are made.')
rows=[('PUBLIC SEARCH','company + domain','research-provider','ALLOW',cyan),('PRIVATE SEARCH','internal notes','research-provider','DENY',red),('PERMITTED CRM','internal notes','tenant-crm','ALLOW',cyan),('CROSS-TENANT','public company','research-provider','DENY',red)]
for i,(name,fields,route,result,col) in enumerate(rows):
 y=270+i*135;d.rounded_rectangle((70,y,1530,y+110),18,fill=panel)
 text(d,(95,y+20),name,24,purple,True,maxw=320)
 text(d,(435,y+20),fields,25,white,maxw=390)
 text(d,(885,y+20),route,25,muted,maxw=400)
 text(d,(1350,y+20),result,28,col,True,maxw=150)
text(d,(70,830),'Connected credentials do not inherently grant data release permission.',27,cyan);im.save(p/'decisions.png')
thumbs=[]
for name in ['cover','read-only','projection','decisions']:
 t=Image.open(p/(name+'.png'));t.thumbnail((800,450));thumbs.append(t)
contact=Image.new('RGB',(1600,900),bg)
for i,t in enumerate(thumbs):contact.paste(t,((i%2)*800,(i//2)*450))
contact.save(p/'contact-sheet.png')
