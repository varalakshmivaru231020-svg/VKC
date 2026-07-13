import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export interface CloudinaryUploadResult {
  secure_url: string;
  width?: number;
  height?: number;
  bytes: number;
}

/** Uploads an already-processed image buffer (e.g. WebP from sharp) to Cloudinary. */
export function uploadBufferToCloudinary(
  buffer: Buffer,
  options: { folder?: string; format?: string } = {}
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder ?? "vijaylakshmi/products",
        format: options.format ?? "webp",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Cloudinary upload returned no result"));
        resolve(result as unknown as CloudinaryUploadResult);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}
