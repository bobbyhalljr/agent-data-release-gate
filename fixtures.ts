import type {Task,Tool,RecordRow} from './gate.ts';
// Fictional routes and records. These are not Composio tool slugs or rates.
export const tools:Record<string,Tool>={
 companySearch:{recipient:'research-provider',credential:'instant',labels:['public']},
 crmLookup:{recipient:'tenant-crm',credential:'connected',labels:['public','internal']}
};
export const task:Task={tenant:'acme',tools:['companySearch','crmLookup'],recipients:['research-provider','tenant-crm'],fields:['company','domain','notes','token']};
export const records:Record<string,RecordRow>={
 vendor:{tenant:'acme',cells:{company:{value:'Example Robotics',label:'public'},domain:{value:'example.com',label:'public'},notes:{value:'Fictional internal renewal discussion',label:'internal'},token:{value:'SYNTHETIC-NOT-A-CREDENTIAL',label:'restricted'}}},
 other:{tenant:'other',cells:{company:{value:'Other Tenant Company',label:'public'}}}
};
export const proposal={tool:'companySearch',recordIds:['vendor'],fields:['company','domain']};
