const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function compile(p){const r=ts.transpileModule(fs.readFileSync(path.join(root,p),'utf8'),{fileName:p,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}});assert.equal((r.diagnostics||[]).filter(x=>x.category===1).length,0,p);return r.outputText;}
const policy={};new Function('exports',compile('app/lib/academyCouncilPolicy.ts'))(policy);
let rows=new Map(),student={active:true,studentName:'طالب موثوق',accessControl:{mode:'account'}},calls=[];
const clone=o=>o?structuredClone(o):o;
function snap(ref){return{id:ref.id,ref,exists:rows.has(ref.path),data:()=>clone(rows.get(ref.path))};}
function collection(p,filters=[]){return{doc:id=>ref(p+'/'+id),where:(key,op,value)=>collection(p,[...filters,[key,value]]),orderBy:()=>collection(p,filters),limit:()=>collection(p,filters),startAfter:()=>collection(p,filters),get:async()=>{const docs=[...rows].filter(([k,v])=>k.startsWith(p+'/')&&!k.slice(p.length+1).includes('/')&&filters.every(([key,value])=>v[key]===value)).map(([k])=>snap(ref(k)));return{docs,size:docs.length}}};}
function ref(p){return{path:p,id:p.split('/').at(-1),collection:n=>collection(p+'/'+n),get:async()=>p.startsWith('students/')?{data:()=>student}:snap(ref(p))};}
const db={collection,runTransaction:async callback=>{const writes=[];const result=await callback({get:async r=>snap(r),set:(r,data,opt)=>writes.push(()=>rows.set(r.path,opt?.merge?{...rows.get(r.path),...data}:data)),update:(r,data)=>writes.push(()=>{assert(rows.has(r.path));rows.set(r.path,{...rows.get(r.path),...data})})});writes.forEach(w=>w());return result}};
const api={};new Function('require','exports',compile('app/api/academy-council/route.ts'))(name=>{
if(name==='node:crypto')return require(name);
if(name==='next/server')return{NextResponse:{json:(body,options)=>({body,status:options.status})}};
if(name==='firebase-admin/firestore')return{FieldPath:{documentId:()=> 'id'},FieldValue:{serverTimestamp:()=>123}};
if(name==='../../lib/academyCouncilPolicy')return policy;
if(name==='../../../firebase-admin')return{getFirebaseAdmin:options=>({adminDb:db,adminAuth:{verifyIdToken:async token=>{calls.push(options);if(token==='bad')throw Error('auth/invalid');if(token==='student'&&!options?.allowSuspended)throw Error('FORBIDDEN');return token==='teacher'?{role:'teacher',uid:'teacher'}:{role:'student',studentDocId:token==='other'?'other':'one'}}}})};
throw Error(name);},api);
function req(method='GET',body,token='student',outreach=true,extra=''){return api[method](new Request('https://academy.test/api/academy-council?'+(outreach?'outreach=1':'')+extra,{method,headers:{...(token?{authorization:'Bearer '+token}:{}),'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}));}
const id=policy.LEARNING_DIALOGUE_ID,p='academyCouncilTopics/'+id;
(async()=>{
let r=await req();assert.equal(r.status,200);assert.equal(r.body.topic.id,id);assert.equal(r.body.topic.active,true);assert.equal(rows.size,0,'view does not create records');assert.equal(calls.at(-1).allowSuspended,true);
assert.equal((await req('GET',null,'student',false)).status,403,'ordinary council still rejects suspension');assert.equal((await req('GET',null,'',true)).status,401);assert.equal((await req('GET',null,'bad',true)).status,401);
assert.equal((await req('GET',null,'student',true,'&topicId=other-topic')).status,403);
assert.equal((await req('POST',{action:'createTopic',title:'x',text:'y'})).status,403);
assert.equal((await req('POST',{action:'reply',topicId:'other-topic',text:'x',visibility:'public'})).status,403);
student.deleted=true;assert.equal((await req()).status,403);delete student.deleted;
r=await req('POST',{action:'reply',topicId:id,text:'تدريب قصير يوميًا',visibility:'private',name:'مزور'});assert.equal(r.status,200);let saved=rows.get(p+'/replies/one');assert.equal(saved.name,'طالب موثوق');assert.equal(saved.status,'private');assert.equal(saved.studentId,'one');assert(!student.accessControl.until,'access control untouched');
r=await req('GET',null,'other');assert.equal(r.body.replies.length,0);assert.equal(r.body.mine,null,'other student cannot see private reply');
assert.equal((await req('PATCH',{topicId:id,action:'toggleTopic',topicRevision:policy.LEARNING_DIALOGUE_TOPIC.revision})).status,403);
r=await req('PATCH',{topicId:id,action:'toggleTopic',topicRevision:policy.LEARNING_DIALOGUE_TOPIC.revision},'teacher');assert.equal(r.status,200);assert.equal(rows.get(p).active,false,'teacher can close initial virtual topic');
assert.equal((await req('POST',{action:'reply',topicId:id,text:'x',visibility:'public'})).status,400,'closed topic rejects writes');
const rev=rows.get(p).revision;assert.equal((await req('PATCH',{topicId:id,action:'toggleTopic',topicRevision:rev},'teacher')).status,200);
r=await req('POST',{action:'reply',topicId:id,text:'نشاط أسبوعي',visibility:'public'},'other');assert.equal(r.status,200);saved=rows.get(p+'/replies/other');assert.equal(saved.status,'pending');
r=await req();assert.equal(r.body.replies.length,0,'public suggestion requires approval');
r=await req('PATCH',{topicId:id,topicRevision:rows.get(p).revision,replyId:'other',revision:saved.revision,action:'publishReply'},'teacher');assert.equal(r.status,200);assert.equal((await req()).body.replies.length,1);
r=await req('PATCH',{topicId:id,topicRevision:rows.get(p).revision,replyId:'one',revision:rows.get(p+'/replies/one').revision,action:'publishReply'},'teacher');assert.equal(r.status,403,'teacher cannot publish private response');
assert.equal((await req('PATCH',{topicId:'other-topic',action:'hideTopic'},'teacher')).status,403);
for(const file of ['app/components/AcademyCouncil.tsx','app/components/StudentAccessGate.tsx','app/components/AcademyAvailabilityGate.tsx','app/components/StudentLearningPledge.tsx','app/learning-dialogue/page.tsx','app/teacher/learning-dialogue/page.tsx','app/teacher/page.tsx'])compile(file);
console.log('PASS: suspended participation limited to fixed topic; ordinary council protected; trusted identity; no guest writes; privacy and approval; teacher closing/reopening; no account reactivation; TSX syntax.');
})().catch(e=>{console.error(e);process.exitCode=1});
