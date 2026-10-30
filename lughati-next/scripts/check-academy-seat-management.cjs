const fs=require('fs'),ts=require('typescript'),assert=require('node:assert/strict');
const options={jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020};
const files = { 'route.ts': '../app/api/academy-continuation/route.ts', 'page.tsx': '../app/teacher/continuation/page.tsx', 'academyContinuation.ts': '../app/lib/academyContinuation.ts' };
function compile(file){const r=ts.transpileModule(fs.readFileSync(require('node:path').resolve(__dirname, files[file]),'utf8'),{fileName:file,compilerOptions:options,reportDiagnostics:true});assert.equal((r.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,file);return r.outputText;}
const lib={};new Function('exports',compile('academyContinuation.ts'))(lib);compile('page.tsx');
let documents,commits,reads,tags;
const roundPath='academyContinuationRounds/'+lib.CONTINUATION_ROUND;
const reqPath=id=>roundPath+'/requests/'+id;
function ref(path){return {path,collection:name=>ref(path+'/'+name),doc:id=>ref(path+'/'+id)}}
const db={collection:name=>ref(name),runTransaction:async callback=>{
 const writes=[];
 const result=await callback({get:async reference=>{assert.equal(writes.length,0,'all transaction reads precede writes');reads++;const data=documents.get(reference.path);return {exists:!!data,data:()=>data}},set:(reference,value)=>writes.push([reference.path,value]),update:(reference,value)=>{assert(documents.has(reference.path),'updating existing record');writes.push([reference.path,value])}});
 for(const [path,value]of writes)documents.set(path,{...documents.get(path),...value});commits++;return result;
}};
const moduleExports={};
const imports=name=>{
 if(name==='node:crypto')return require(name);
 if(name==='next/cache')return {revalidateTag:tag=>tags.push(tag)};
 if(name==='next/server')return {NextResponse:{json:(data,options={})=>({status:options.status||200,data})}};
 if(name==='firebase-admin/firestore')return {FieldPath:{documentId:()=>''},FieldValue:{serverTimestamp:()=>123}};
 if(name==='../../../firebase-admin')return {getFirebaseAdmin:()=>({adminDb:db,adminAuth:{verifyIdToken:async token=>token==='teacher'?{role:'teacher',uid:'teacher-id'}:{role:'guest'}}})};
 if(name==='../../lib/academyContinuation')return lib;
 throw Error(name);
};
new Function('require','exports',compile('route.ts'))(imports,moduleExports);
function seed(){documents=new Map();commits=reads=0;tags=[];const accepted=Array.from({length:20},(_,i)=>'s'+i);documents.set(roundPath,{acceptedStudentIds:accepted});for(const id of [...accepted,'next']){documents.set(reqPath(id),{revision:'v1',admissionStatus:id==='next'?'waiting':'accepted',wantsToContinue:true,studentName:id,classroom:'الثاني أ',isTrial:false});documents.set('students/'+id,{studentName:id,classroom:'الثاني أ',points:77,readingHistory:[{date:'2026-10-28'}]});}}
async function patch(body,token='teacher'){return moduleExports.PATCH(new Request('https://example.test/api/academy-continuation',{method:'PATCH',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(body)}))}
const removal={action:'remove',studentId:'s0',revision:'v1'};
const replacement={...removal,action:'replace',replacementStudentId:'next',replacementRevision:'v1'};
(async()=>{
 seed();let result=await patch(replacement);assert.equal(result.status,200);assert.equal(commits,1);assert.equal(reads,5);assert.equal(result.data.updates.length,2);assert.deepEqual(result.data.admissions,{accepted:20,remaining:0});assert(!documents.get(roundPath).acceptedStudentIds.includes('s0'));assert(documents.get(roundPath).acceptedStudentIds.includes('next'));assert.equal(documents.get('students/s0').accessControl.mode,'account');assert.equal(documents.get('students/next').accessControl.mode,'resume');assert.equal(documents.get('students/s0').points,77);assert.equal(documents.get('students/s0').readingHistory.length,1);assert(tags.includes(lib.ADMISSION_ACCESS_TAG));assert(tags.includes('student-access:s0'));assert(tags.includes('student-access:next'));
 result=await patch(replacement);assert.equal(result.status,409);assert.equal(commits,1,'repeated stale request does not write');
 seed();result=await patch(removal);assert.equal(result.status,200);assert.deepEqual(result.data.admissions,{accepted:19,remaining:1});assert.equal(documents.get(reqPath('s0')).admissionStatus,'waiting');assert.equal(documents.get('students/s0').accessControl.until,null);
 for(const change of [()=>documents.set(reqPath('next'),{...documents.get(reqPath('next')),revision:'new'}),()=>documents.set(reqPath('next'),{...documents.get(reqPath('next')),isTrial:true}),()=>documents.set('students/next',{...documents.get('students/next'),deleted:true}),()=>documents.set(reqPath('next'),{...documents.get(reqPath('next')),wantsToContinue:false}),()=>documents.set(reqPath('s0'),{...documents.get(reqPath('s0')),admissionStatus:'waiting'})]){
  seed();change();result=await patch(replacement);assert(result.status>=400);assert.equal(commits,0);assert.equal(documents.get(roundPath).acceptedStudentIds.length,20);assert(!documents.get('students/s0').accessControl);
 }
 seed();result=await patch({...replacement,replacementStudentId:'s0'});assert.equal(result.status,400);assert.equal(commits,0);
 seed();result=await patch(replacement,'stranger');assert.equal(result.status,403);assert.equal(commits,0);assert.equal(reads,0);
 console.log('PASS: atomic swap at 20 seats, standalone removal, blocking/resuming access, preserving records, cache invalidation, stale requests, invalid/trial/deleted candidates, consent, nonaccepted source, self-swap and unauthorized actor.');
})().catch(error=>{console.error(error);process.exitCode=1});
