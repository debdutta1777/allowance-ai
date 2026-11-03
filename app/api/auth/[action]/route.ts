import { z } from 'zod';
import { authConfigured, serverSupabase, verifiedAccount } from '../../../../lib/supabase/server';
import { boundedJSON, privateJSON, sameOrigin } from '../../../../lib/http-security';
export const dynamic='force-dynamic';export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{action:string}>}){
  if((await params).action!=='session')return privateJSON({error:'Not found.'},404);
  const account=await verifiedAccount();return privateJSON({configured:authConfigured(),user:account?{id:account.user.id,email:account.user.email}:null});
}
export async function POST(request:Request,{params}:{params:Promise<{action:string}>}){
  if(!sameOrigin(request))return privateJSON({error:'Use this application on its own site.'},403);
  if(!authConfigured())return privateJSON({error:'Account storage is not configured yet. You can explore the fictional demo.'},503);
  const action=(await params).action;
  try{
    const client=await serverSupabase();const body=await boundedJSON(request,4096);
    if(action==='sign-in'||action==='sign-up'){
      const input=z.object({email:z.email().max(254),password:z.string().min(12).max(128)}).strict().parse(body);
      const result=action==='sign-in'?await client.auth.signInWithPassword(input):await client.auth.signUp({...input,options:{emailRedirectTo:new URL('/auth/confirm',request.url).href}});
      if(result.error)return privateJSON({error:action==='sign-in'?'Sign-in failed. Check your details or confirm your email.':'Sign-up could not be completed. Try again later or use password recovery.'},400);
      return privateJSON({signedIn:Boolean(result.data.session),message:result.data.session?'Signed in.':'Check your email to confirm your account. If you already have an account, sign in or reset your password.'});
    }
    if(action==='sign-out'){const {error}=await client.auth.signOut();return error?privateJSON({error:'Sign-out failed. Please retry.'},502):privateJSON({ok:true});}
    if(action==='recover'){
      const {email}=z.object({email:z.email().max(254)}).strict().parse(body);
      await client.auth.resetPasswordForEmail(email,{redirectTo:new URL('/auth/confirm?next=/reset-password',request.url).href});
      return privateJSON({message:'If an account exists, a password recovery email has been requested. Check your inbox.'});
    }
    if(action==='password'){
      const account=await verifiedAccount();if(!account)return privateJSON({error:'Open your recovery link or sign in first.'},401);
      const {password}=z.object({password:z.string().min(12).max(128)}).strict().parse(body);
      const {error}=await account.client.auth.updateUser({password});return error?privateJSON({error:'Password could not be updated.'},400):privateJSON({message:'Password updated. You can return to your dashboard.'});
    }
    return privateJSON({error:'Not found.'},404);
  }catch{return privateJSON({error:'Check the form fields. Passwords must contain 12 to 128 characters.'},400);}
}
