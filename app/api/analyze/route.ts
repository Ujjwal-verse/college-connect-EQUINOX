import {session,sameOrigin} from '../../../lib/session';
import {rules} from '../../../lib/rules';
// Normal report review is text-only. Photos are never forwarded to an AI here.
export async function POST(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Invalid origin.'},{status:403});
 const actor=await session();if(!actor)return Response.json({error:'Sign in required.'},{status:401});
 if(actor.user.role!=='student')return Response.json({error:'Student access required.'},{status:403});
 let b:any;try{b=await req.json()}catch{return Response.json({error:'Invalid request.'},{status:400})}
 if(!b||typeof b.description!=='string'||b.description.length>4000||b.location!=null&&typeof b.location!=='string')return Response.json({error:'Invalid description or location.'},{status:400});
 const matches=rules.filter(r=>r.words.test(b.description));
 return Response.json({title:b.description.slice(0,100),category:matches.length===1?matches[0].category:'',questions:[...(!b.location?.trim()?['Which building, floor and room is this in?']:[]),...(matches.length!==1?['Which category best describes this issue?']:[])],mode:'rules',message:'Text-based routing suggestion. Image analysis is only available in emergency reporting.'});
}
