import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "../../../../firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEACHER_EMAIL = "a31164949@gmail.com";

async function requireTeacher(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const { adminAuth } = getFirebaseAdmin();
  const decoded = await adminAuth.verifyIdToken(authorization.slice(7));
  const email = typeof decoded.email === "string" ? decoded.email.trim().toLowerCase() : "";
  if (email !== TEACHER_EMAIL.toLowerCase()) throw new Error("FORBIDDEN");
}

function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || "";
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || "";
  if (!cloudName || !apiKey || !apiSecret) throw new Error("CLOUDINARY_NOT_CONFIGURED");
  return { cloudName, apiKey, apiSecret };
}

export async function GET(request: Request) {
  try {
    await requireTeacher(request);
    const publicId = new URL(request.url).searchParams.get("publicId")?.trim() || "";
    if (!publicId) return NextResponse.json({ success:false, message:"publicId مطلوب" }, { status:400 });

    const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    const url = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/resources/video/upload/${encodeURIComponent(publicId)}?image_metadata=true&media_metadata=true`;
    const response = await fetch(url, { headers:{ Authorization:`Basic ${auth}` }, cache:"no-store" });
    if (!response.ok) {
      return NextResponse.json({ success:false, status:response.status, message:"تعذر قراءة بيانات الفيديو من Cloudinary" }, { status:response.status });
    }

    const data = await response.json() as Record<string, unknown>;
    const derived = Array.isArray(data.derived) ? data.derived : [];
    return NextResponse.json({
      success:true,
      resource:{
        public_id:data.public_id,
        resource_type:data.resource_type,
        format:data.format,
        bytes:data.bytes,
        duration:data.duration,
        width:data.width,
        height:data.height,
        video:data.video,
        audio:data.audio,
        video_metadata:data.video_metadata,
        created_at:data.created_at,
        derived:derived.map((item) => {
          const d=item as Record<string, unknown>;
          return { transformation:d.transformation, format:d.format, bytes:d.bytes, secure_url:d.secure_url };
        }),
      },
    });
  } catch (error) {
    const message=error instanceof Error ? error.message : "";
    const status=message==="UNAUTHORIZED" ? 401 : message==="FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success:false, message }, { status });
  }
}
