const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function compile(p){const r=ts.transpileModule(fs.readFileSync(path.join(root,p),'utf8'),{fileName:p,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}});assert.equal((r.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,p);return r.outputText;}
const lib={};new Function('exports',compile('app/lib/littleTeacherSpelling.ts'))(lib);
assert.equal(lib.littleTeacherApplicantName('  سلمان   عيسى  '),'سلمان عيسى');
for(const name of ['',null,'<script>','س'.repeat(81),'سلمان\nعيسى','123'])assert.throws(()=>lib.littleTeacherApplicantName(name));
let records=new Map(),writes=0,suspended=false,archived=false,lesson={title:'علم بلادي',lessonId:'alam-biladi',revision:'default'};
const db={collection:c=>({doc:id=>({path:c+'/'+id,get:async()=>({data:()=>({studentName:'الاسم الموثق',classroom:'الثاني أ',archived})})})}),runTransaction:async callback=>callback({get:async ref=>({exists:records.has(ref.path),data:()=>ref.path.startsWith('settings/')?lesson:records.get(ref.path)}),create:(ref,data)=>{assert(!records.has(ref.path));writes++;records.set(ref.path,data)}})};
const api={};new Function('require','exports',compile('app/api/little-teacher-application/route.ts'))(name=>{
if(name==='node:crypto')return require(name);
if(name==='next/server')return{NextResponse:{json:(data,options)=>({data,status:options.status})}};
if(name==='firebase-admin/firestore')return{FieldValue:{serverTimestamp:()=>123}};
if(name==='../../../firebase-admin')return{getFirebaseAdmin:()=>({adminDb:db,adminAuth:{verifyIdToken:async token=>token==='teacher'?{role:'teacher'}:{role:'student',studentDocId:token}}})};
if(name==='../../lib/studentAccess')return{requireStudentExtras:async()=>{if(suspended)throw Error('FORBIDDEN')}};
if(name==='../../lib/littleTeacherSpelling')return lib;
throw Error(name);},api);
const request=(name,token='one',lessonId='alam-biladi')=>api.POST(new Request('https://example.test/api/little-teacher-application',{method:'POST',headers:{...(token?{authorization:'Bearer '+token}:{}),'content-type':'application/json'},body:JSON.stringify({name,lessonId,studentId:'forged',studentName:'مزور'})}));
(async()=>{
let r=await request('سلمان عيسى');assert.equal(r.status,200);assert.equal(writes,1);assert.equal(r.data.name,'سلمان عيسى');const saved=[...records.values()][0];assert.equal(saved.studentId,'one');assert.equal(saved.studentName,'الاسم الموثق');assert.equal(saved.applicantName,'سلمان عيسى');assert.equal(saved.source,'little-teacher-application');assert(saved.message.includes('مقطع فيديو'));assert(!('points' in saved));
r=await request('اسم مختلف');assert.equal(r.data.alreadySubmitted,true);assert.equal(r.data.name,'سلمان عيسى');assert.equal(writes,1);
assert.equal((await request('<script>')).status,400);assert.equal((await request('سلمان','')).status,401);assert.equal((await request('سلمان','teacher')).status,403);
suspended=true;assert.equal((await request('سلمان','two')).status,403);suspended=false;archived=true;assert.equal((await request('سلمان','two')).status,403);archived=false;
lesson={title:'درس جديد',lessonId:'new-lesson',revision:'two'};assert.equal((await request('سلمان')).status,409);assert.equal((await request('سلمان','one','new-lesson')).status,200);assert.equal(writes,2);assert.equal(records.size,2);
for(const p of ['app/components/SpellingPracticeCards.tsx','app/components/LittleTeacherLessonSettings.tsx','app/teacher/student-messages/page.tsx'])compile(p);
const card=fs.readFileSync(path.join(root,'app/components/SpellingPracticeCards.tsx'),'utf8');assert(card.includes('words: string[]'));assert(card.includes('data-has-words'));assert(card.includes('styles.words'));assert(card.includes('تختار كلمات الإملاء'));assert(card.includes('بمساعدة معلمك'));assert(!/onSnapshot|setInterval|getDoc|getDocs/.test(card));assert(!card.includes('أرسل كلمتي'));
console.log('PASS: name validation, trusted student identity, teacher inbox record, retry deduplication, access checks, stale lesson rejection, separate lesson registration, preserved history, student card contract, no polling, TSX syntax.');
})().catch(e=>{console.error(e);process.exitCode=1});
