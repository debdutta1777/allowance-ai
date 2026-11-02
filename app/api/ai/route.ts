import { handleAI } from '../../../lib/ai-service';
import { resolveAIConfig } from '../../../lib/ai-config';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const maxDuration=30;
const windows=new Map<string,{start:number;count:number}>();
export async function GET(request:Request){return handleAI(request,resolveAIConfig(request,process.env));}
export async function POST(request:Request){
  const admitRequest=()=>{
  const identity=process.env.VERCEL==='1'?'shared-server':request.headers.get('oai-authenticated-user-id')??'shared-server';
  const now=Date.now();const previous=windows.get(identity);const window=previous&&now-previous.start<60000?previous:{start:now,count:0};
  if(window.count>=8)return false;
  window.count++;windows.set(identity,window);
  if(windows.size>1000)for(const [id,value]of windows)if(now-value.start>60000)windows.delete(id);
  return true;
  };
  return handleAI(request,{...resolveAIConfig(request,process.env),admitRequest});
}
