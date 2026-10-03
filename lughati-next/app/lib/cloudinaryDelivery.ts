export type CloudinaryAssetKind = "image" | "video";

export function optimizeCloudinaryUrl(
  value: string,
  kind: CloudinaryAssetKind,
  width?: number
) {
  if (!value) return value;

  try {
    const url = new URL(value);
    if (
      url.hostname !== "res.cloudinary.com" ||
      !url.pathname.includes("/upload/")
    ) {
      return value;
    }

    // Do not stack transformations when the stored URL is already optimized.
    const afterUpload = url.pathname.split("/upload/")[1] || "";
    const firstSegment = afterUpload.split("/")[0] || "";
    if (/^(?:f_|q_|w_|h_|c_|vc_|ac_|br_)/.test(firstSegment)) {
      return value;
    }

    const transformations = [
      "f_auto",
      "q_auto",
      width ? `w_${width}` : "",
      width ? "c_limit" : "",
    ].filter(Boolean).join(",");

    url.pathname = url.pathname.replace(
      "/upload/",
      `/upload/${transformations}/`
    );

    return url.toString();
  } catch {
    return value;
  }
}

export function cloudinaryImageUrl(value: string, width = 1200) {
  return optimizeCloudinaryUrl(value, "image", width);
}

export function cloudinaryVideoUrl(value: string, width = 720) {
  return optimizeCloudinaryUrl(value, "video", width);
}
