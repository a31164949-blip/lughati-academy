const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('app/api/public-weekly-engagement/route.ts','utf8');
const moduleMock={exports:{}};
vm.runInNewContext(ts.transpileModule(source+'\nexports.recognition = getRecognitionPoints;',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:moduleMock,exports:moduleMock.exports,require:()=>({}),Date,Intl,URL,console,setTimeout});
const score=data=>moduleMock.exports.recognition(data,'2026-10-04','2026-10-10');
const entry=(points,date='2026-10-06')=>({points,date});
const gift=points=>({...entry(points),type:'teacherGift'});
test('large old balance never outranks current week effort; balances remain unchanged',()=>{const a={points:1000,pointsHistory:[entry(900,'2026-09-30'),entry(20),gift(80)]};const b={points:60,pointsHistory:[entry(60)]};assert.equal(score(a),20);assert.equal(score(b),60);assert.equal(a.points,1000);});
test('old points, teacher gifts and undated history are excluded, wheel rewards remain',()=>{assert.equal(score({points:500,pointsHistory:[entry(300,'2026-09-30'),gift(50),{points:99},{...entry(20),source:'weekly-reward-wheel'},entry(30)]}),50);});
test('Riyadh Sunday boundaries work for ISO strings and Firestore timestamps',()=>{assert.equal(score({pointsHistory:[entry(10,'2026-10-03T20:59:59Z'),entry(20,'2026-10-03T21:00:00Z'),{points:30,createdAt:{seconds:Date.parse('2026-10-03T21:00:00Z')/1000}},entry(40,'2026-10-10T21:00:00Z')]}),50);});
test('explicit activity date takes priority over a later creation date',()=>{assert.equal(score({pointsHistory:[{points:100,date:'2026-09-30',createdAt:'2026-10-06'},entry(10)]}),10);});
test('all legacy teacher gift markers are excluded',()=>{assert.equal(score({pointsHistory:[{...entry(10),source:'teacherGift'},{...entry(10),category:'هدية من المعلم'},{...entry(10),reason:'🎁 هدية من المعلم: تشجيع'},entry(7)]}),7);});
test('week corrections count and malformed or missing history never falls back to old balance',()=>{assert.equal(score({points:100}),0);assert.equal(score({points:100,pointsHistory:[null,entry('invalid'),{points:40,date:'invalid'},entry(15),entry(-5)]}),10);assert.equal(score({pointsHistory:[entry(-5)]}),0);});
test('persisted and browser caches are versioned and zero earned points cannot select a champion',()=>{assert.match(source,/learning-v4-week-history/);assert.match(source,/studentPoints > 0/);assert.match(source,/cachedWeekStart === cacheKey/);assert.match(fs.readFileSync('app/page.tsx','utf8'),/academy-home-weekly-engagement-v3-week-history/);});
test('GET selects the weekly-history champion and writes a new summary without new queries',async()=>{
 const collections=[],summaries=[],module={exports:{}};
 const student=(id,name,points,history)=>({id,data:()=>({studentName:name,active:true,points,pointsHistory:history})});
 const students=[student('old','قديم',1000,[entry(900,'2026-09-30'),entry(20),gift(80)]),student('new','مجتهد',60,[entry(60)])];
 const snapshot={exists:false,data:()=>undefined};
 const db={collection:name=>{const ref={name,doc:id=>({id,get:async()=>snapshot}),where:()=>ref,get:async()=>{collections.push(name);return {docs:name==='students'?students:[]};}};return ref;},runTransaction:async fn=>fn({get:async()=>snapshot,set:()=>{}}),batch:()=>({set:(ref,data)=>summaries.push({id:ref.id,data}),update:()=>{},commit:async()=>{}})};
 class FixedDate extends Date{constructor(...args){super(...(args.length?args:['2026-10-08T09:05:00Z']));}static now(){return Date.parse('2026-10-08T09:05:00Z');}}
 const mocks={'next/server':{NextResponse:{json:(body,options)=>({body,options})}},'firebase-admin/firestore':{FieldValue:{arrayUnion:x=>x}},'../../../firebase-admin':{getFirebaseAdmin:()=>({adminDb:db})}};
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:n=>mocks[n],Date:FixedDate,Intl,URL,console,setTimeout});
 const result=await module.exports.GET({url:'https://example.com/api/public-weekly-engagement'});
 assert.equal(result.body.pointsChampion.studentId,'new');assert.equal(result.body.pointsChampion.points,60);assert.equal(collections.length,8);assert.equal(summaries[0].id,'2026-10-04-learning-v4-week-history');assert.equal(result.body.rankings.length,0);
});
