// Exercise the actual route handlers with SQLite and mocked platform identity/cookie transport.
// This does not substitute for verifying the hosted ChatGPT sign-in boundary.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';
const root=process.cwd(),out=path.join(root,'.sites-runtime','role-tests');await fs.mkdir(out,{recursive:true});
const files=['lib/accounts.ts','lib/rules.ts','lib/session.ts','lib/profile.ts','lib/community.ts','app/api/community/route.ts','lib/events.ts','app/api/profile/route.ts','app/api/events/route.ts','app/api/session/route.ts','app/api/tickets/route.ts','app/api/demo/route.ts','app/api/analyze/route.ts','app/api/emergency-image/route.ts'];
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
const emergencyImage=await import(path.join(out,'app/api/emergency-image/route.mjs'));
const community=await import(path.join(out,'app/api/community/route.mjs'));
const profile=await import(path.join(out,'app/api/profile/route.mjs')),events=await import(path.join(out,'app/api/events/route.mjs'));
const {accounts}=await import(path.join(out,'lib/accounts.mjs'));
const req=(body={},method='POST',origin='https://campus.test')=>new Request('https://campus.test/api/test',{method,headers:{'Content-Type':'application/json',Origin:origin,'x-campus-session':globalThis.__ccTest.token||''},body:JSON.stringify(body)});
async function signin(id){if(globalThis.__ccTest.token)await auth.DELETE(req({},'DELETE'));const a=accounts.find(a=>a.id===id);const r=await auth.POST(req(a));assert.equal(r.status,200);const d=await r.json();globalThis.__ccTest.token=d.token;assert.equal(d.user.id,id);assert.equal(d.user.key,undefined);assert.equal(r.headers.get('Cache-Control'),'no-store');}
let checks=0;function eq(a,b){assert.deepEqual(a,b);checks++}
eq((await tickets.GET()).status,401);
eq((await auth.POST(req({role:'faculty',email:'dean@demo.university.test',key:'wrong'}))).status,401);
eq((await auth.POST(req(accounts[0],'POST','https://other.test'))).status,403);
await signin('student-01');
eq((await auth.POST(req(accounts.find(a=>a.id==='staff-plumbing')))).status,409);
eq((await demo.POST(req())).status,403);
const a=await analyze.POST(req({description:'A tap is leaking water',location:''}));const ad=await a.json();eq(ad.mode,'rules');eq(ad.category,'Plumbing');eq(ad.questions.length>0,true);
// Emergency image AI is opt-in, student-only, and never used by normal report review.
const image='data:image/jpeg;base64,/9j/2Q==';
eq((await emergencyImage.POST(req({priority:'normal',photo:image}))).status,400);
eq((await emergencyImage.POST(req({priority:'fire',photo:'not-an-image'}))).status,400);
eq((await emergencyImage.POST(req({priority:'fire',photo:image}))).status,503);
const oldFetch=globalThis.fetch;let aiCalls=0;
globalThis.__ccTest.env.GEMINI_API_KEY='test-secret';globalThis.__ccTest.env.GEMINI_MODEL='test-model';
globalThis.fetch=async(url,options)=>{aiCalls++;const payload=JSON.parse(options.body);eq(payload.contents[0].parts[1].inlineData.data,'/9j/2Q==');eq(options.headers['x-goog-api-key'],'test-secret');return Response.json({candidates:[{content:{parts:[{text:JSON.stringify({observation:'Possible smoke, but the image is uncertain.',hazard:'fire_or_smoke'})}]}}]})};
eq((await (await analyze.POST(req({description:'Water leaking from a pipe',location:'Hostel',photo:image}))).json()).mode,'rules');eq(aiCalls,0);
const vision=await emergencyImage.POST(req({priority:'fire',photo:image}));eq(vision.status,200);eq((await vision.json()).mode,'gemini');eq(aiCalls,1);
globalThis.fetch=async()=>Response.json({error:'unavailable'},{status:429});eq((await emergencyImage.POST(req({priority:'emergency',photo:image}))).status,503);
globalThis.fetch=oldFetch;delete globalThis.__ccTest.env.GEMINI_API_KEY;delete globalThis.__ccTest.env.GEMINI_MODEL;
await signin('staff-plumbing');eq((await emergencyImage.POST(req({priority:'fire',photo:image}))).status,403);await signin('student-01');
const body={title:'Leaking laboratory tap',description:'Water is leaking from the tap near the chemistry laboratory.',location:'Science Block · Ground floor',category:'Plumbing'};
eq((await tickets.POST(req({...body,location:''}))).status,400);
let r=await tickets.POST(req({...body,reporterId:'student-02',assigneeId:'staff-plumbing',status:'Resolved'}));eq(r.status,201);let t=await r.json();eq(t.reporterId,'student-01');eq(t.status,'Submitted');
let patch=(extra={})=>req({id:t.id,version:t.version,note:'A meaningful test update.',...extra},'PATCH');
eq((await tickets.PATCH(patch({action:'assign',assigneeId:'staff-plumbing'}))).status,403);
await signin('student-02');eq((await (await tickets.GET()).json()).tickets.length,1);eq((await tickets.PATCH(patch({action:'verify'}))).status,403);
await signin('staff-plumbing');eq((await (await tickets.GET()).json()).tickets.length,1);eq((await tickets.PATCH(patch({action:'start'}))).status,403);eq((await tickets.POST(req(body))).status,403);
await signin('faculty-dean');eq((await (await tickets.GET()).json()).tickets.length,1);eq((await tickets.PATCH(patch({action:'assign',assigneeId:'staff-internet'}))).status,400);
r=await tickets.PATCH(patch({action:'assign',assigneeId:'staff-plumbing'}));eq(r.status,200);t=await r.json();eq(t.status,'Assigned');
eq((await tickets.PATCH(req({id:t.id,version:1,action:'note',note:'Stale update should be rejected'},'PATCH'))).status,409);
await signin('staff-internet');eq((await tickets.PATCH(patch({action:'start'}))).status,403);
await signin('staff-plumbing');eq((await (await tickets.GET()).json()).tickets.length,1);eq((await tickets.PATCH(patch({action:'complete'}))).status,403);
r=await tickets.PATCH(patch({action:'start'}));eq(r.status,200);t=await r.json();eq(t.status,'In progress');r=await tickets.PATCH(patch({action:'complete',note:'Replaced the washer and tested the tap.'}));eq(r.status,200);t=await r.json();eq(t.status,'Awaiting verification');eq((await tickets.PATCH(patch({action:'verify'}))).status,403);
await signin('student-01');eq((await tickets.PATCH(patch({action:'verify'}))).status,403);await signin('faculty-dean');r=await tickets.PATCH(patch({action:'verify',note:'I checked the tap and the leak has stopped.'}));eq(r.status,200);t=await r.json();eq(t.status,'Resolved');eq(t.history.length,5);r=await tickets.PATCH(patch({action:'reopen',note:'The leak has started again. Please check.'}));eq(r.status,200);t=await r.json();eq(t.status,'Assigned');
await signin('faculty-warden');eq((await demo.POST(req())).status,200);eq((await (await demo.POST(req())).json()).added,0);let all=(await (await tickets.GET()).json()).tickets;eq(all.length,7);eq(new Set(all.map(x=>x.status)).size,5);const other=all.find(x=>x.id!==t.id&&x.category==='Plumbing');r=await tickets.PATCH(patch({action:'link',linkedTo:other.id,note:'Reviewed: same tap and location. Preserve both reports.'}));eq(r.status,200);t=await r.json();eq(t.linkedTo,other.id);
await signin('student-01');r=await tickets.POST(req({...body,title:'Urgent anonymous leak',anonymous:true,priority:'emergency'}));eq(r.status,201);const anonymous=await r.json();eq(anonymous.reporterId,'student-01');eq(anonymous.reporterName,'Aarav Sharma');eq(anonymous.priority,'emergency');eq(anonymous.status,'Assigned');await signin('faculty-dean');const anonymized=(await (await tickets.GET()).json()).tickets.find(x=>x.id===anonymous.id);eq(anonymized.anonymous,true);eq(anonymized.reporterName,'Aarav Sharma');eq(anonymized.history[0].actor,'Aarav Sharma');
await signin('student-01');r=await tickets.POST(req({...body,title:'Fire alert near the library',description:'Smoke and flames reported near the library entrance. Please respond.',category:'Electricity',priority:'fire',mapCoordinates:'12.971600,77.594600'}));eq(r.status,201);const fire=await r.json();eq(fire.priority,'fire');eq(fire.status,'Assigned');eq(fire.mapCoordinates,'12.971600,77.594600');eq(fire.mapUrl,'https://www.google.com/maps?q=12.971600%2C77.594600');await signin('staff-plumbing');let staffTickets=(await (await tickets.GET()).json()).tickets;eq(staffTickets.some(x=>x.id===fire.id),true);r=await tickets.PATCH(req({id:fire.id,version:fire.version,action:'acknowledge',note:'Seen by campus staff. Security is being contacted.'},'PATCH'));eq(r.status,200);eq((await r.json()).acknowledgedBy,'Ravi Kumar');
// Acceptance must work without a mandatory note; completion still requires evidence.
await signin('student-01');r=await tickets.POST(req(body));let claimTicket=await r.json();
await signin('staff-plumbing');r=await tickets.PATCH(req({id:claimTicket.id,version:claimTicket.version,action:'claim'},'PATCH'));eq(r.status,200);claimTicket=await r.json();eq(claimTicket.assigneeId,'staff-plumbing');eq(claimTicket.status,'Assigned');
r=await tickets.PATCH(req({id:claimTicket.id,version:claimTicket.version,action:'start',note:''},'PATCH'));eq(r.status,200);claimTicket=await r.json();eq(claimTicket.status,'In progress');
eq((await tickets.PATCH(req({id:claimTicket.id,version:claimTicket.version,action:'complete',note:''},'PATCH'))).status,400);
await signin('student-01');r=await tickets.PATCH(req({id:claimTicket.id,version:claimTicket.version,action:'remind'},'PATCH'));eq(r.status,200);claimTicket=await r.json();eq(claimTicket.reminderCount,1);eq(claimTicket.status,'In progress');eq((await tickets.PATCH(req({id:claimTicket.id,version:claimTicket.version,action:'remind'},'PATCH'))).status,429);
await signin('student-02');eq((await tickets.PATCH(req({id:claimTicket.id,version:claimTicket.version,action:'remind'},'PATCH'))).status,403);
await signin('staff-plumbing');const reminded=(await (await tickets.GET()).json()).tickets.find(x=>x.id===claimTicket.id);eq(reminded.history.at(-1).action,'remind');eq((await tickets.PATCH(req({id:claimTicket.id,version:claimTicket.version,action:'remind'},'PATCH'))).status,403);
await signin('student-01');const profileBody={name:'Updated Student',contactEmail:'student@example.test',contactPhone:'+91 9999999999',room:'Hostel B 203',bio:'Robotics and campus music',role:'faculty',id:'faculty-dean'};
r=await profile.PATCH(req(profileBody,'PATCH'));eq(r.status,200);let updated=(await r.json()).user;eq(updated.role,'student');eq(updated.id,'student-01');eq(updated.name,'Updated Student');
await signin('student-01');eq((await (await auth.GET()).json()).user.name,'Updated Student');eq((await profile.PATCH(req({...profileBody,contactEmail:'bad'},'PATCH'))).status,400);
await signin('student-02');eq((await (await auth.GET()).json()).user.name,'Meera Rao');
await signin('student-01');eq((await events.PATCH(req({eventId:'missing',response:'Going'},'PATCH'))).status,400);
for(const response of ['Going','Maybe','Not going']){eq((await events.PATCH(req({eventId:'courtyard-evening',response},'PATCH'))).status,200);eq((await (await events.GET()).json()).responses['courtyard-evening'],response);}
await signin('student-01');eq((await (await events.GET()).json()).responses['courtyard-evening'],'Not going');await signin('student-02');eq((await (await events.GET()).json()).responses['courtyard-evening'],undefined);
// Shared campus, peer-only anonymity and immutable report ownership across Site accounts.
await signin('student-02');let feed=(await (await tickets.GET()).json()).tickets;let peer=feed.find(x=>x.id===anonymous.id);eq(peer.reporterName,undefined);eq(peer.reporterId,undefined);eq(peer.reporterKey,undefined);eq(peer.photo,undefined);eq(peer.isMine,false);eq(JSON.stringify(peer).includes('Aarav'),false);
await signin('student-01');r=await community.POST(req({body:'Please update us on this repair.',anonymous:true,ticketId:anonymous.id}));eq(r.status,201);const messageId=(await r.json()).id;
eq((await community.POST(req({body:'Too soon'}))).status,429);eq((await community.POST(req({body:'x'.repeat(1001)}))).status,400);
await signin('student-02');let messages=(await (await community.GET(new Request('https://campus.test/api/community'))).json()).messages;let message=messages.find(m=>m.id===messageId);eq(message.author,'Anonymous student');eq(message.isMine,false);eq(message.sender_key,undefined);eq((await community.PATCH(req({id:messageId},'PATCH'))).status,403);
await signin('faculty-dean');messages=(await (await community.GET(new Request('https://campus.test/api/community'))).json()).messages;eq(messages.find(m=>m.id===messageId).author,'Updated Student');
await auth.DELETE(req({},'DELETE'));globalThis.__ccTest.owner='second-site-account';globalThis.__ccTest.token=null;await signin('student-01');feed=(await (await tickets.GET()).json()).tickets;peer=feed.find(x=>x.id===anonymous.id);eq(peer.isMine,false);eq(peer.reporterName,undefined);eq((await tickets.PATCH(req({id:claimTicket.id,version:claimTicket.version,action:'remind'},'PATCH'))).status,403);messages=(await (await community.GET(new Request('https://campus.test/api/community'))).json()).messages;eq(messages.some(m=>m.id===messageId),true);eq(messages.find(m=>m.id===messageId).author,'Anonymous student');
// Legacy reports stay in their original owner scope.
eq(feed.some(x=>/^CC-D[0-5]-/.test(x.id)),false);
await signin('faculty-dean');eq((await community.PATCH(req({id:messageId},'PATCH'))).status,200);messages=(await (await community.GET(new Request('https://campus.test/api/community'))).json()).messages;eq(messages.find(m=>m.id===messageId).body,'Message removed by a moderator.');
await auth.DELETE(req({},'DELETE'));globalThis.__ccTest.owner='test-owner';globalThis.__ccTest.token=null;await signin('student-01');
const oldToken=globalThis.__ccTest.token;await auth.DELETE(req({},'DELETE'));eq((await tickets.GET()).status,401);globalThis.__ccTest.token=oldToken;eq((await tickets.GET()).status,401);
await signin('faculty-dean');globalThis.__ccTest.owner='different-owner';eq((await tickets.GET()).status,401);globalThis.__ccTest.owner=null;eq((await auth.POST(req(accounts[0]))).status,401);
console.log('PASS: '+checks+' assertions across role permissions, workflow stages, persistence, isolation, duplicate linking, login and logout.');
