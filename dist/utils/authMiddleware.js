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
exports.withUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.cookies;
    if (!token)
        return res.status(403).end();
    try {
        const decodedToken = jsonwebtoken_1.default.verify(token, String(process.env.JWT_SECRET));
        if (!req.user) {
            const verifiedData = JSON.parse(JSON.stringify(decodedToken));
            req.user = verifiedData;
        }
    }
    catch (error) {
        return res.status(403).json({ msg: "Unauthorized" }).end();
    }
    next();
});
const withUser = (req, _, next) => {
    const { token } = req.cookies;
    if (token) {
        const decodedToken = jsonwebtoken_1.default.verify(token, String(process.env.JWT_SECRET));
        if (!req.user) {
            const verifiedData = JSON.parse(JSON.stringify(decodedToken));
            req.user = verifiedData;
        }
    }
    next();
};
exports.withUser = withUser;
exports.default = authMiddleware;
