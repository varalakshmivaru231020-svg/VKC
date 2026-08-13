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

// Cloudinary requires every chunk except the last to be at least 5 MB; 20 MB is
// their own default and keeps the round-trip count sane on large files.
const VIDEO_CHUNK_SIZE = 20 * 1024 * 1024;
// The SDK defaults to a 60s timeout, which a several-hundred-MB upload blows
// straight through. Matches the 900s proxy timeouts in the nginx vhost.
const VIDEO_UPLOAD_TIMEOUT_MS = 900_000;

/** Uploads a raw video (MP4/WebM/MOV) to Cloudinary, as a buffer or a stream.
 *
 *  Uses the CHUNKED endpoint deliberately: plain `upload_stream` posts the file
 *  in a single request and Cloudinary rejects that outright above 100 MB, which
 *  is well under what the admin panel accepts.
 *
 *  Caveat worth knowing when debugging a failed upload: chunking clears the
 *  *endpoint* limit, not the *account* one. Cloudinary also caps video file size
 *  per plan (100 MB on the free tier), and that ceiling can't be coded around. */
export function uploadVideoBufferToCloudinary(
  source: Buffer | Readable,
  options: { folder?: string } = {}
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_chunked_stream(
      {
        folder: options.folder ?? "vijaylakshmi/videos",
        resource_type: "video",
        chunk_size: VIDEO_CHUNK_SIZE,
        timeout: VIDEO_UPLOAD_TIMEOUT_MS,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Cloudinary upload returned no result"));
        resolve(result as unknown as CloudinaryUploadResult);
      }
    );
    const input = Buffer.isBuffer(source) ? Readable.from(source) : source;
    input.on("error", reject);
    input.pipe(stream);
  });
}
