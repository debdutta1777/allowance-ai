import {notFound} from 'next/navigation';
import {PageContent} from '../../../components/service/page-content';
export default async function WorkspacePage({params}:{params:Promise<{mode:string;section:string}>}){const {section}=await params;if(!['dashboard','planner','transactions','budgets','investing','markets','tax','safety','business','settings'].includes(section))notFound();return <PageContent section={section}/>;}
