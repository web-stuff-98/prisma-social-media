import sharp, { Sharp } from "sharp";
import isBuffer from "lodash/isBuffer";
import { Blob } from "buffer";
//@ts-ignore

/**
 * The output image will never be upscaled. It is clamped to the original width and height. Dimensions are for downscaling the image.
 */

interface IDimensions {
  width: number;
  height: number;
}

export default async function imageProcessing(
  input: string | Buffer | Blob,
  dimensions: IDimensions,
  noHeader?: boolean
): Promise<string> {
  let image: Sharp;
  const inputIsBuffer = isBuffer(input);
  if (inputIsBuffer) {
    image = sharp(input as Buffer);
  }
  if (input instanceof Blob) {
    const arrayBuffer = await input.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    image = sharp(buffer);
  } else if (!inputIsBuffer) {
    image = sharp(
      Buffer.from(
        String(input).replace(/^data:image\/[a-z]+;base64,/, ""),
        "base64url"
      )
    );
  }
  return new Promise((resolve, reject) => {
    image.metadata((err: unknown, metadata: sharp.Metadata) => {
      if (err) reject(err);
      const dimensionsPreventUpscaling = dimensions
        ? {
            width: metadata
              ? dimensions.width *
                Math.min(Number(metadata.width) / dimensions.width, 1)
              : dimensions.width,
            height: metadata
              ? dimensions.height *
                Math.min(Number(metadata.height) / dimensions.height, 1)
              : dimensions.width,
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
          }
          const out = `${
            noHeader ? "" : "data:image/jpeg;base64,"
          }${img.toString("base64")}`;
          resolve(out);
        });
    });
  });
}
