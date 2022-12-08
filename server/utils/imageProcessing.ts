import sharp, { Sharp } from "sharp";
import isBuffer from "lodash/isBuffer";
import has from "lodash/has"
import { Blob } from "buffer";
//@ts-ignore

/**
 * The output image will never be upscaled. It is clamped to the original width and height.
 * Dimensions are only for downscaling the image. Don't need to upscale images.
 */

interface IDimensions {
  width: number;
  height: number;
}

export default async function imageProcessing(
  input: string | Buffer | Blob,
  dimensions: IDimensions,
  asBuffer?: boolean
): Promise<string | Buffer> {
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
          if (err)
            reject(err);
          if (!img)
            reject("There was an error during the processing of this image.");
          if (asBuffer) resolve(img);
          resolve(`data:image/jpeg;base64,${img.toString("base64")}`);
        });
    });
  });
}
