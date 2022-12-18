"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRequest = exports.baseURL = void 0;
const axios_1 = __importDefault(require("axios"));
exports.baseURL = process.env.NODE_ENV === "production" ? "https://prisma-social-media-js.herokuapp.com" : "http://localhost:3001";
const api = axios_1.default.create({
    baseURL: exports.baseURL,
});
function makeRequest(url, options) {
    return api(url, options)
        .then((res) => res.data)
        .catch((error) => {
        var _a, _b;
        return Promise.reject(((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data.msg) !== null && _b !== void 0 ? _b : "Error").replace("Error: ", ""));
    });
}
exports.makeRequest = makeRequest;
