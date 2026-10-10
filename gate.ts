export type Label = 'public' | 'internal' | 'restricted';
export type Cell = { value: string; label: Label };
export type RecordRow = { tenant: string; cells: Record<string, Cell> };
export type Tool = { recipient: string; credential: 'instant' | 'connected'; labels: readonly Label[] };
export type Task = { tenant: string; tools: readonly string[]; recipients: readonly string[]; fields: readonly string[] };
export type Decision = { allowed: false; reason: string } | { allowed: true; recipient: string; credential: string; rows: Record<string,string>[] };
const object = (x: unknown): x is Record<string,unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const own = (x: object,k: string) => Object.prototype.hasOwnProperty.call(x,k);
const names = (x: unknown): x is string[] => Array.isArray(x) && x.length > 0 && x.length <= 10 && x.every(s=>typeof s==='string' && /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(s)) && new Set(x).size===x.length;
// Proposal is untrusted. The three policy inputs are trusted application state.
export function gate(proposal: unknown, task: Task, tools: Record<string,Tool>, records: Record<string,RecordRow>): Decision {
 const deny = (reason: string): Decision => ({allowed:false,reason});
 if (!object(proposal) || Object.keys(proposal).sort().join(',')!=='fields,recordIds,tool' || typeof proposal.tool!=='string' || !names(proposal.recordIds) || !names(proposal.fields)) return deny('invalid-proposal');
 const {tool,recordIds,fields}=proposal;
 if (!own(tools,tool)) return deny('unknown-tool');
 const route=tools[tool];
 if (!task.tools.includes(tool)) return deny('tool-out-of-scope');
 if (!task.recipients.includes(route.recipient)) return deny('recipient-not-approved');
 if (fields.some(f=>!task.fields.includes(f))) return deny('field-out-of-scope');
 const rows: Record<string,string>[]=[];
 for (const id of recordIds) {
  if (!own(records,id)) return deny('unknown-record');
  const record=records[id];
  if (record.tenant!==task.tenant) return deny('tenant-mismatch');
  const row: Record<string,string>={};
  for (const f of fields) {
   if (!own(record.cells,f)) return deny('unknown-field');
   const cell=record.cells[f];
   if (!route.labels.includes(cell.label)) return deny('data-class-not-approved');
   row[f]=cell.value;
  }
  rows.push(row);
 }
 return {allowed:true,recipient:route.recipient,credential:route.credential,rows};
}
