"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sharp_1 = __importDefault(require("sharp"));
const has_1 = __importDefault(require("lodash/has"));
const isBuffer_1 = __importDefault(require("lodash/isBuffer"));
const buffer_1 = require("buffer");
/**
 * Input can be base64 string, buffer or a blob
 */
function imageProcessing(input, dimensions) {
    let image;
    const inputIsBuffer = (0, isBuffer_1.default)(input);
    if (inputIsBuffer)
        //@ts-ignore-error
        image = (0, sharp_1.default)(input);
    if (input instanceof buffer_1.Blob)
        //@ts-ignore-error
        image = (0, sharp_1.default)(Buffer.from(input, 'base64url'));
    if (!inputIsBuffer)
        image = (0, sharp_1.default)(Buffer.from(String(input).replace(/^data:image\/[a-z]+;base64,/, ""), 'base64url'));
    return new Promise((resolve, reject) => {
        image.metadata((err, metadata) => {
            if (err)
                reject(err);
            if (!(0, has_1.default)(metadata, "width"))
                reject("No metadata on image");
            if (!(0, has_1.default)(metadata, "format"))
                reject("Format incompatible");
            image.resize(Object.assign({ fit: sharp_1.default.fit.cover }, (dimensions ? dimensions : {}))).jpeg({
                quality: 96,
                mozjpeg: true,
                force: true
            })
                .toBuffer((err, img) => {
                if (err) {
                    reject(err);
                }
                if (!img) {
                    reject("NO IMG OUTPUT RESULT");
                    return false;
                }
                const out = `data:image/jpeg;base64,${img.toString('base64')}`;
                resolve(out);
            });
        });
    });
}
exports.default = imageProcessing;
