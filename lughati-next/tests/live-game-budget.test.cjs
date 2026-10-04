const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(path,mocks={}){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module,exports:module.exports,require:name=>{if(!(name in mocks))throw Error(name);return mocks[name]},URL,Date,Promise});return module.exports;}
function fixture(){
 const docs=new Map();let reads=0,queries=0;
 class Stamp{constructor(ms){this.ms=ms}toDate(){return new Date(this.ms)}toMillis(){return this.ms}}
 const snapshot=(path)=>({id:path.split('/').at(-1),exists:docs.has(path),data:()=>docs.get(path)});
 const ref=path=>({path,collection:name=>query(path+'/'+name),get:async()=>{reads++;return snapshot(path)},set:async(data)=>docs.set(path,data),update:async(data)=>docs.set(path,{...docs.get(path),...data})});
 const query=path=>({path,isQuery:true,doc:id=>ref(path+'/'+id),orderBy(){return this},limit(){return this},get:async()=>{queries++;const rows=[...docs.keys()].filter(p=>p.startsWith(path+'/')&&p.split('/').length===path.split('/').length+1);reads+=Math.max(rows.length,1);return {docs:rows.map(snapshot)}}});
 let lock=Promise.resolve();
 const db={collection:query,runTransaction:fn=>{const run=lock.then(async()=>{const writes=[];let wrote=false;const tx={get:async r=>{assert.equal(wrote,false,'reads precede writes');return r.get()},create:(r,d)=>{assert(!docs.has(r.path));wrote=true;writes.push(()=>docs.set(r.path,d))},set:(r,d)=>{wrote=true;writes.push(()=>docs.set(r.path,d))},update:(r,d)=>{wrote=true;writes.push(()=>docs.set(r.path,{...docs.get(r.path),...d}))}};const result=await fn(tx);writes.forEach(w=>w());return result});lock=run.catch(()=>{});return run}};
 const api=load('app/api/academy-club/live-game/route.ts',{'next/server':{NextResponse:{json:(data,options)=>({data,status:options?.status??200})}},'firebase-admin/firestore':{Timestamp:Stamp,FieldValue:{serverTimestamp:()=>new Stamp(Date.now())}},'../../../../firebase-admin':{getFirebaseAdmin:()=>({adminDb:db,adminAuth:{verifyIdToken:async id=>id==='teacher'?{uid:id,role:'teacher'}:{uid:id,role:'student',studentDocId:id}}})}});
 const roomPath='academyClubLiveRooms/123456';
 docs.set(roomPath,{status:'waiting',currentQuestion:-1,leaderboard:[]});
 const student=id=>docs.set('students/'+id,{studentName:id,academyClubMembership:{active:true}});
 const post=(id,action,extra={})=>api.POST({headers:{get:()=>`Bearer ${id}`},json:async()=>({code:'123456',action,...extra})});
 const get=id=>api.GET({headers:{get:()=>`Bearer ${id}`},url:'https://example.test/api?code=123456'});
 return {docs,student,post,get,roomPath,metrics:()=>({reads,queries}),reset:()=>{reads=queries=0}};
}
test('rejoin preserves score and prior answer, duplicate answer cannot earn points',async()=>{
 const f=fixture();f.student('s1');await f.post('s1','join');await f.post('teacher','start');const answer=await f.post('s1','answer',{option:0});assert.equal(answer.status,200);assert.equal(answer.data.result.correct,true);
 const score=f.docs.get(f.roomPath+'/participants/s1').score;assert(score>0);
 const rejoin=await f.post('s1','join');assert.equal(rejoin.data.room.answered,true);assert.equal(f.docs.get(f.roomPath+'/participants/s1').score,score);assert.equal((await f.post('s1','answer',{option:0})).status,400);assert.equal(f.docs.get(f.roomPath+'/participants/s1').score,score);
});
test('30-player capacity is transactional and existing members can rejoin',async()=>{
 const f=fixture();for(let i=0;i<29;i++){f.student('s'+i);assert.equal((await f.post('s'+i,'join')).status,200)}f.student('lastA');f.student('lastB');const results=await Promise.all([f.post('lastA','join'),f.post('lastB','join')]);assert.deepEqual(results.map(r=>r.status).sort(),[200,400]);assert.equal(f.docs.get(f.roomPath).leaderboard.length,30);assert.equal((await f.post('s0','join')).status,200);
});
test('new-room polling reads two documents for a student, one for teacher',async()=>{
 const f=fixture();for(let i=0;i<30;i++){f.student('s'+i);await f.post('s'+i,'join')}f.reset();assert.equal((await f.get('s0')).status,200);assert.deepEqual(f.metrics(),{reads:2,queries:0});f.reset();await f.get('teacher');assert.deepEqual(f.metrics(),{reads:1,queries:0});
});
test('unjoined answers and new entrants after finish are rejected',async()=>{
 const f=fixture();f.student('s1');await f.post('teacher','start');assert.equal((await f.post('s1','answer',{option:0})).status,400);assert.equal((await f.post('s1','answer',{option:99})).status,400);for(let i=0;i<4;i++)await f.post('teacher','next');assert.equal((await f.post('s1','join')).status,400);
});
test('older room roster is migrated on next join without resetting old scores',async()=>{
 const f=fixture();f.docs.set(f.roomPath,{status:'active',currentQuestion:0});f.docs.set(f.roomPath+'/participants/old',{name:'old',score:15,answeredQuestion:0});f.student('new');await f.post('new','join');assert.equal(f.docs.get(f.roomPath).leaderboard.find(p=>p.id==='old').score,15);f.reset();await f.get('teacher');assert.equal(f.metrics().queries,0);
});
test('polling pauses while hidden, resumes, avoids overlapping requests, and cleans up',async()=>{
 const {startVisiblePolling}=load('app/lib/visiblePolling.ts');const timers=new Map();let next=0,listener,calls=0,resolve;
 const visibility={hidden:false,addEventListener:(name,fn)=>listener=fn,removeEventListener:()=>listener=undefined};
 const clock={setTimeout:fn=>{timers.set(++next,fn);return next},clearTimeout:id=>timers.delete(id)};
 const stop=startVisiblePolling(()=>{calls++;return new Promise(r=>resolve=r)},visibility,clock);
 const tick=()=>{const [id,fn]=timers.entries().next().value;timers.delete(id);fn()};
 tick();assert.equal(calls,1);assert.equal(timers.size,0);visibility.hidden=true;listener();visibility.hidden=false;listener();assert.equal(calls,1);resolve();await new Promise(setImmediate);assert.equal(timers.size,1);
 visibility.hidden=true;listener();assert.equal(timers.size,0);visibility.hidden=false;listener();assert.equal(calls,2);stop();resolve();await new Promise(setImmediate);assert.equal(timers.size,0);assert.equal(listener,undefined);
});
