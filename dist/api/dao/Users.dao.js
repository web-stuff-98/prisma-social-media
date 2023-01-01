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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../utils/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const imageProcessing_1 = __importDefault(require("../../utils/imageProcessing"));
const __1 = require("../..");
const getUserSocket_1 = __importDefault(require("../../utils/getUserSocket"));
const redis_1 = __importDefault(require("../../utils/redis"));
const aws_1 = __importDefault(require("../../utils/aws"));
const readableStreamToBlob_1 = __importDefault(require("../../utils/readableStreamToBlob"));
const S3 = new aws_1.default.S3();
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
    static getProfile(uid, currentUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const profile = yield prisma_1.default.profile.findUniqueOrThrow({
                    where: { userId: uid },
                });
                const shares = yield prisma_1.default.post.findMany({
                    where: { shares: { some: { userId: uid } } },
                    select: { slug: true },
                });
                return { profileData: profile, shares: shares.map((s) => s.slug) };
            }
            catch (e) {
                throw new Error(currentUserId && currentUserId === uid
                    ? "You have no profile"
                    : "User has no profile");
            }
        });
    }
    static updateProfile(uid, bio) {
        return __awaiter(this, void 0, void 0, function* () {
            const profile = yield prisma_1.default.profile.findUnique({
                where: { userId: uid },
            });
            if (profile)
                yield prisma_1.default.profile.update({
                    where: { userId: uid },
                    data: { bio },
                });
            else
                yield prisma_1.default.profile.create({
                    data: {
                        userId: uid,
                        bio,
                    },
                });
            __1.io.to(`profile=${uid}`).emit("profile_update", { bio });
        });
    }
    static updateProfileImage(uid, stream, info) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!info.mimeType.startsWith("image/jpeg") &&
                !info.mimeType.startsWith("image/jpg") &&
                !info.mimeType.startsWith("image/png") &&
                !info.mimeType.startsWith("image/avif") &&
                !info.mimeType.startsWith("image/heic")) {
                throw new Error("Input is not an image, or is of an unsupported format.");
            }
            const blob = yield (0, readableStreamToBlob_1.default)(stream, info.mimeType);
            const scaled = (yield (0, imageProcessing_1.default)(blob, {
                width: 136,
                height: 33,
            }));
            const matchingProfile = yield prisma_1.default.profile.findUnique({
                where: { userId: uid },
            });
            if (matchingProfile) {
                yield prisma_1.default.profile.update({
                    where: { userId: uid },
                    data: {
                        backgroundBase64: scaled,
                    },
                });
            }
            else {
                yield prisma_1.default.profile.create({
                    data: {
                        userId: uid,
                        backgroundBase64: scaled,
                    },
                });
            }
            __1.io.to(`profile=${uid}`).emit("profile_update", {
                backgroundBase64: scaled,
            });
        });
    }
    static getUserById(id) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let user = yield prisma_1.default.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                    pfp: { select: { base64: true } },
                },
            });
            const socket = yield (0, getUserSocket_1.default)(id);
            const out = user
                ? Object.assign(Object.assign({ id: user.id, name: user.name }, (((_a = user.pfp) === null || _a === void 0 ? void 0 : _a.base64) ? { pfp: user.pfp.base64 } : {})), { online: socket ? true : false }) : undefined;
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
                    createdAt: true,
                    pfp: { select: { base64: true } },
                },
            });
            if (!findQ[0])
                return undefined;
            const socket = yield (0, getUserSocket_1.default)(findQ[0].id);
            const out = findQ[0]
                ? Object.assign({ id: findQ[0].id, name: findQ[0].name, online: socket ? true : false }, (((_a = findQ[0].pfp) === null || _a === void 0 ? void 0 : _a.base64) ? { pfp: findQ[0].pfp.base64 } : {})) : undefined;
            return out;
        });
    }
    static updatePfp(uid, stream, info) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!info.mimeType.startsWith("image/jpeg") &&
                !info.mimeType.startsWith("image/jpg") &&
                !info.mimeType.startsWith("image/png") &&
                !info.mimeType.startsWith("image/avif") &&
                !info.mimeType.startsWith("image/heic")) {
                throw new Error("Input is not an image, or is of an unsupported format.");
            }
            const blob = yield (0, readableStreamToBlob_1.default)(stream, info.mimeType);
            const scaled = (yield (0, imageProcessing_1.default)(blob, {
                width: 48,
                height: 48,
            }));
            const matchingPfp = yield prisma_1.default.pfp.findUnique({ where: { userId: uid } });
            if (matchingPfp) {
                yield prisma_1.default.pfp.update({
                    where: { userId: uid },
                    data: {
                        base64: scaled,
                    },
                });
            }
            else {
                yield prisma_1.default.pfp.create({
                    data: {
                        userId: uid,
                        base64: scaled,
                    },
                });
            }
            __1.io.to(`user=${uid}`).emit("user_visible_update", {
                id: uid,
                pfp: scaled,
            });
        });
    }
    static createUser(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const foundName = yield prisma_1.default.user.findFirst({
                where: { name: { equals: username.trim(), mode: "insensitive" } },
                select: { id: true },
            });
            if (foundName)
                throw new Error("There is a user with that name already");
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
            const keyVal = yield redis_1.default.get("deleteAccountsCountdownList");
            let deleteAccountsCountdownList = [
                { id: user.id, deleteAt: new Date(Date.now() + 1200000).toISOString() },
            ];
            if (keyVal)
                deleteAccountsCountdownList = [
                    ...deleteAccountsCountdownList,
                    ...JSON.parse(keyVal),
                ];
            yield redis_1.default.set("deleteAccountsCountdownList", JSON.stringify(deleteAccountsCountdownList));
            return user;
        });
    }
    static deleteUser(id) {
        var _a, e_1, _b, _c, _d, e_2, _e, _f, _g, e_3, _h, _j;
        return __awaiter(this, void 0, void 0, function* () {
            // delete all the users post images
            const posts = yield prisma_1.default.post.findMany({
                where: { authorId: id, imagePending: false },
            });
            try {
                for (var _k = true, posts_1 = __asyncValues(posts), posts_1_1; posts_1_1 = yield posts_1.next(), _a = posts_1_1.done, !_a;) {
                    _c = posts_1_1.value;
                    _k = false;
                    try {
                        const post = _c;
                        yield new Promise((resolve, reject) => {
                            S3.deleteObject({
                                Key: `${(process.env.NODE_ENV !== "production" ? "dev." : "") +
                                    post.imageKey}`,
                                Bucket: "prisma-socialmedia",
                            }, (err, _) => {
                                if (err)
                                    reject(err);
                                resolve();
                            });
                        });
                        yield new Promise((resolve, reject) => {
                            S3.deleteObject({
                                Key: `${process.env.NODE_ENV !== "production" ? "dev." : ""}thumb.${post.imageKey}`,
                                Bucket: "prisma-socialmedia",
                            }, (err, _) => {
                                if (err)
                                    reject(err);
                                resolve();
                            });
                        });
                    }
                    finally {
                        _k = true;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_k && !_a && (_b = posts_1.return)) yield _b.call(posts_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            // delete all the users attachments
            const roomMessages = yield prisma_1.default.roomMessage.findMany({
                where: { senderId: id, hasAttachment: true },
            });
            try {
                for (var _l = true, roomMessages_1 = __asyncValues(roomMessages), roomMessages_1_1; roomMessages_1_1 = yield roomMessages_1.next(), _d = roomMessages_1_1.done, !_d;) {
                    _f = roomMessages_1_1.value;
                    _l = false;
                    try {
                        const msg = _f;
                        yield new Promise((resolve, reject) => {
                            S3.deleteObject({
                                Key: `${(process.env.NODE_ENV !== "production" ? "dev." : "") +
                                    msg.attachmentKey}`,
                                Bucket: "prisma-socialmedia",
                            }, (err, _) => {
                                if (err)
                                    reject(err);
                                resolve();
                            });
                        });
                    }
                    finally {
                        _l = true;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (!_l && !_d && (_e = roomMessages_1.return)) yield _e.call(roomMessages_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
            const privateMessages = yield prisma_1.default.roomMessage.findMany({
                where: { senderId: id, hasAttachment: true },
            });
            try {
                for (var _m = true, privateMessages_1 = __asyncValues(privateMessages), privateMessages_1_1; privateMessages_1_1 = yield privateMessages_1.next(), _g = privateMessages_1_1.done, !_g;) {
                    _j = privateMessages_1_1.value;
                    _m = false;
                    try {
                        const msg = _j;
                        yield new Promise((resolve, reject) => {
                            S3.deleteObject({
                                Key: `${(process.env.NODE_ENV !== "production" ? "dev." : "") +
                                    msg.attachmentKey}`,
                                Bucket: "prisma-socialmedia",
                            }, (err, _) => {
                                if (err)
                                    reject(err);
                                resolve();
                            });
                        });
                    }
                    finally {
                        _m = true;
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (!_m && !_g && (_h = privateMessages_1.return)) yield _h.call(privateMessages_1);
                }
                finally { if (e_3) throw e_3.error; }
            }
            //everything else is deleted automatically via SQL cascade
            yield prisma_1.default.user.delete({ where: { id } });
        });
    }
}
exports.default = UsersDAO;
