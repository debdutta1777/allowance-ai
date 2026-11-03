import { verifiedAccount } from '../../../lib/supabase/server';
import { boundedJSON,privateJSON,sameOrigin } from '../../../lib/http-security';
import { emptyWorkspace,validateWorkspace } from '../../../lib/workspace-model';
export const dynamic='force-dynamic';export const runtime='nodejs';
export async function GET(){
  const account=await verifiedAccount();if(!account)return privateJSON({error:'Sign in to access your workspace.'},401);
  const {data,error}=await account.client.from('allowance_workspaces').select('document,revision,updated_at').eq('user_id',account.user.id).maybeSingle();
  if(error)return privateJSON({error:'Your workspace could not be loaded. Please retry.'},503);
  if(!data)return privateJSON({workspace:emptyWorkspace(),revision:0,accountId:account.user.id});
  try{return privateJSON({workspace:validateWorkspace(data.document),revision:data.revision,updatedAt:data.updated_at,accountId:account.user.id});}catch{return privateJSON({error:'Stored workspace needs recovery. Your data has not been replaced.'},422);}
}
export async function PUT(request:Request){
  if(!sameOrigin(request))return privateJSON({error:'Use this application on its own site.'},403);
  const account=await verifiedAccount();if(!account)return privateJSON({error:'Sign in to save your workspace.'},401);
  try{
    const body=await boundedJSON(request);if(body.accountId!==account.user.id)return privateJSON({error:'Your signed-in account changed. Reload before saving; this workspace was not written.'},409);if(!Number.isSafeInteger(body.revision)||body.revision<0)throw new Error();
    const document=validateWorkspace(body.workspace);const revision=body.revision+1;if(!Number.isSafeInteger(revision))throw new Error();
    const row={user_id:account.user.id,document,revision,updated_at:new Date().toISOString()};
    const result=body.revision===0?await account.client.from('allowance_workspaces').insert(row).select('revision,updated_at').single():await account.client.from('allowance_workspaces').update(row).eq('user_id',account.user.id).eq('revision',body.revision).select('revision,updated_at').maybeSingle();
    if(result.error?.code==='23505'||(!result.error&&!result.data))return privateJSON({error:'A newer version was saved elsewhere. Export your unsaved work before reloading.'},409);
    if(result.error||!result.data)return privateJSON({error:'Save failed. Your changes remain in this tab; retry or export them.'},503);
    return privateJSON({revision:result.data.revision,updatedAt:result.data.updated_at});
  }catch{return privateJSON({error:'Workspace validation failed. Check dates, amounts and import limits.'},400);}
}
