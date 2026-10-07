const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('app/api/public-weekly-engagement/route.ts','utf8');
const moduleMock={exports:{}};
vm.runInNewContext(ts.transpileModule(source+'\nexports.recognition = getRecognitionPoints;', {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:moduleMock,exports:moduleMock.exports,require:()=>({}),Date,Intl,URL,console,setTimeout});
const score=data=>moduleMock.exports.recognition(data,'2026-10-04','2026-10-10');
const gift=(points,createdAt='2026-10-06T12:00:00Z')=>({type:'teacherGift',points,createdAt});
test('gift-heavy student loses recognition lead without changing balances or history',()=>{
 const a={points:100,pointsHistory:[gift(80)]},b={points:50,pointsHistory:[{points:50,type:'reading',createdAt:'2026-10-06'}]};
 assert.equal(score(a),20);assert.equal(score(b),50);assert.equal(a.points,100);assert.equal(a.pointsHistory[0].points,80);
});
test('only this week teacher gifts are excluded; earned and wheel rewards stay',()=>{
 assert.equal(score({points:100,pointsHistory:[gift(10),gift(90,'2026-09-30'),{source:'weeklyWheel',points:20,createdAt:'2026-10-06'},{type:'homework',points:30,createdAt:'2026-10-06'}]}),90);
});
test('Firestore timestamps, Riyadh boundary and legacy gift markers are recognized',()=>{
 assert.equal(score({points:50,pointsHistory:[{source:'teacherGift',points:10,createdAt:{seconds:Date.parse('2026-10-03T21:00:00Z')/1000}},{category:'هدية من المعلم',points:5,date:'2026-10-06'},{reason:'🎁 هدية من المعلم: تشجيع',points:5,createdAt:'2026-10-06'}]}),30);
});
test('missing malformed histories remain safe and excluded gifts never make score negative',()=>{
 assert.equal(score({points:15}),15);assert.equal(score({points:15,pointsHistory:[null,gift(-10),gift('invalid'),gift(10,'invalid')]}),15);assert.equal(score({points:5,pointsHistory:[gift(10)]}),0);assert.equal(score({points:'invalid'}),0);
});
test('summary and client cache versions change and preview/public memory caches are isolated',()=>{
 assert.match(source,/learning-v3-earned-points/);assert.match(source,/cachedWeekStart === cacheKey/);assert.match(source,/teacherPreview \? "preview" : "public"/);
 assert.match(fs.readFileSync('app/page.tsx','utf8'),/academy-home-weekly-engagement-v2-earned-points/);
});
