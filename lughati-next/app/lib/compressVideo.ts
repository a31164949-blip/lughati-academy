const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const COMPRESS_ABOVE_BYTES = 8 * 1024 * 1024;
const prepared = new WeakMap<File, File>();
export type VideoProgress = (message: string) => void;

export function compressionSettings(width: number, height: number, duration: number) {
  const scale = Math.min(1, 1280 / Math.max(width, height), 720 / Math.min(width, height));
  return { width: Math.max(2, Math.floor(width * scale / 2) * 2), height: Math.max(2, Math.floor(height * scale / 2) * 2),
    videoBitsPerSecond: Math.max(350000, Math.min(1500000, Math.floor(16 * 1024 * 1024 * 8 / duration - 96000))) };
}

// Compression stays on the device. Never upload the large original as a fallback.
export async function prepareVideo(file: File, progress: VideoProgress = () => {}, maxDuration = 180) {
  const cached = prepared.get(file);
  if (cached) return cached;
  if (file.size <= COMPRESS_ABOVE_BYTES) return file;
  if (file.size > 300 * 1024 * 1024) throw new Error("حجم الفيديو كبير جدًا. اختر مقطعًا أقل من 300 ميجابايت.");
  if (typeof MediaRecorder === "undefined" || typeof AudioContext === "undefined" || !HTMLCanvasElement.prototype.captureStream) {
    if (file.size <= MAX_UPLOAD_BYTES) return file;
    throw new Error("الضغط التلقائي غير متاح في هذا المتصفح. جرّب متصفحًا محدثًا أو فيديو بدقة 720p.");
  }
  const mimeType = ["video/mp4", "video/webm;codecs=vp8,opus", "video/webm"].find(type => MediaRecorder.isTypeSupported(type));
  if (!mimeType) {
    if (file.size <= MAX_UPLOAD_BYTES) return file;
    throw new Error("هذا المتصفح لا يدعم ضغط الفيديو. جرّب فيديو بدقة 720p.");
  }
  progress("جارٍ تجهيز ضغط الفيديو… أبقِ الصفحة مفتوحة.");
  const video = document.createElement("video");
  video.playsInline = true;
  video.preload = "auto";
  const url = URL.createObjectURL(file);
  const context = new AudioContext();
  // Request audio activation before metadata awaits; no microphone permission is used.
  const resumed = context.resume();
  const source = context.createMediaElementSource(video);
  const destination = context.createMediaStreamDestination();
  source.connect(destination);
  let stream: MediaStream | undefined;
  let recorder: MediaRecorder | undefined;
  let frame = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let metadataTimer: ReturnType<typeof setTimeout> | undefined;
  let visibility: (() => void) | undefined;
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("تعذر قراءة الفيديو. اختر ملفًا يمكن تشغيله على جهازك."));
      metadataTimer = setTimeout(() => reject(new Error("تعذر تجهيز الفيديو للضغط.")), 15000);
      video.src = url;
      // Unlock this media element while still in the upload click gesture.
      void video.play().then(() => video.pause()).catch(() => {});
    });
    clearTimeout(metadataTimer);
    video.pause();
    if (video.currentTime > 0) {
      await new Promise<void>((resolve, reject) => {
        timer = setTimeout(() => reject(new Error("تعذر تجهيز بداية الفيديو.")), 10000);
        video.onseeked = () => { clearTimeout(timer); resolve(); }; video.currentTime = 0;
      });
    }
    if (!Number.isFinite(video.duration) || video.duration <= 0 || video.duration > maxDuration || !video.videoWidth || !video.videoHeight) {
      if (file.size <= MAX_UPLOAD_BYTES) return file;
      throw new Error(maxDuration === 30 ? "اختر فيديو مدته 30 ثانية أو أقل." : "الضغط التلقائي يدعم المقاطع حتى 3 دقائق. اختر مقطعًا أقصر.");
    }
    await Promise.race([resumed, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("تعذر تشغيل الصوت أثناء الضغط. أعد المحاولة مع إبقاء الصفحة مفتوحة.")), 3000); })]);
    clearTimeout(timer);
    const settings = compressionSettings(video.videoWidth, video.videoHeight, video.duration);
    const canvas = document.createElement("canvas");
    canvas.width = settings.width; canvas.height = settings.height;
    const drawing = canvas.getContext("2d");
    if (!drawing) throw new Error("تعذر تجهيز ضغط الفيديو.");
    const draw = () => { drawing.drawImage(video, 0, 0, canvas.width, canvas.height); frame = requestAnimationFrame(draw); };
    draw();
    const canvasStream = canvas.captureStream(25);
    stream = new MediaStream([...canvasStream.getVideoTracks(), ...destination.stream.getAudioTracks()]);
    recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: settings.videoBitsPerSecond, audioBitsPerSecond: 96000 });
    const chunks: Blob[] = [];
    let recordedBytes = 0;
    const result = await new Promise<Blob>((resolve, reject) => {
      const fail = (message: string) => { reject(new Error(message)); if (recorder?.state !== "inactive") recorder?.stop(); video.pause(); };
      recorder!.ondataavailable = event => {
        if (event.data.size) { chunks.push(event.data); recordedBytes += event.data.size; }
        if (recordedBytes > MAX_UPLOAD_BYTES) fail("تعذر تقليل الفيديو إلى الحجم المطلوب. جرّب مقطعًا أقصر أو بدقة أقل.");
      };
      recorder!.onerror = () => fail("تعذر ضغط الفيديو في هذا المتصفح.");
      recorder!.onstop = () => resolve(new Blob(chunks, { type: recorder!.mimeType.split(";")[0] }));
      video.onended = () => { if (recorder?.state !== "inactive") recorder?.stop(); };
      video.onerror = () => fail("توقف تشغيل الفيديو أثناء الضغط.");
      video.ontimeupdate = () => progress(`جارٍ ضغط الفيديو… ${Math.min(99, Math.round(video.currentTime / video.duration * 100))}٪ — أبقِ الصفحة مفتوحة.`);
      visibility = () => { if (document.visibilityState !== "visible") fail("توقف الضغط عند مغادرة الصفحة. أعد المحاولة وأبقِها مفتوحة."); };
      document.addEventListener("visibilitychange", visibility);
      timer = setTimeout(() => fail("استغرق ضغط الفيديو وقتًا طويلًا. أعد المحاولة."), (video.duration + 30) * 1000);
      recorder!.start(1000);
      void video.play().catch(() => fail("تعذر تشغيل الفيديو للضغط. أعد المحاولة أو استخدم فيديو بدقة 720p."));
    });
    if (!result.size || result.size > MAX_UPLOAD_BYTES) throw new Error("تعذر ضغط الفيديو إلى أقل من 20 ميجابايت.");
    const output = result.size < file.size ? new File([result], file.name.replace(/\.[^.]+$/, "") + (result.type === "video/mp4" ? ".mp4" : ".webm"), { type: result.type, lastModified: file.lastModified }) : file;
    if (output.size > MAX_UPLOAD_BYTES) throw new Error("الفيديو ما زال أكبر من 20 ميجابايت بعد الضغط.");
    prepared.set(file, output);
    progress(`تم تجهيز الفيديو (${(output.size / 1024 / 1024).toFixed(1)} ميجابايت). جارٍ الرفع…`);
    return output;
  } finally {
    clearTimeout(timer); clearTimeout(metadataTimer); cancelAnimationFrame(frame);
    if (visibility) document.removeEventListener("visibilitychange", visibility);
    if (recorder && recorder.state !== "inactive") recorder.stop();
    stream?.getTracks().forEach(track => track.stop());
    destination.stream.getTracks().forEach(track => track.stop());
    source.disconnect(); video.pause(); video.removeAttribute("src"); video.load();
    URL.revokeObjectURL(url); void context.close().catch(() => {});
  }
}
