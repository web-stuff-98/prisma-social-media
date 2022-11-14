import sharp, { Sharp } from "sharp"
import has from "lodash/has"
import isBuffer from "lodash/isBuffer"
import { Blob } from "buffer"

interface IDimensions {
  width: number,
  height: number
}

/**
 * Input can be base64 string, buffer or a blob
 */

export default function imageProcessing(input: any, dimensions: IDimensions):Promise<string> {
  let image: Sharp
  const inputIsBuffer = isBuffer(input)
  if (inputIsBuffer)
    //@ts-ignore-error
    image = sharp(input)
  if(input instanceof Blob)
    //@ts-ignore-error
    image = sharp(Buffer.from(input, 'base64url'))
  if (!inputIsBuffer)
    image = sharp(Buffer.from(String(input).replace(/^data:image\/[a-z]+;base64,/, ""), 'base64url'))
  return new Promise((resolve, reject) => {
    image.metadata((err:any, metadata:any) => {
      if (err) reject(err)
      if (!has(metadata, "width")) reject("No metadata on image")
      if (!has(metadata, "format")) reject("Format incompatible")
      image.resize({
        fit: sharp.fit.cover,
        ...(dimensions ? dimensions : {})
      }).jpeg({
        quality: 96,
        mozjpeg: true,
        force: true
      })
        .toBuffer((err, img) => {
          if (err) { reject(err) }
          if (!img) { reject("NO IMG OUTPUT RESULT"); return false }
          const out = `data:image/jpeg;base64,${img.toString('base64')}`
          resolve(out)
        })
    })
  })
}