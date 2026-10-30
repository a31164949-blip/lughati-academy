const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
const files={lib:'app/lib/littleTeacherSpelling.ts',api:'app/api/little-teacher-spelling/route.ts',card:'app/components/SpellingPracticeCards.tsx',journey:'app/journey/page.tsx',teacher:'app/teacher/student-messages/page.tsx'};
function source(name){return fs.readFileSync(path.join(root,files[name]),'utf8')}
function compile(name){const r=ts.transpileModule(source(name),{fileName:files[name],reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}});assert.equal((r.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,name);return r.outputText;}
const lib={};new Function('exports',compile('lib'))(lib);for(const name of ['card','journey','teacher'])compile(name);
assert.equal(lib.littleTeacherWord('  بِلَادِي  '),'بِلَادِي');assert.equal(lib.littleTeacherWord('العَـلَمُ'),'العَلَمُ');
for(const word of ['',null,'علم بلادي','hello','١٢٣','<script>','َُِ','ع'.repeat(41),'كلمة\nأخرى'])assert.throws(()=>lib.littleTeacherWord(word));
let records=new Map(),writes=0,reads=0,suspended=false,deleted=false,verifyFailure=false;
const db={collection:name=>({doc:id=>({path:name+'/'+id,get:async()=>{assert.equal(name,'students');reads++;return{data:()=>({studentName:'الاسم الموثق',classroom:'الثاني أ',deleted})}}})}),runTransaction:async callback=>callback({get:async ref=>{reads++;return{exists:records.has(ref.path),data:()=>records.get(ref.path)}},create:(ref,data)=>{assert(!records.has(ref.path));writes++;records.set(ref.path,data)}})};
const api={};new Function('require','exports',compile('api'))(name=>{
 if(name==='node:crypto')return require(name);
 if(name==='next/server')return{NextResponse:{json:(data,options)=>({data,status:options.status})}};
 if(name==='firebase-admin/firestore')return{FieldValue:{serverTimestamp:()=>123}};
 if(name==='../../../firebase-admin')return{getFirebaseAdmin:()=>({adminDb:db,adminAuth:{verifyIdToken:async token=>{if(verifyFailure)throw Error('bad token');return token==='teacher'?{role:'teacher'}:{role:'student',studentDocId:token}}}})};
 if(name==='../../lib/studentAccess')return{requireStudentExtras:async()=>{if(suspended)throw Error('FORBIDDEN')}};
 if(name==='../../lib/littleTeacherSpelling')return lib;
 throw Error(name);
},api);
function request(word,token='one'){return api.POST(new Request('https://example.test/api/little-teacher-spelling',{method:'POST',headers:{...(token?{authorization:'Bearer '+token}:{}),'content-type':'application/json'},body:JSON.stringify({word,studentId:'forged',studentName:'اسم مزور'})}))}
(async()=>{
 let result=await request('العَلَمُ');assert.equal(result.status,200);assert.equal(writes,1);assert.equal(result.data.word,'العَلَمُ');assert.equal(result.data.alreadySubmitted,false);
 const saved=[...records.values()][0];assert.equal(saved.studentId,'one');assert.equal(saved.studentName,'الاسم الموثق');assert.equal(saved.source,lib.LITTLE_TEACHER_SOURCE);assert.equal(saved.category,'lesson');assert.equal(saved.teacherReply,'');assert.equal(saved.status,'new');assert.equal(saved.studentViewedReply,false);assert(saved.message.includes('علم بلادي'));assert(!('points'in saved));
 result=await request('الوَطَنُ');assert.equal(result.status,200);assert.equal(result.data.alreadySubmitted,true);assert.equal(result.data.word,'العَلَمُ');assert.equal(writes,1,'retry cannot create duplicate or alter original');
 result=await request('الوَطَنُ','two');assert.equal(result.status,200);assert.equal(records.size,2,'different students have separate suggestions');
 const beforeWrites=writes,beforeReads=reads;
 result=await request('bad');assert.equal(result.status,400);assert.equal(reads,beforeReads);
 result=await request('الوطن','teacher');assert.equal(result.status,403);
 result=await request('الوطن','');assert.equal(result.status,401);
 verifyFailure=true;result=await request('الوطن');assert.equal(result.status,401);verifyFailure=false;
 suspended=true;result=await request('الوطن','three');assert.equal(result.status,403);suspended=false;
 deleted=true;result=await request('الوطن','three');assert.equal(result.status,403);deleted=false;
 assert.equal(writes,beforeWrites);
 assert(!/onSnapshot|setInterval|getDoc|getDocs/.test(source('card')),'no list reads or polling in student card');
 assert(source('teacher').includes('visibleMessages.map'));assert(source('teacher').includes('اقتراحات المعلم الصغير'));
 const {default:postcss}=await import('postcss');postcss.parse(fs.readFileSync(path.join(root,'app/components/SpellingPracticeCards.module.css'),'utf8'));
 console.log('PASS: vocalized Arabic single words, invalid input, trusted identity, one suggestion per student/lesson, safe retries, teacher inbox fields, no point awards, suspended/unauthorized/deleted accounts, local teacher filter, no mount reads, CSS and TSX syntax.');
})().catch(error=>{console.error(error);process.exitCode=1});
