const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function load(path, mocks) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: name => { assert.ok(name in mocks, name); return mocks[name]; }, console, Date });
  return exports;
}
function deferred() { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return { promise, resolve, reject }; }
test('overlapping reads share one request, completed reads stay fresh, and account changes isolate requests', async () => {
  const requests = [], auth = { currentUser: { uid: 'teacher' } };
  const api = load('app/lib/firestoreReadOnce.ts', {
    '../../firebase': { auth },
    'firebase/firestore': { queryEqual: (a,b) => a.key===b.key, getDocs(q) { const job=deferred(); requests.push({q,job}); return job.promise; } },
  });
  const a=api.getDocsOnce({key:'pending'}), b=api.getDocsOnce({key:'pending'});
  assert.equal(a,b); assert.equal(requests.length,1);
  auth.currentUser={uid:'student'};
  const c=api.getDocsOnce({key:'pending'}); assert.equal(requests.length,2); assert.notEqual(a,c);
  requests[0].job.resolve({docs:['teacher-only']}); requests[1].job.resolve({docs:['student-only']});
  assert.deepEqual((await a).docs,['teacher-only']); assert.deepEqual((await c).docs,['student-only']);
  const next=api.getDocsOnce({key:'pending'}); assert.equal(requests.length,3);
  requests[2].job.resolve({docs:['fresh']}); assert.deepEqual((await next).docs,['fresh']);
});
test('a rejected read is retryable and never becomes a cached empty result', async () => {
  const requests=[], auth={currentUser:{uid:'teacher'}};
  const api=load('app/lib/firestoreReadOnce.ts', {'../../firebase':{auth},'firebase/firestore':{queryEqual:()=>true,getDocs(){const d=deferred();requests.push(d);return d.promise;}}});
  const first=api.getDocsOnce({}); requests[0].reject(Error('quota')); await assert.rejects(first,/quota/);
  const retry=api.getDocsOnce({}); assert.equal(requests.length,2); requests[1].resolve({docs:[1]}); assert.equal((await retry).docs.length,1);
});
function pager() {
  const dataset={
    'reading-submissions':Array.from({length:126},(_,i)=>({id:String(i).padStart(3,'0'),data:()=>({status:i<117?'pending':'approved'})})),
    'homeworkCompletions':Array.from({length:61},(_,i)=>({id:String(i).padStart(3,'0'),data:()=>({readingStatus:i<54?'pending':'approved',readingAudioUrl:'audio'})})),
  }, reads=[];
  const firebase={collection:(_,name)=>name,where:(field,op,value)=>({field,op,value}),limit:n=>({cap:n}),startAfter:doc=>({after:doc.id}),query:(name,...filters)=>({name,filters})};
  const api=load('app/lib/readingReviewPages.ts', {
    '../../firebase':{db:{}},'firebase/firestore':firebase,
    './firestoreReadOnce':{async getDocsOnce(q){
      let docs=dataset[q.name];for(const f of q.filters){if(f.field)docs=docs.filter(d=>d.data()[f.field]===f.value);if(f.after)docs=docs.filter(d=>d.id>f.after);if(f.cap)docs=docs.slice(0,f.cap);}
      reads.push({name:q.name,size:docs.length});return {docs,size:docs.length};
    }},
  });return {api,reads,dataset};
}
test('pending reviews stay bounded and pagination reaches every pending record exactly once',async()=>{
  const f=pager();let cursor={journeyDone:false,homeworkDone:false},ids=[];
  for(let i=0;i<10;i++){
    const page=await f.api.readReadingReviewPage('pending',cursor);cursor=page.cursor;
    for(const doc of page.journeySnapshot?.docs??[])ids.push('r:'+doc.id);
    for(const doc of page.homeworkSnapshot?.docs??[])ids.push('h:'+doc.id);
    if(!page.hasMore)break;
  }
  assert.equal(ids.length,171);assert.equal(new Set(ids).size,171);assert.ok(f.reads.every(r=>r.size<=50));
  assert.equal(f.reads.filter(r=>r.name==='homeworkCompletions').length,2,'exhausted collections must not be reread');
  const before=f.reads.length;const end=await f.api.readReadingReviewPage('pending',cursor);assert.equal(end.hasMore,false);assert.equal(f.reads.length,before);
});
test('archive preserves approved and undated legacy documents without offsets or a date-field dependency',async()=>{
  const f=pager();let cursor={journeyDone:false,homeworkDone:false},count=0;
  for(let i=0;i<10;i++){
    const page=await f.api.readReadingReviewPage('all',cursor);cursor=page.cursor;count+=(page.journeySnapshot?.size??0)+(page.homeworkSnapshot?.size??0);if(!page.hasMore)break;
  }
  assert.equal(count,187);assert.ok(f.reads.every(r=>r.size<=50));
});
