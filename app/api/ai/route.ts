import { handleAI } from '../../../lib/ai-service';
export const dynamic='force-dynamic';
const windows=new Map<string,{start:number;count:number}>();
function sessionAllowed(request:Request){
  // The current Sites audience is confirmed owner-private. Require platform identity
  // as well as the explicit session-key flag; never infer identity from client JSON.
  return process.env.ALLOW_SESSION_KEYS==='true'&&Boolean(request.headers.get('oai-authenticated-user-id'));
}
export async function GET(request:Request){return handleAI(request,{key:process.env.GEMINI_API_KEY,allowSessionKey:sessionAllowed(request)});}
export async function POST(request:Request){
  const identity=request.headers.get('oai-authenticated-user-id')??'private-site';
  const now=Date.now();const previous=windows.get(identity);const window=previous&&now-previous.start<60000?previous:{start:now,count:0};
  if(window.count>=8)return Response.json({error:'Please wait a minute before another AI request.'},{status:429,headers:{'Cache-Control':'no-store'}});
  window.count++;windows.set(identity,window);
  if(windows.size>1000)for(const [id,value]of windows)if(now-value.start>60000)windows.delete(id);
  return handleAI(request,{key:process.env.GEMINI_API_KEY,model:process.env.GEMINI_MODEL,allowSessionKey:sessionAllowed(request)});
}
