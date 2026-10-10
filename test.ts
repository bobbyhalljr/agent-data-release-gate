import assert from 'node:assert/strict';
import {gate} from './gate.ts';
import {tools,task,records,proposal} from './fixtures.ts';
let checks=0;
function test(name:string,fn:()=>void){fn();checks++;console.log(`ok ${checks} - ${name}`)}
const run=(p:unknown=proposal,t=task,ts=tools,rs=records)=>gate(p,t,ts,rs);
function reason(p:unknown,expected:string){assert.deepEqual(run(p),{allowed:false,reason:expected})}
test('public projection allowed',()=>assert.equal(run().allowed,true));
test('only selected values leave',()=>{const d=run();assert(d.allowed);assert.deepEqual(d.rows,[{company:'Example Robotics',domain:'example.com'}])});
test('trusted recipient returned',()=>{const d=run();assert(d.allowed);assert.equal(d.recipient,'research-provider')});
test('credential source is explicit',()=>{const d=run();assert(d.allowed);assert.equal(d.credential,'instant')});
test('internal input denied for research route',()=>reason({...proposal,fields:['notes']},'data-class-not-approved'));
test('restricted input denied for research route',()=>reason({...proposal,fields:['token']},'data-class-not-approved'));
test('connected route allows internal input',()=>assert.equal(run({...proposal,tool:'crmLookup',fields:['notes']}).allowed,true));
test('connected route still denies restricted input',()=>reason({...proposal,tool:'crmLookup',fields:['token']},'data-class-not-approved'));
test('cross tenant public data denied',()=>reason({...proposal,recordIds:['other'],fields:['company']},'tenant-mismatch'));
test('mixed tenant batch returns no partial payload',()=>reason({...proposal,recordIds:['vendor','other'],fields:['company']},'tenant-mismatch'));
test('unknown tool denied',()=>reason({...proposal,tool:'madeUp'},'unknown-tool'));
test('prototype tool denied',()=>reason({...proposal,tool:'toString'},'unknown-tool'));
test('unapproved recipient denied',()=>assert.deepEqual(run(proposal,{...task,recipients:[]}),{allowed:false,reason:'recipient-not-approved'}));
test('task tool restriction enforced',()=>assert.deepEqual(run(proposal,{...task,tools:[]}),{allowed:false,reason:'tool-out-of-scope'}));
test('task field restriction enforced',()=>assert.deepEqual(run(proposal,{...task,fields:['company']}),{allowed:false,reason:'field-out-of-scope'}));
test('unknown record denied',()=>reason({...proposal,recordIds:['missing']},'unknown-record'));
test('unknown field denied',()=>assert.deepEqual(run({...proposal,fields:['missing']},{...task,fields:['missing']}),{allowed:false,reason:'unknown-field'}));
test('free text arguments rejected',()=>reason({...proposal,query:'paste private notes'},'invalid-proposal'));
test('model cannot relabel data',()=>reason({...proposal,label:'public'},'invalid-proposal'));
test('empty record list rejected',()=>reason({...proposal,recordIds:[]},'invalid-proposal'));
test('duplicate field rejected',()=>reason({...proposal,fields:['company','company']},'invalid-proposal'));
test('nonstring identifier rejected',()=>reason({...proposal,recordIds:[3]},'invalid-proposal'));
test('batch limit enforced',()=>reason({...proposal,recordIds:Array.from({length:11},(_,i)=>`row${i}`)},'invalid-proposal'));
test('null proposal rejected',()=>reason(null,'invalid-proposal'));
test('caller proposal is not mutated',()=>{const before=JSON.stringify(proposal);run();assert.equal(JSON.stringify(proposal),before)});
console.log(`${checks}/${checks} checks passed`);
for(const [name,p] of Object.entries({publicSearch:proposal,privateSearch:{...proposal,fields:['notes']},connectedNotes:{...proposal,tool:'crmLookup',fields:['notes']},crossTenant:{...proposal,recordIds:['other'],fields:['company']}})){
 const d=run(p);console.log(`${name}: ${d.allowed?`ALLOW recipient=${d.recipient} credential=${d.credential} fields=${Object.keys(d.rows[0]).join(',')}`:`DENY ${d.reason}`}`)
}
