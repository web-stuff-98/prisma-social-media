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
const prisma_1 = __importDefault(require("../../utils/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Users_dao_1 = __importDefault(require("../dao/Users.dao"));
const __1 = require("../..");
const getUserSocket_1 = __importDefault(require("../../utils/getUserSocket"));
const limiters_1 = require("../limiter/limiters");
const getReqIp_1 = __importDefault(require("../../utils/getReqIp"));
const busboy_1 = __importDefault(require("busboy"));
class UsersController {
    static getUsers(_, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield Users_dao_1.default.getUsers();
                res.status(200).json(users);
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static getUserById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield Users_dao_1.default.getUserById(req.params.id);
                if (user)
                    res.status(200).json(user);
                else
                    res.status(404).json({ msg: "Not found" });
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static updatePfp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let gotFile = false;
            const bb = (0, busboy_1.default)({
                headers: req.headers,
                limits: { files: 1, fields: 0, fileSize: 10000000 },
            });
            bb.on("file", (_, stream, info) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                gotFile = true;
                yield Users_dao_1.default.updatePfp(String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id), stream, info);
                res.writeHead(201, { Connection: "close " });
                res.end();
            }));
            bb.on("finish", () => {
                if (!gotFile) {
                    req.unpipe(bb);
                    res.status(400).json({ msg: "No file!" });
                }
            });
            bb.on("error", (e) => __awaiter(this, void 0, void 0, function* () {
                req.unpipe(bb);
                res.status(400).json({ msg: `${e}` });
            }));
            req.pipe(bb);
        });
    }
    static getProfile(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const profile = yield Users_dao_1.default.getProfile(req.params.uid, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                res.status(200).json(profile);
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static updateProfile(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Users_dao_1.default.updateProfile(String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id), req.body.bio);
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static updateProfileImage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let gotFile = false;
            const bb = (0, busboy_1.default)({
                headers: req.headers,
                limits: { files: 1, fields: 0, fileSize: 10000000 },
            });
            bb.on("file", (_, stream, info) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                gotFile = true;
                yield Users_dao_1.default.updateProfileImage(String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id), stream, info);
                res.writeHead(201, { Connection: "close " });
                res.end();
            }));
            bb.on("finish", () => {
                if (!gotFile) {
                    req.unpipe(bb);
                    res.status(400).json({ msg: "No file!" });
                }
            });
            bb.on("error", (e) => __awaiter(this, void 0, void 0, function* () {
                req.unpipe(bb);
                res.status(400).json({ msg: `${e}` });
            }));
            req.pipe(bb);
        });
    }
    static register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username, password } = req.body;
            const foundUser = yield Users_dao_1.default.getUserByName(username);
            if (foundUser) {
                return res
                    .status(400)
                    .json({ msg: "There is a user with that name already" })
                    .end();
            }
            try {
                const user = yield Users_dao_1.default.createUser(username.trim(), password);
                res.cookie("token", jsonwebtoken_1.default.sign(JSON.stringify({ id: String(user === null || user === void 0 ? void 0 : user.id), name: user.name }), String(process.env.JWT_SECRET)), {
                    secure: process.env.NODE_ENV === "production",
                    httpOnly: true,
                    sameSite: "strict",
                    maxAge: 60 * 60 * 24,
                });
                req.user = user;
                res.status(201).json(user).end();
            }
            catch (e) {
                res
                    .status(400)
                    .json({ msg: `${e}` })
                    .end();
            }
        });
    }
    static login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username, password } = req.body;
            let user;
            try {
                user = yield prisma_1.default.user.findFirstOrThrow({
                    where: { name: { equals: username, mode: "insensitive" } },
                });
            }
            catch (e) {
                res.status(404).json({ msg: "User does not exist" });
            }
            let compare;
            const ip = (0, getReqIp_1.default)(req);
            try {
                compare = yield bcrypt_1.default.compare(password, user === null || user === void 0 ? void 0 : user.password);
            }
            catch (error) {
                yield (0, limiters_1.bruteFail)(ip, "login");
                return res.status(403).json({ msg: "Unauthorized" });
            }
            if (!compare) {
                yield (0, limiters_1.bruteFail)(ip, "login");
                return res.status(403).json({ msg: "Incorrect credentials" });
            }
            yield (0, limiters_1.bruteSuccess)(ip, "login");
            req.user = user;
            res.cookie("token", jsonwebtoken_1.default.sign(JSON.stringify({ id: String(user === null || user === void 0 ? void 0 : user.id), name: user === null || user === void 0 ? void 0 : user.name }), String(process.env.JWT_SECRET)), {
                secure: process.env.NODE_ENV === "production",
                httpOnly: true,
                sameSite: "strict",
                maxAge: 60 * 60 * 24,
            });
            if (user)
                __1.io.to(`user=${user.id}`).emit("user_visible_update", {
                    id: user.id,
                    online: true,
                });
            res.status(200).json(user).end();
        });
    }
    static logout(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (req.user) {
                const socket = yield (0, getUserSocket_1.default)(req.user.id);
                if (socket) {
                    socket.data.user = {
                        id: "",
                        name: "",
                        room: undefined,
                    };
                }
                __1.io.to(`user=${(_a = req.user) === null || _a === void 0 ? void 0 : _a.id}`).emit("user_visible_update", {
                    id: req.user.id,
                    online: false,
                });
            }
            delete req.user;
            res.status(200).clearCookie("token", { path: "/", maxAge: 0 }).end();
        });
    }
    static checkLogin(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            res.status(200).json(req.user).end();
        });
    }
}
exports.default = UsersController;
