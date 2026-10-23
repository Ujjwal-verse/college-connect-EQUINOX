// Exercise the actual route handlers with SQLite and mocked platform identity/cookie transport.
// This does not substitute for verifying the hosted ChatGPT sign-in boundary.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';
const root=process.cwd(),out=path.join(root,'.sites-runtime','role-tests');await fs.mkdir(out,{recursive:true});
const files=['lib/accounts.ts','lib/rules.ts','lib/session.ts','app/api/session/route.ts','app/api/tickets/route.ts','app/api/demo/route.ts','app/api/analyze/route.ts'];
for(const f of files){let code=await fs.readFile(path.join(root,f),'utf8');code=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;code=code.replace(/from ["']cloudflare:workers["']/g,"from '"+path.join(out,'mocks.mjs')+"'").replace(/from ["']next\/headers["']/g,"from '"+path.join(out,'mocks.mjs')+"'").replace(/from ["'][^"']*chatgpt-auth["']/g,"from '"+path.join(out,'mocks.mjs')+"'").replace(/from (["'])(\.[^"']+)\1/g,(_,q,s)=>`from ${q}${s}.mjs${q}`);const dest=path.join(out,f.replace(/\.ts$/,'.mjs'));await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,code);}
await fs.writeFile(path.join(out,'mocks.mjs'),`export const env=globalThis.__ccTest.env;export async function headers(){return new Headers({'x-campus-session':globalThis.__ccTest.token||''})};export async function getChatGPTUser(){return globalThis.__ccTest.owner?{userId:globalThis.__ccTest.owner}:null}`);
const sqlite=new DatabaseSync(':memory:');for(const f of (await fs.readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())sqlite.exec(await fs.readFile('drizzle/'+f,'utf8'));
const db={
 prepare(sql){
  return {bind(...args){
   return {
    async first(){return sqlite.prepare(sql).get(...args)||null},
    async all(){return {results:sqlite.prepare(sql).all(...args)}},
    async run(){return {meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}}}
   };
  }};
 },
 async batch(statements){sqlite.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());sqlite.exec('COMMIT');return out}catch(e){sqlite.exec('ROLLBACK');throw e}}
};
globalThis.__ccTest={env:{DB:db},owner:'test-owner',token:null};
const auth=await import(path.join(out,'app/api/session/route.mjs')),tickets=await import(path.join(out,'app/api/tickets/route.mjs')),demo=await import(path.join(out,'app/api/demo/route.mjs')),analyze=await import(path.join(out,'app/api/analyze/route.mjs'));
const {accounts}=await import(path.join(out,'lib/accounts.mjs'));
const req=(body={},method='POST',origin='https://campus.test')=>new Request('https://campus.test/api/test',{method,headers:{'Content-Type':'application/json',Origin:origin,'x-campus-session':globalThis.__ccTest.token||''},body:JSON.stringify(body)});
async function signin(id){const a=accounts.find(a=>a.id===id);const r=await auth.POST(req(a));assert.equal(r.status,200);const d=await r.json();globalThis.__ccTest.token=d.token;assert.equal(d.user.id,id);assert.equal(d.user.key,undefined);assert.equal(r.headers.get('Cache-Control'),'no-store');}
let checks=0;function eq(a,b){assert.deepEqual(a,b);checks++}
eq((await tickets.GET()).status,401);
eq((await auth.POST(req({role:'faculty',email:'dean@demo.university.test',key:'wrong'}))).status,401);
eq((await auth.POST(req(accounts[0],'POST','https://other.test'))).status,403);
await signin('student-01');
eq((await demo.POST(req())).status,403);
const a=await analyze.POST(req({description:'A tap is leaking water',location:''}));const ad=await a.json();eq(ad.mode,'rules');eq(ad.category,'Plumbing');eq(ad.questions.length>0,true);
const body={title:'Leaking laboratory tap',description:'Water is leaking from the tap near the chemistry laboratory.',location:'Science Block · Ground floor',category:'Plumbing'};
eq((await tickets.POST(req({...body,location:''}))).status,400);
let r=await tickets.POST(req({...body,reporterId:'student-02',assigneeId:'staff-plumbing',status:'Resolved'}));eq(r.status,201);let t=await r.json();eq(t.reporterId,'student-01');eq(t.status,'Submitted');
let patch=(extra={})=>req({id:t.id,version:t.version,note:'A meaningful test update.',...extra},'PATCH');
eq((await tickets.PATCH(patch({action:'assign',assigneeId:'staff-plumbing'}))).status,403);
await signin('student-02');eq((await (await tickets.GET()).json()).tickets.length,0);eq((await tickets.PATCH(patch({action:'verify'}))).status,403);
await signin('staff-plumbing');eq((await (await tickets.GET()).json()).tickets.length,1);eq((await tickets.PATCH(patch({action:'start'}))).status,403);eq((await tickets.POST(req(body))).status,403);
await signin('faculty-dean');eq((await (await tickets.GET()).json()).tickets.length,1);eq((await tickets.PATCH(patch({action:'assign',assigneeId:'staff-internet'}))).status,400);
r=await tickets.PATCH(patch({action:'assign',assigneeId:'staff-plumbing'}));eq(r.status,200);t=await r.json();eq(t.status,'Assigned');
eq((await tickets.PATCH(req({id:t.id,version:1,action:'note',note:'Stale update should be rejected'},'PATCH'))).status,409);
await signin('staff-internet');eq((await tickets.PATCH(patch({action:'start'}))).status,403);
await signin('staff-plumbing');eq((await (await tickets.GET()).json()).tickets.length,1);eq((await tickets.PATCH(patch({action:'complete'}))).status,403);
r=await tickets.PATCH(patch({action:'start'}));eq(r.status,200);t=await r.json();eq(t.status,'In progress');r=await tickets.PATCH(patch({action:'complete',note:'Replaced the washer and tested the tap.'}));eq(r.status,200);t=await r.json();eq(t.status,'Awaiting verification');eq((await tickets.PATCH(patch({action:'verify'}))).status,403);
await signin('student-01');r=await tickets.PATCH(patch({action:'verify',note:'I checked the tap and the leak has stopped.'}));eq(r.status,200);t=await r.json();eq(t.status,'Resolved');eq(t.history.length,5);r=await tickets.PATCH(patch({action:'reopen',note:'The leak has started again. Please check.'}));eq(r.status,200);t=await r.json();eq(t.status,'Assigned');
await signin('faculty-warden');eq((await demo.POST(req())).status,200);eq((await (await demo.POST(req())).json()).added,0);let all=(await (await tickets.GET()).json()).tickets;eq(all.length,7);eq(new Set(all.map(x=>x.status)).size,5);const other=all.find(x=>x.id!==t.id&&x.category==='Plumbing');r=await tickets.PATCH(patch({action:'link',linkedTo:other.id,note:'Reviewed: same tap and location. Preserve both reports.'}));eq(r.status,200);t=await r.json();eq(t.linkedTo,other.id);
await signin('student-01');r=await tickets.POST(req({...body,title:'Urgent anonymous leak',anonymous:true,priority:'emergency'}));eq(r.status,201);const anonymous=await r.json();eq(anonymous.reporterId,undefined);eq(anonymous.reporterName,undefined);eq(anonymous.priority,'emergency');eq(anonymous.status,'Assigned');await signin('faculty-dean');const anonymized=(await (await tickets.GET()).json()).tickets.find(x=>x.id===anonymous.id);eq(anonymized.anonymous,true);eq(anonymized.reporterName,undefined);eq(anonymized.history[0].actor,'Anonymous student');
await signin('student-01');r=await tickets.POST(req({...body,title:'Fire alert near the library',description:'Smoke and flames reported near the library entrance. Please respond.',category:'Electricity',priority:'fire',mapCoordinates:'12.971600,77.594600'}));eq(r.status,201);const fire=await r.json();eq(fire.priority,'fire');eq(fire.status,'Assigned');eq(fire.mapCoordinates,'12.971600,77.594600');eq(fire.mapUrl,'https://www.google.com/maps?q=12.971600%2C77.594600');await signin('staff-plumbing');let staffTickets=(await (await tickets.GET()).json()).tickets;eq(staffTickets.some(x=>x.id===fire.id),true);r=await tickets.PATCH(req({id:fire.id,version:fire.version,action:'acknowledge',note:'Seen by campus staff. Security is being contacted.'},'PATCH'));eq(r.status,200);eq((await r.json()).acknowledgedBy,'Ravi Kumar');
const oldToken=globalThis.__ccTest.token;await auth.DELETE(req({},'DELETE'));eq((await tickets.GET()).status,401);globalThis.__ccTest.token=oldToken;eq((await tickets.GET()).status,401);
await signin('faculty-dean');globalThis.__ccTest.owner='different-owner';eq((await tickets.GET()).status,401);globalThis.__ccTest.owner=null;eq((await auth.POST(req(accounts[0]))).status,401);
console.log('PASS: '+checks+' assertions across role permissions, workflow stages, persistence, isolation, duplicate linking, login and logout.');
