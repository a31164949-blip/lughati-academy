// Device-side image preparation and retry reuse. No extra Cloudinary transformations.
const MAX_IMAGE_BYTES = 30 * 1024 * 1024;
const prepared = new WeakMap<File, Promise<File>>();
const uploads = new WeakMap<File, Map<string, { expires: number; response: Promise<Response> }>>();
export function imageDimensions(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw Error("تعذر قراءة أبعاد الصورة.");
  const scale = Math.min(1, 2000 / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
export async function prepareImage(file: File): Promise<File> {
  // Keep animation/vector content and non-image attachments intact.
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  if (file.size > MAX_IMAGE_BYTES) throw Error("الصورة أكبر من 30 ميجابايت. اختر صورة أصغر.");
  const existing = prepared.get(file);
  if (existing) return existing;
  const promise = (async () => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const canvas = document.createElement("canvas");
    try {
      await new Promise<void>((resolve, reject) => {
        timer = setTimeout(() => reject(Error("تعذر تجهيز الصورة. حاول بصورة أخرى.")), 20000);
        image.onload = () => resolve();
        image.onerror = () => reject(Error("تعذر قراءة الصورة. حاول بصورة أخرى."));
        image.src = url;
      });
      clearTimeout(timer);
      const dimensions = imageDimensions(image.naturalWidth, image.naturalHeight);
      // Avoid recompressing small, already well-sized images.
      if (file.size <= 350 * 1024 && dimensions.width === image.naturalWidth && dimensions.height === image.naturalHeight) return file;
      canvas.width = dimensions.width; canvas.height = dimensions.height;
      const context = canvas.getContext("2d");
      if (!context) throw Error("تعذر ضغط الصورة في هذا المتصفح.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      // PNG/WebP retain transparency; toBlob falls back to PNG if WebP encoding is unsupported.
      const type = file.type === "image/jpeg" ? "image/jpeg" : "image/webp";
      const blob = await new Promise<Blob>((resolve, reject) => {
        timer = setTimeout(() => reject(Error("تعذر إكمال ضغط الصورة. حاول بصورة أخرى.")), 20000);
        canvas.toBlob(value => value ? resolve(value) : reject(Error("تعذر ضغط الصورة.")), type, 0.9);
      });
      if (blob.size >= file.size) return file;
      const extension = blob.type === "image/jpeg" ? "jpg" : blob.type === "image/webp" ? "webp" : "png";
      return new File([blob], file.name.replace(/\.[^.]+$/, "") + "." + extension, { type: blob.type, lastModified: file.lastModified });
    } finally {
      clearTimeout(timer); image.onload = null; image.onerror = null; image.src = "";
      URL.revokeObjectURL(url); canvas.width = 0; canvas.height = 0;
    }
  })();
  prepared.set(file, promise);
  try { return await promise; } catch (error) { prepared.delete(file); throw error; }
}

export async function uploadCloudinary(url: string, options: RequestInit): Promise<Response> {
  if (!/^https:\/\/api\.cloudinary\.com\/v1_1\/ffv5igmg\/(image|auto|video|raw)\/upload$/.test(url) || !(options.body instanceof FormData)) throw Error("طلب رفع غير صالح.");
  const source = options.body.get("file");
  if (!(source instanceof File)) throw Error("اختر ملفًا للرفع.");
  const params = [...options.body.entries()].filter(([key]) => key !== "file");
  // Signed uploads or extra binary fields need their own fresh request.
  const reusable = !params.some(([key, value]) => key === "signature" || typeof value !== "string");
  const cacheKey = JSON.stringify([url, params]);
  const cache = uploads.get(source) || new Map();
  const cached = reusable ? cache.get(cacheKey) : undefined;
  if (cached && cached.expires > Date.now()) return (await cached.response).clone();
  const task = (async () => {
    const body = new FormData();
    for (const [key, value] of options.body as FormData) body.append(key, key === "file" ? await prepareImage(source) : value);
    const response = await fetch(url, { ...options, body });
    if (!response.ok) { cache.delete(cacheKey); return response; }
    // Only a fully successful upload with a delivery URL is safe to reuse after a save failure.
    const data = await response.clone().json();
    if (typeof data.secure_url !== "string" || !data.secure_url) cache.delete(cacheKey);
    return response;
  })();
  if (reusable) {
    cache.set(cacheKey, { expires: Date.now() + 30 * 60000, response: task });
    uploads.set(source, cache);
  }
  try { return (await task).clone(); } catch (error) { cache.delete(cacheKey); throw error; }
}
