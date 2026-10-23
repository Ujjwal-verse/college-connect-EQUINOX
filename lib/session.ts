import {env} from 'cloudflare:workers';
import {headers} from 'next/headers';
import {getChatGPTUser} from '../app/chatgpt-auth';
import {accounts,publicAccount} from './accounts';
import {readProfile} from './profile';
export const sessionHeader='x-campus-session';
export async function currentToken(){return (await headers()).get(sessionHeader);}
export async function hashToken(token:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function session(){const platform=await getChatGPTUser();if(!platform)return null;const token=await currentToken();if(!token)return null;const row=await (env as any).DB.prepare('SELECT account_id FROM demo_sessions WHERE token_hash=? AND owner=? AND expires>?').bind(await hashToken(token),platform.userId,Date.now()).first();const a=accounts.find(a=>a.id===row?.account_id);return a?{owner:platform.userId,user:{...publicAccount(a),...await readProfile(platform.userId,a.id)}}:null;}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');return !origin||origin===new URL(req.url).origin;}
