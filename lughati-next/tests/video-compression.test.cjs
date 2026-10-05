const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function fixture({ supported = true, largeOutput = false, hidden = false } = {}) {
  const metrics = { revoked: 0, closed: 0, stopped: 0, recordings: 0, tracks: [], settings: null };
  let recorder, visibility;
  const track = kind => ({ kind, stop: () => metrics.stopped++ });
  class Stream { constructor(tracks) { this.tracks = tracks; } getTracks() { return this.tracks; } }
  const video = { playsInline: false, preload: '', currentTime: 0, duration: 27, videoWidth: 3840, videoHeight: 2160,
    set src(value) { queueMicrotask(() => this.onloadeddata?.()); }, pause() {}, load() {}, removeAttribute() {},
    play() { if (recorder?.state === 'recording') queueMicrotask(() => {
      if (hidden) { document.visibilityState = 'hidden'; visibility?.(); }
      else { this.currentTime = 27; this.ontimeupdate?.(); this.onended?.(); }
    }); return Promise.resolve(); }
  };
  const canvas = { width: 0, height: 0, getContext: () => ({ drawImage() {} }), captureStream: () => ({ getVideoTracks: () => [track('video')] }) };
  const document = { visibilityState: 'visible', createElement: type => type === 'video' ? video : canvas,
    addEventListener: (_,fn) => { visibility=fn; }, removeEventListener: () => { visibility=null; } };
  class Context { constructor() { this.state='running'; } resume() { return Promise.resolve(); }
    createMediaElementSource() { return { connect() {}, disconnect() {} }; }
    createMediaStreamDestination() { return { stream: { getAudioTracks: () => [track('audio')], getTracks: () => [track('audio')] } }; }
    close() { metrics.closed++; return Promise.resolve(); }
  }
  class Recorder { static isTypeSupported(type) { return supported && type === 'video/mp4'; }
    constructor(stream, settings) { metrics.tracks=stream.getTracks().map(t=>t.kind); metrics.settings=settings; this.mimeType='video/mp4'; this.state='inactive'; recorder=this; }
    start() { this.state='recording'; metrics.recordings++; }
    stop() { this.state='inactive'; this.ondataavailable?.({data:new Blob([largeOutput ? new Uint8Array(21*1024*1024) : 'encoded'],{type:'video/mp4'})}); this.onstop?.(); }
  }
  const module={exports:{}};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/lib/compressVideo.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,
    { module,exports:module.exports,File,Blob,WeakMap,Promise,Error,Math,MediaRecorder:Recorder,AudioContext:Context,HTMLCanvasElement:{prototype:{captureStream(){}}},MediaStream:Stream,document,
      URL:{createObjectURL:()=> 'blob:local',revokeObjectURL:()=> metrics.revoked++},requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout,clearTimeout });
  const file={name:'original.mov',size:25*1024*1024,type:'video/quicktime',lastModified:123};
  return { ...module.exports,metrics,file };
}
test('small files stay unchanged and do not start an encoder',async()=>{
  const f=fixture(),file={...f.file,size:2*1024*1024}; assert.equal(await f.prepareVideo(file),file); assert.equal(f.metrics.recordings,0);
});
test('large videos include source audio, preserve aspect ratio, clean resources and reuse compressed file for retries',async()=>{
  const f=fixture(),messages=[]; const out=await f.prepareVideo(f.file,m=>messages.push(m));
  assert.equal(out.type,'video/mp4'); assert.equal(out.name,'original.mp4'); assert(out.size<20*1024*1024);
  assert.deepEqual(Array.from(f.metrics.tracks),['video','audio']); assert.equal(f.metrics.settings.videoBitsPerSecond,1500000);
  assert.equal(f.metrics.closed,1); assert.equal(f.metrics.revoked,1); assert(f.metrics.stopped>=2);
  assert.equal(await f.prepareVideo(f.file),out); assert.equal(f.metrics.recordings,1); assert(messages.some(m=>m.includes('99')));
  const landscape=f.compressionSettings(3840,2160,27),portrait=f.compressionSettings(2160,3840,27);
  assert.equal(landscape.width,1280); assert.equal(landscape.height,720); assert.equal(portrait.width,720); assert.equal(portrait.height,1280);
});
test('unsupported browsers never pass oversized originals through to upload',async()=>{
  const f=fixture({supported:false}); await assert.rejects(f.prepareVideo(f.file),/لا يدعم/); assert.equal(f.metrics.recordings,0);
});
test('oversized encoded result is rejected and resources are released',async()=>{
  const f=fixture({largeOutput:true}); await assert.rejects(f.prepareVideo(f.file),/الحجم المطلوب|20 ميجابايت/); assert.equal(f.metrics.closed,1); assert.equal(f.metrics.revoked,1);
});
test('backgrounding cancels compression instead of silently recording missing frames',async()=>{
  const f=fixture({hidden:true}); await assert.rejects(f.prepareVideo(f.file),/مغادرة الصفحة/); assert.equal(f.metrics.closed,1); assert.equal(f.metrics.revoked,1);
});
