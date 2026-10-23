import {env} from 'cloudflare:workers';
import {session,sameOrigin} from '../../../lib/session';
export const dynamic='force-dynamic';
export async function PATCH(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Invalid request origin.'},{status:403});
 const s=await session();if(!s)return Response.json({error:'Please sign in.'},{status:401});
 const b=await req.json() as any;
 const fields={name:80,contactEmail:160,contactPhone:30,room:120,bio:300};const profile:Record<string,string>={};
 for(const [key,max] of Object.entries(fields)){if(typeof b[key]!=='string'||b[key].trim().length>max)return Response.json({error:'Please check your profile fields.'},{status:400});profile[key]=b[key].trim();}
 if(profile.name.length<2||profile.contactEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.contactEmail)||profile.contactPhone&&!/^[+\d ()-]{7,30}$/.test(profile.contactPhone))return Response.json({error:'Enter a name and valid optional contact details.'},{status:400});
 await (env as any).DB.prepare('INSERT INTO campus_profiles (id,owner,account_id,data) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').bind(JSON.stringify([s.owner,s.user.id]),s.owner,s.user.id,JSON.stringify(profile)).run();
 return Response.json({user:{...s.user,...profile}},{headers:{'Cache-Control':'no-store'}});
}
