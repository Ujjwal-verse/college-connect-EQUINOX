import {hashToken} from './session';
export const sharedCampus='campus-connect-shared-demo-v1';
export async function actorKey(s:any){return hashToken(JSON.stringify([s.owner,s.user.id]));}
export async function ownsTicket(t:any,s:any){return t.reporterKey?t.reporterKey===await actorKey(s):(t.reporterId||'student-01')===s.user.id;}
export async function presentTicket(t:any,s:any){
 const own=await ownsTicket(t,s);const {reporterKey,...safe}=t;
 const hide=t.anonymous&&(t.anonymousAudience!=='students'||s.user.role==='student'&&!own);
 if(hide){delete safe.reporterId;delete safe.reporterName;safe.history=t.history.map((h:any)=>({...h,actor:(h.action==='remind'||h.actor?.endsWith(' · student')||h.actor===t.reporterName||h.status==='Submitted')?'Anonymous student':h.actor}));}
 if(s.user.role==='student'&&!own){delete safe.reporterId;delete safe.photo;delete safe.mapCoordinates;delete safe.mapUrl;delete safe.acknowledgedBy;safe.history=t.history.map((h:any)=>({status:h.status,at:h.at,note:'Campus status updated.',actor:'Campus team'}));}
 return {...safe,isMine:own,communityVisible:t.visibility==='campus'};
}
