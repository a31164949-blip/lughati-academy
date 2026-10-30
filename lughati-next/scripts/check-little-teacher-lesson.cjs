const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
const files={lib:'app/lib/littleTeacherSpelling.ts',cache:'app/lib/littleTeacherLesson.ts',settings:'app/api/teacher/little-teacher-spelling/route.ts',student:'app/api/little-teacher-spelling/route.ts',card:'app/components/SpellingPracticeCards.tsx',editor:'app/components/LittleTeacherLessonSettings.tsx',journey:'app/journey/page.tsx',api:'app/api/student-journey/route.ts',teacher:'app/teacher/student-messages/page.tsx'};
const source=name=>fs.readFileSync(path.join(root,files[name]),'utf8');
function compile(name){const r=ts.transpileModule(source(name),{fileName:files[name],reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}});assert.equal((r.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,name);return r.outputText;}
for(const name of Object.keys(files))compile(name);
const lib={};new Function('exports',compile('lib'))(lib);
assert.deepEqual(lib.readLittleTeacherLesson(null),{title:'علم بلادي',lessonId:'alam-biladi',revision:'default'});
assert.equal(lib.littleTeacherLessonTitle('  مدينتان   مقدستان  '),'مدينتان مقدستان');
for(const value of ['',null,'ع'.repeat(81),'سطر\nآخر','<عنوان>'])assert.throws(()=>lib.littleTeacherLessonTitle(value));
let writes=0,reads=0;const docs=new Map([['students/one',{studentName:'طالب موثق',classroom:'الثاني أ'}]]),cached=new Map(),invalidated=[];
function reference(path){return{path,get:async()=>{reads++;return{exists:docs.has(path),data:()=>docs.get(path)}}}}
const db={collection:name=>({doc:id=>reference(name+'/'+id)}),runTransaction:async callback=>{
 const pending=[];const result=await callback({get:async ref=>{assert.equal(pending.length,0);return ref.get()},set:(ref,data)=>pending.push([ref.path,data]),create:(ref,data)=>{assert(!docs.has(ref.path));pending.push([ref.path,data])}});
 for(const [key,data]of pending){docs.set(key,{...docs.get(key),...data});writes++}return result;
}};
const admin={getFirebaseAdmin:()=>({adminDb:db,adminAuth:{verifyIdToken:async token=>{if(token==='bad')throw Error('bad');return token==='teacher'?{role:'teacher',uid:'teacher-id'}:{role:'student',studentDocId:token}}}})};
const cacheApi={unstable_cache:(fn,keys,options)=>async()=>{const key=JSON.stringify(keys);if(!cached.has(key))cached.set(key,{value:fn(),tags:options.tags});return cached.get(key).value},revalidateTag:(tag,options)=>{assert.equal(options.expire,0);invalidated.push(tag);for(const[key,item]of cached)if(item.tags.includes(tag))cached.delete(key)}};
const next={NextResponse:{json:(data,options)=>({data,status:options.status})}};
const cacheModule={};new Function('require','exports',compile('cache'))(name=>name==='server-only'?{}:name==='next/cache'?cacheApi:name==='../../firebase-admin'?admin:lib,cacheModule);
function imports(name){if(name==='node:crypto')return require(name);if(name==='next/cache')return cacheApi;if(name==='next/server')return next;if(name==='firebase-admin/firestore')return{FieldValue:{serverTimestamp:()=>123}};if(name.endsWith('/firebase-admin'))return admin;if(name.endsWith('/studentAccess'))return{requireStudentExtras:async()=>{}};if(name.endsWith('/littleTeacherLesson'))return cacheModule;if(name.endsWith('/littleTeacherSpelling'))return lib;throw Error(name)}
const settings={},student={};new Function('require','exports',compile('settings'))(imports,settings);new Function('require','exports',compile('student'))(imports,student);
function request(method,body,token='teacher'){return new Request('https://example.test/api',{method,headers:{authorization:'Bearer '+token,'content-type':'application/json'},...(method==='GET'?{}:{body:JSON.stringify(body)})})}
(async()=>{
 let result=await settings.GET(request('GET'));assert.equal(result.status,200);const initial=result.data.lesson;assert.equal(initial.title,'علم بلادي');
 const coldReads=reads;await cacheModule.getLittleTeacherLesson();await cacheModule.getLittleTeacherLesson();assert.equal(reads,coldReads,'shared cached settings do not read per student');
 result=await student.POST(request('POST',{word:'العَلَمُ',lessonId:initial.lessonId},'one'));assert.equal(result.status,200);const firstMessage=[...docs.values()].find(row=>row.source===lib.LITTLE_TEACHER_SOURCE);assert.equal(firstMessage.lesson,'علم بلادي');
 const before=writes;result=await settings.PATCH(request('PATCH',{title:'مدينتان مقدستان',revision:initial.revision},'one'));assert.equal(result.status,403);assert.equal(writes,before);
 result=await settings.PATCH(request('PATCH',{title:'مدينتان مقدستان',revision:initial.revision}));assert.equal(result.status,200);const current=result.data.lesson;assert.notEqual(current.lessonId,initial.lessonId);assert(invalidated.includes(lib.LITTLE_TEACHER_CONFIG_TAG));assert.equal((await settings.GET(request('GET'))).data.lesson.title,'مدينتان مقدستان');
 const afterChange=writes;result=await student.POST(request('POST',{word:'مَكَّةُ',lessonId:initial.lessonId},'one'));assert.equal(result.status,409);assert.equal(writes,afterChange,'stale student cannot submit to changed lesson');
 result=await student.POST(request('POST',{word:'مَكَّةُ',lessonId:current.lessonId,lesson:'عنوان مزور'},'one'));assert.equal(result.status,200);assert.equal([...docs.values()].filter(row=>row.source===lib.LITTLE_TEACHER_SOURCE).length,2,'old proposal is preserved');assert([...docs.values()].some(row=>row.proposedWord===lib.littleTeacherWord('مَكَّةُ')&&row.lesson==='مدينتان مقدستان'));
 const afterProposal=writes;result=await settings.PATCH(request('PATCH',{title:current.title,revision:current.revision}));assert.equal(result.data.lesson.lessonId,current.lessonId);assert.equal(writes,afterProposal,'saving same title preserves lesson and proposal limit');
 result=await student.POST(request('POST',{word:'الْمَدِينَةُ',lessonId:current.lessonId},'one'));assert.equal(result.data.alreadySubmitted,true);assert.equal(writes,afterProposal);
 result=await settings.PATCH(request('PATCH',{title:'درس آخر',revision:initial.revision}));assert.equal(result.status,409);assert.equal(writes,afterProposal);
 result=await settings.PATCH(request('PATCH',{title:'',revision:current.revision}));assert.equal(result.status,400);assert.equal(writes,afterProposal);
 result=await settings.GET(request('GET',null,'bad'));assert.equal(result.status,401);
 assert(source('card').includes('lesson.title'));assert(source('card').includes('lessonId:lesson.lessonId'));assert(!source('card').includes('درس علم بلادي'));assert(source('journey').includes('lesson={littleTeacherLesson}'));assert(source('api').includes('getLittleTeacherLesson()'));
 console.log('PASS: teacher-only title updates, default/legacy IDs, new lesson allows fresh proposal, history preserved, stale student/editor rejected, same-title no-op, shared cache invalidation, authoritative title, dynamic UI and TSX syntax.');
})().catch(error=>{console.error(error);process.exitCode=1});
