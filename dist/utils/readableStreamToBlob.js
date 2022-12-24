"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("buffer");
exports.default = (stream, mimeType, useProgress) => new Promise((resolve, reject) => {
    let chunks = [];
    let bytesComplete = 0;
    stream
        .on("data", (chunk) => {
        chunks.push(chunk);
        if (useProgress === null || useProgress === void 0 ? void 0 : useProgress.onProgress) {
            bytesComplete += chunk.length;
            useProgress === null || useProgress === void 0 ? void 0 : useProgress.onProgress(bytesComplete / ((useProgress === null || useProgress === void 0 ? void 0 : useProgress.totalBytes) || 1000));
        }
    })
        .once("end", () => {
        const blob = mimeType != null
            ? new buffer_1.Blob(chunks, { type: mimeType })
            : new buffer_1.Blob(chunks);
        resolve(blob);
    })
        .once("error", () => {
        reject();
    });
});
