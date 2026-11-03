import {notFound} from 'next/navigation';
import {ServiceShell} from '../../components/service/shell';
export const dynamic='force-dynamic';
export default async function WorkspaceLayout({children,params}:{children:React.ReactNode;params:Promise<{mode:string}>}){const {mode}=await params;if(!['app','demo'].includes(mode))notFound();return <ServiceShell key={mode} demo={mode==='demo'}>{children}</ServiceShell>;}
