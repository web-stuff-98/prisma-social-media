import sharp, { Sharp } from "sharp";
import has from "lodash/has";
import isBuffer from "lodash/isBuffer";
import { Blob } from "buffer";

/**
 * The output image will never be upscaled. It is clamped to the original width and height. Dimensions are for downscaling the image.
 */

interface IDimensions {
  width: number;
  height: number;
}

export default function imageProcessing(
  input: string | Buffer | Blob,
  dimensions: IDimensions
): Promise<string> {
  let image: Sharp;
  const inputIsBuffer = isBuffer(input);
  if (inputIsBuffer) image = sharp(input as Buffer);
  if (input instanceof Blob)
    image = sharp(Buffer.from(input as any, "base64url"));
  if (!inputIsBuffer)
    image = sharp(
      Buffer.from(
        String(input).replace(/^data:image\/[a-z]+;base64,/, ""),
        "base64url"
      )
    );
  return new Promise((resolve, reject) => {
    image.metadata((err: unknown, metadata: sharp.Metadata) => {
      if (err) reject(err);
      if (!has(metadata, "width")) reject("No metadata on image");
      if (!has(metadata, "format")) reject("Format incompatible");
      const dimensionsPreventUpscaling = dimensions
        ? {
            width:
              dimensions.width *
              Math.min(metadata.width! / dimensions.width, 1),
            height:
              dimensions.height *
              Math.min(metadata.height! / dimensions.height, 1),
          }
        : undefined;
      image
        .resize({
          fit: sharp.fit.cover,
          ...(dimensionsPreventUpscaling ? dimensionsPreventUpscaling : {}),
        })
        .jpeg({
          quality: 96,
          mozjpeg: true,
          force: true,
        })
        .toBuffer((err, img) => {
          if (err) {
            reject(err);
          }
          if (!img) {
            reject("NO IMG OUTPUT RESULT");
            return false;
          }
          const out = `data:image/jpeg;base64,${img.toString("base64")}`;
          resolve(out);
        });
    });
  });
}
