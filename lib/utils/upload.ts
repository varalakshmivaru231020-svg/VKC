/** Max video upload size, shared by the API route and every admin screen that
 *  offers a video picker. One source of truth so the UI can never advertise a
 *  ceiling the server won't honour.
 *
 *  MUST stay <= `client_max_body_size` in the nginx vhost
 *  (`/etc/nginx/sites-enabled/vijaylakshmisarees.com.conf`). If nginx is lower,
 *  it rejects the request itself with an HTML 413 that never reaches this app,
 *  and the admin just sees "invalid response". */
export const MAX_VIDEO_UPLOAD_BYTES = 1000 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_LABEL = "1000MB";

export interface UploadMeta {
  originalSize: number;
  outputSize: number;
  compressionPercent: number;
  format: string;
  width?: number;
  height?: number;
}

export interface UploadSuccess {
  ok: true;
  url: string;
  meta?: UploadMeta;
}

export interface UploadFailure {
  ok: false;
  error: string;   // short — show in UI
  details: string; // long — show in tooltip / console
}

export type UploadResult = UploadSuccess | UploadFailure;

export async function uploadImageFile(file: File): Promise<UploadResult> {
  const fd = new FormData();
  fd.append("file", file);

  let res: Response;
  try {
    res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  } catch (netErr: any) {
    const details = `Network request failed: ${netErr.message}. Check your internet connection and try again.`;
    console.error("[uploadImageFile] Network error:", netErr);
    return { ok: false, error: "Network error", details };
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    return {
      ok: false,
      error: `Server error (HTTP ${res.status})`,
      details: "Server returned an invalid response. Please try again.",
    };
  }

  if (!res.ok) {
    const error   = data?.error   ?? `Upload failed (HTTP ${res.status})`;
    const details = data?.details ?? "No additional information from server.";
    console.error(`[uploadImageFile] ${error} — ${details}`);
    return { ok: false, error, details };
  }

  return { ok: true, url: data.url, meta: data.meta };
}

export async function uploadVideoFile(file: File): Promise<UploadResult> {
  const fd = new FormData();
  fd.append("file", file);

  let res: Response;
  try {
    res = await fetch("/api/admin/upload-video", { method: "POST", body: fd });
  } catch (netErr: any) {
    const details = `Network request failed: ${netErr.message}. Check your internet connection and try again.`;
    console.error("[uploadVideoFile] Network error:", netErr);
    return { ok: false, error: "Network error", details };
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    return {
      ok: false,
      error: `Server error (HTTP ${res.status})`,
      details: "Server returned an invalid response. Please try again.",
    };
  }

  if (!res.ok) {
    const error   = data?.error   ?? `Upload failed (HTTP ${res.status})`;
    const details = data?.details ?? "No additional information from server.";
    console.error(`[uploadVideoFile] ${error} — ${details}`);
    return { ok: false, error, details };
  }

  return { ok: true, url: data.url };
}
