import internal from "stream";
import { Blob } from "buffer";

/**
 * Progress is in the range of 0 - 1
 */

export default (
  stream: internal.Readable,
  mimeType: string,
  useProgress?: {
    onProgress: (progress: number) => void;
    totalBytes: number;
  }
): Promise<Blob> =>
  new Promise<Blob>((resolve, reject) => {
    let chunks:any[] = [];
    let bytesComplete: number = 0;
    stream
      .on("data", (chunk) => {
        chunks.push(chunk);
        if (useProgress?.onProgress) {
          bytesComplete += chunk.length;
          useProgress?.onProgress(
            bytesComplete / (useProgress?.totalBytes || 1000)
          );
        }
      })
      .once("end", () => {
        const blob =
          mimeType != null
            ? new Blob(chunks, { type: mimeType })
            : new Blob(chunks);
        resolve(blob);
      })
      .once("error", () => {
        reject();
      });
  });
