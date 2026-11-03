import { sameOrigin, privateJSON } from '../../../lib/http-security';
import { verifiedAccount } from '../../../lib/supabase/server';
import { handleAI } from '../../../lib/ai-service';
import { resolveAIConfig } from '../../../lib/ai-config';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const maxDuration=30;
const windows=new Map<string,{start:number;count:number}>();
export async function GET(request:Request){const account=await verifiedAccount();if(!account)return Response.json({available:false,provider:'Gemini',sessionKeyAllowed:false},{headers:{'Cache-Control':'private, no-store'}});return handleAI(request,resolveAIConfig(request,process.env));}
export async function POST(request:Request){
  if(!sameOrigin(request))return privateJSON({error:'Use this application on its own site.'},403);
  const account=await verifiedAccount();
  if(!account)return Response.json({error:'Sign in to request a Gemini interpretation.'},{status:401,headers:{'Cache-Control':'private, no-store'}});
  const admitRequest=()=>{
  const identity=account.user.id;
  const now=Date.now();const previous=windows.get(identity);const window=previous&&now-previous.start<60000?previous:{start:now,count:0};
  if(window.count>=8)return false;
  window.count++;windows.set(identity,window);
  if(windows.size>1000)for(const [id,value]of windows)if(now-value.start>60000)windows.delete(id);
  return true;
  };
  return handleAI(request,{...resolveAIConfig(request,process.env),admitRequest});
}
