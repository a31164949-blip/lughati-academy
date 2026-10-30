const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
const files={shared:'app/lib/studentSmartFollowUp.ts',reader:'app/lib/studentSmartRecord.ts',refresh:'app/api/teacher/smart-record/refresh/route.ts',journey:'app/journey/page.tsx',teacher:'app/teacher/smart-record/page.tsx',api:'app/api/student-journey/route.ts'};
function source(name){return fs.readFileSync(path.join(root,files[name]),'utf8');}
function compile(name){const result=ts.transpileModule(source(name),{fileName:files[name],reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});assert.equal((result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,name);return result.outputText;}
const shared={};new Function('exports',compile('shared'))(shared);
for(const key of ['journey','teacher','api'])compile(key);
const normalize=shared.normalizeStudentSmartFollowUp;
const day={date:'2026-10-28',readingTitle:'علم بلادي',spellingTitle:'مدينتان مقدستان',spellingWordCount:5,records:[{studentId:'one',attendance:'absent',homeworkLevel:'partial',readingErrors:0,readingKing:true,spellingErrors:2,spellingKing:false,note:'ملاحظة المعلم',readingFluencyLabel:'حقل قديم',readingDiacriticsLabel:'حقل قديم'},{studentId:'two',attendance:'late',homeworkLevel:'complete',readingErrors:3,spellingErrors:null,note:'ملاحظة خاصة بالثاني'}]};
const own=shared.studentFollowUpFromSmartRecord(day,'one');
assert.equal(own.attendanceLabel,'غائب');assert.equal(own.homeworkLabel,'🟡 جزء من الواجب');assert.equal(own.readingErrors,0);assert.equal(own.readingLevelLabel,'👑 ملك القراءة');assert.equal(own.spellingLevelLabel,'🏅 بطل الإملاء');assert.equal(own.spellingTitle,day.spellingTitle);assert.equal(own.note,'ملاحظة المعلم');assert.deepEqual(normalize(own),own,'normalizing API response preserves all fields');
assert.equal(shared.studentFollowUpFromSmartRecord(day,'missing'),null);
assert(!JSON.stringify(own).includes('حقل قديم'));assert(!JSON.stringify(own).includes('ملاحظة خاصة بالثاني'));
for(const [errors,level]of [[null,'not-evaluated'],[0,'prince'],[1,'hero'],[2,'hero'],[3,'star'],[4,'diligent']]){
 const row=normalize({date:day.date,readingErrors:errors,spellingErrors:errors});
 assert.equal(row.readingLevelLabel,shared.getSmartRecordAwardLabel(level,'reading'));assert.equal(row.spellingLevelLabel,shared.getSmartRecordAwardLabel(level,'spelling'));
}
assert.equal(normalize({date:'2026-02-31'}),null);assert.equal(normalize(null),null);
assert.equal(shared.smartRecordClassroom('الصف الثاني الابتدائي أ'),'second-a');assert.equal(shared.smartRecordClassroom('الثاني ب'),'second-b');
let docs=new Map([['latest_second-a',{latestSmartRecordDate:day.date}],['2026-10-28_second-a',day]]),reads=[];
const cache=new Map();
const cacheApi={unstable_cache:(fn,keys,options)=>async()=>{const key=JSON.stringify(keys);if(!cache.has(key))cache.set(key,{promise:fn(),tags:options.tags});return cache.get(key).promise;},revalidateTag:tag=>{for(const [key,entry]of cache)if(entry.tags.includes(tag))cache.delete(key);}};
const db={collection:name=>{assert.equal(name,'smartRecords');return {doc:id=>({get:async()=>{reads.push(id);return {data:()=>docs.get(id)}}})}}};
const admin={getFirebaseAdmin:()=>({adminDb:db,adminAuth:{verifyIdToken:async token=>({role:token==='teacher'?'teacher':'student'})}})};
const reader={};new Function('require','exports',compile('reader'))(name=>name==='server-only'?{}:name==='next/cache'?cacheApi:name==='../../firebase-admin'?admin:shared,reader);
const refresh={};new Function('require','exports',compile('refresh'))(name=>name==='next/cache'?cacheApi:name==='next/server'?{NextResponse:{json:(data,options={})=>({status:options.status||200,data})}}:name==='../../../../../firebase-admin'?admin:shared,refresh);
async function invalidate(role){return refresh.POST(new Request('https://example.test/api/teacher/smart-record/refresh',{method:'POST',headers:{authorization:'Bearer '+role,'content-type':'application/json'},body:JSON.stringify({classroom:'second-a'})}));}
(async()=>{
 const student={classroom:'الثاني أ',smartFollowUp:{date:day.date,readingErrors:99,note:'نسخة قديمة'}};
 const first=await reader.getStudentSmartRecordFollowUp('one',student,'2026-10-30');assert.equal(first.readingErrors,0,'canonical row overrides stale student projection');assert.equal(reads.length,3);
 const second=await reader.getStudentSmartRecordFollowUp('two',student,'2026-10-30');assert.equal(second.readingErrors,3);assert.equal(reads.length,3,'students share cached class reads');assert.equal(second.attendanceLabel,'متأخر');
 docs.set('2026-10-28_second-a',{...day,records:day.records.map(row=>row.studentId==='one'?{...row,readingErrors:4,readingKing:false}:row)});
 assert.equal((await invalidate('student')).status,403);assert.equal((await reader.getStudentSmartRecordFollowUp('one',student,'2026-10-30')).readingErrors,0);
 assert.equal((await invalidate('teacher')).status,200);assert.equal((await reader.getStudentSmartRecordFollowUp('one',student,'2026-10-30')).readingErrors,4,'teacher save refreshes shared cache');
 docs.set('latest_second-a',{latestSmartRecordDate:'2026-10-30'});docs.set('2026-10-30_second-a',{...day,date:'2026-10-30'});await invalidate('teacher');
 assert.equal((await reader.getStudentSmartRecordFollowUp('one',{classroom:'الثاني أ'},'2026-10-30')).date,'2026-10-30','latest record does not depend on a student projection');
 assert.equal(await reader.getStudentSmartRecordFollowUp('missing',student,'2026-10-30'),null);
 assert(reads.every(id=>id==='latest_second-a'||/^\d{4}-\d{2}-\d{2}_second-a$/.test(id)),'only known class/date documents are read');
 const before=reads.length;assert.equal(await reader.getStudentSmartRecordFollowUp('one',{classroom:'غير محدد'},'2026-10-30'),null);assert.equal(reads.length,before);
 const card=source('journey').split('function SmartRecordFollowUpCard')[1].split('function StatCard')[0];assert(!/readingAccuracyLabel|readingFluencyLabel|readingDiacriticsLabel|الطلاقة|الحركات|الدقة/.test(card));
 for(const label of ['الحضور','الواجب','القراءة','الإملاء','ملاحظة المعلم'])assert(card.includes(label));
 assert(source('teacher').includes('runTransaction(db'));assert(source('teacher').includes('selectedDate >= latestDate'));assert(source('teacher').includes('/api/teacher/smart-record/refresh'));
 console.log('PASS: exact field parity, shared award rules, crowns, null/zero errors, spelling, attendance/homework, privacy, stale projection override, shared class cache, teacher-only invalidation, unsupported fields absent; all changed TS/TSX parses.');
})().catch(error=>{console.error(error);process.exitCode=1});
