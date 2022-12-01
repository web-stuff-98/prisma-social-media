"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sharp_1 = __importDefault(require("sharp"));
const isBuffer_1 = __importDefault(require("lodash/isBuffer"));
const buffer_1 = require("buffer");
function imageProcessing(input, dimensions, noHeader) {
    return __awaiter(this, void 0, void 0, function* () {
        let image;
        const inputIsBuffer = (0, isBuffer_1.default)(input);
        if (inputIsBuffer) {
            image = (0, sharp_1.default)(input);
        }
        if (input instanceof buffer_1.Blob) {
            const arrayBuffer = yield input.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            image = (0, sharp_1.default)(buffer);
        }
        else if (!inputIsBuffer) {
            image = (0, sharp_1.default)(Buffer.from(String(input).replace(/^data:image\/[a-z]+;base64,/, ""), "base64url"));
        }
        return new Promise((resolve, reject) => {
            image.metadata((err, metadata) => {
                if (err)
                    reject(err);
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
                    .resize(Object.assign({ fit: sharp_1.default.fit.cover }, (dimensionsPreventUpscaling ? dimensionsPreventUpscaling : {})))
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
                    const out = `${noHeader ? "" : "data:image/jpeg;base64,"}${img.toString("base64")}`;
                    resolve(out);
                });
            });
        });
    });
}
exports.default = imageProcessing;
