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
const imageProcessing_1 = __importDefault(require("../../utils/imageProcessing"));
const __1 = require("../..");
class UsersDAO {
    static getUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield prisma_1.default.user.findMany({
                select: {
                    id: true,
                    name: true,
                },
            });
            return users;
        });
    }
    static getUserById(id) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let user = yield prisma_1.default.user.findUnique({
                where: { id },
                select: { id: true, name: true, pfp: { select: { base64: true } } },
            });
            const out = user
                ? {
                    id: user.id,
                    name: user.name,
                    pfp: (_a = user.pfp) === null || _a === void 0 ? void 0 : _a.base64,
                }
                : undefined;
            return out;
        });
    }
    static getUserByName(name) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const findQ = yield prisma_1.default.user.findMany({
                where: {
                    name: {
                        equals: name.trim(),
                        mode: "insensitive",
                    },
                },
                select: {
                    id: true,
                    name: true,
                    pfp: { select: { base64: true } },
                },
            });
            const out = findQ[0]
                ? {
                    id: findQ[0].id,
                    name: findQ[0].name,
                    pfp: (_a = findQ[0].pfp) === null || _a === void 0 ? void 0 : _a.base64,
                }
                : undefined;
            return out || undefined;
        });
    }
    static updateUser(uid, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (data.name) {
                yield prisma_1.default.user.update({
                    where: { id: uid },
                    data: {
                        name: data.name,
                    },
                });
            }
            let base64;
            if (data.pfp) {
                try {
                    base64 = yield (0, imageProcessing_1.default)(data.pfp, { width: 48, height: 48 });
                }
                catch (e) {
                    throw new Error(`Error processing image : ${e}`);
                }
                const matchingPfp = yield prisma_1.default.pfp.findUnique({
                    where: { userId: uid },
                });
                if (matchingPfp) {
                    yield prisma_1.default.pfp.update({
                        where: { userId: uid },
                        data: {
                            base64,
                        },
                    });
                }
                else {
                    yield prisma_1.default.pfp.create({
                        data: {
                            userId: uid,
                            base64,
                        },
                    });
                }
            }
            __1.io.to(uid).emit("user_subscription_update", Object.assign(Object.assign({ id: uid }, (data.name ? { name: data.name } : {})), (data.pfp ? { pfp: base64 } : {})));
        });
    }
    static createUser(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const passHash = yield bcrypt_1.default.hash(password, 10);
            const user = yield prisma_1.default.user.create({
                data: {
                    name: username,
                    password: passHash,
                },
                select: {
                    id: true,
                    name: true,
                },
            });
            return user;
        });
    }
}
exports.default = UsersDAO;
