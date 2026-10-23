import {env} from 'cloudflare:workers';
export async function readProfile(owner:string,accountId:string){const row=await (env as any).DB.prepare('SELECT data FROM campus_profiles WHERE id=? AND owner=?').bind(JSON.stringify([owner,accountId]),owner).first();return row?JSON.parse(row.data):{};}
