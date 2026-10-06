const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function fixture() {
  let now=100000, fail=false, cached;
  const calls=[], invalidations=[], updates=[];
  const rows=[
    {id:'live',status:'approved',expiresAt:110000,approvedAt:90000,mediaUrl:'video',studentName:'private'},
    {id:'expired',status:'approved',expiresAt:90000},
    {id:'rejected',status:'rejected',expiresAt:120000},
    {id:'pa',status:'pending',studentId:'a'}, {id:'pb',status:'pending',studentId:'b'}
  ];
  const adminDb={ collection(name) {
    const filters=[]; let cap=Infinity;
    const q={where(field,op,value){filters.push([field,op,value]);return q;},limit(n){cap=n;return q;},
      async get(){ calls.push({name,filters,cap}); if(fail)throw Error('quota');
        const found=rows.filter(row=>filters.every(([field,op,value])=>op==='=='?row[field]===value:row[field]>value)).slice(0,cap);
        const docs=found.map(row=>({id:row.id,data:()=>row}));return {docs,empty:!docs.length}; },
      doc(id){return {id,async create(){}};} }; return q;
  },async runTransaction(fn){return fn({get:async()=>({exists:true}),update:(_,patch)=>updates.push(patch)});} };
  const mocks={ 'next/server':{NextResponse:{json:(body,options)=>({body,options})}},
    'next/cache':{unstable_cache:(fn,keys,options)=>{assert.equal(options.revalidate,30);return async()=>{if(!cached)cached=await fn();return cached;};},
      revalidateTag:(tag,profile)=>{invalidations.push({tag,profile});cached=undefined;}},
    'firebase-admin/firestore':{Timestamp:{now:()=>now,fromDate:d=>d.getTime()},FieldValue:{serverTimestamp:()=>now,delete:()=> 'DELETE'}},
  };
  function load(path){const module={exports:{}};
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
      {module,exports:module.exports,URL,Date:class extends Date{static now(){return now;}},console,
       require:name=>name.includes('firebase-admin')&&name!== 'firebase-admin/firestore'?{getFirebaseAdmin:()=>({adminDb,adminAuth:{verifyIdToken:async token=>{if(token==='invalid')throw Error();return token==='teacher'?{role:'teacher',uid:'t'}:{role:'student',studentDocId:token};}}})}:name.includes('r2Media')?{verifyMediaVideo:async()=>{throw Error('unexpected');}}:mocks[name]});return module.exports;
  }
  const publicApi=load('app/api/academy-stories/route.ts'), teacherApi=load('app/api/teacher/academy-stories/route.ts');
  const request=(token,body)=>({headers:{get:()=>token?'Bearer '+token:null},json:async()=>body});
  return {calls,invalidations,updates,request,publicApi,teacherApi,setNow:n=>now=n,setFail:v=>fail=v};
}

test('repeated public loads share one bounded expiry query and never reveal rejected/private rows',async()=>{
 const f=fixture();for(let i=0;i<5;i++){const r=await f.publicApi.GET(f.request());assert.deepEqual(Array.from(r.body.stories,s=>s.id),['live']);assert.equal(r.body.stories[0].studentName,undefined);assert.equal(r.options.headers['Cache-Control'],'private, no-store');}
 assert.equal(f.calls.length,1);assert.equal(f.calls[0].filters[0][0],'expiresAt');assert.equal(f.calls[0].cap,60);
});
test('pending status remains isolated per authenticated student with at most one returned row',async()=>{
 const f=fixture(),a=await f.publicApi.GET(f.request('a')),b=await f.publicApi.GET(f.request('b')),invalid=await f.publicApi.GET(f.request('invalid'));
 assert.equal(a.body.ownPending.id,'pa');assert.equal(b.body.ownPending.id,'pb');assert.equal(invalid.body.ownPending,null);
 assert.equal(f.calls.length,3);assert.equal(f.calls[1].cap,1);assert.equal(f.calls[1].filters[1][2],'pending');
});
test('cached public stories disappear exactly when expired without another query',async()=>{
 const f=fixture();await f.publicApi.GET(f.request());f.setNow(110000);const r=await f.publicApi.GET(f.request());assert.equal(r.body.stories.length,0);assert.equal(f.calls.length,1);
});
test('teacher rejection clears expiry and invalidates public cache after successful mutation',async()=>{
 const f=fixture();await f.publicApi.GET(f.request());const r=await f.teacherApi.PATCH(f.request('teacher',{id:'live',action:'reject'}));
 assert.equal(r.body.success,true);assert.equal(f.updates[0].expiresAt,'DELETE');assert.equal(f.invalidations[0].tag,'academy-stories-public');assert.equal(f.invalidations[0].profile.expire,0);
 await f.publicApi.GET(f.request());assert.equal(f.calls.length,2);
});
test('database errors are not saved as successful empty cache results',async()=>{
 const f=fixture();f.setFail(true);assert.equal((await f.publicApi.GET(f.request())).options.status,500);f.setFail(false);assert.equal((await f.publicApi.GET(f.request())).body.stories.length,1);assert.equal(f.calls.length,2);
});
