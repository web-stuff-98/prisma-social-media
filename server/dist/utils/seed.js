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
const prisma_1 = __importDefault(require("./prisma"));
const lorem_ipsum_1 = require("lorem-ipsum");
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const imageProcessing_1 = __importDefault(require("./imageProcessing"));
const aws_1 = __importDefault(require("./aws"));
const zlib_1 = __importDefault(require("zlib"));
const s3 = new aws_1.default.S3();
const lipsum = new lorem_ipsum_1.LoremIpsum();
// the password for the example users is "Test1234!"
let generatedUsers = [];
let generatedPosts = [];
let generatedRooms = [];
function seed() {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma_1.default.user.deleteMany();
        yield generateUsers(5);
        yield generatePosts(60);
        yield generateRooms(20);
        yield generatePostImages();
        yield generateCommentsOnPosts();
        yield generateLikesAndSharesOnPosts();
        yield generateLikesOnComments();
        console.log(" --- DONE ---");
    });
}
exports.default = seed;
const generateUser = (i) => __awaiter(void 0, void 0, void 0, function* () {
    const imageRes = yield (0, axios_1.default)({
        method: "GET",
        url: "https://100k-faces.glitch.me/random-image",
        responseType: "arraybuffer",
    });
    const pfp = (yield (0, imageProcessing_1.default)(Buffer.from(imageRes.data, "binary"), {
        width: 42,
        height: 42,
    }));
    const u = yield prisma_1.default.user.create({
        data: {
            name: `TestAcc${i + 1}`,
            password: "$2a$12$KhAwjN8WzTUdYNmAjIN8nuM0XpIFhnfPCmPaimxH9YBr0pufFKBGq",
        },
    });
    yield prisma_1.default.pfp.create({
        data: {
            base64: pfp,
            userId: u.id,
        },
    });
    generatedUsers = [u, ...generatedUsers];
});
const generateUsers = (num) => __awaiter(void 0, void 0, void 0, function* () {
    var e_1, _a;
    try {
        for (var _b = __asyncValues(Array.from(Array(num).keys())), _c; _c = yield _b.next(), !_c.done;) {
            const i = _c.value;
            yield generateUser(i);
            console.log("Generated user");
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
});
const generatePost = () => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield (0, axios_1.default)({
        method: "GET",
        url: "https://jaspervdj.be/lorem-markdownum/markdown.txt",
        responseType: "arraybuffer",
    });
    const body = yield new Promise((resolve, reject) => {
        zlib_1.default.gunzip(res.data, (err, out) => {
            if (err)
                reject(err);
            resolve(out.toString());
        });
    });
    const title = lipsum.generateParagraphs(1).slice(0, 80);
    const description = lipsum
        .generateParagraphs(Math.ceil(Math.random() * 3))
        .slice(0, 160);
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") +
        crypto_1.default.randomBytes(64).toString("hex").slice(0, 6);
    const p = yield prisma_1.default.post.create({
        data: {
            title,
            description,
            slug,
            body,
            authorId: generatedUsers[Math.floor(Math.random() * generatedUsers.length)].id,
            tags: {
                connectOrCreate: lipsum
                    .generateParagraphs(1)
                    .split(" ")
                    .filter((tag) => tag !== "")
                    .slice(0, 8)
                    .map((tag) => {
                    const name = tag.trim().toLowerCase();
                    return {
                        where: { name },
                        create: { name },
                    };
                }),
            },
        },
    });
    generatedPosts = [p, ...generatedPosts];
});
const generatePosts = (num) => __awaiter(void 0, void 0, void 0, function* () {
    var e_2, _d;
    try {
        for (var _e = __asyncValues(Array.from(Array(num).keys())), _f; _f = yield _e.next(), !_f.done;) {
            const i = _f.value;
            yield generatePost();
            console.log("Generated post");
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_f && !_f.done && (_d = _e.return)) yield _d.call(_e);
        }
        finally { if (e_2) throw e_2.error; }
    }
});
const generateRoom = (i) => __awaiter(void 0, void 0, void 0, function* () {
    const authorId = generatedUsers[Math.floor(Math.random() * generatedUsers.length)].id;
    const numMembers = Math.floor(Math.random() * generatedUsers.length);
    let members = [authorId];
    while (i < numMembers) {
        i++;
        members.push(generatedUsers[Math.floor(Math.random() * generatedUsers.length)].id);
    }
    members = [...new Set(members)];
    const numBanned = Math.floor(Math.random() * 5);
    let banned = [];
    while (i < numBanned) {
        i++;
        banned.push(generatedUsers[Math.floor(Math.random() * generatedUsers.length)].id);
    }
    banned = [...new Set(banned)].filter((bannedUid) => !members.includes(bannedUid));
    const r = yield prisma_1.default.room.create({
        data: {
            name: `Example Room ${i + 1}`,
            public: Math.random() < 0.8,
            authorId,
            members: { connect: members.map((uid) => ({ id: uid })) },
            banned: { connect: banned.map((uid) => ({ id: uid })) },
        },
        include: {
            author: { select: { id: true } },
            members: { select: { id: true } },
            banned: { select: { id: true } },
        },
    });
    generatedRooms = [r, ...generatedRooms];
});
const generateRooms = (num) => __awaiter(void 0, void 0, void 0, function* () {
    var e_3, _g;
    try {
        for (var _h = __asyncValues(Array.from(Array(num).keys())), _j; _j = yield _h.next(), !_j.done;) {
            const i = _j.value;
            yield generateRoom(i);
            console.log("Generated room");
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_j && !_j.done && (_g = _h.return)) yield _g.call(_h);
        }
        finally { if (e_3) throw e_3.error; }
    }
});
const generateCommentOnPost = (postId, idsOfOtherCommentsOnPost = []) => __awaiter(void 0, void 0, void 0, function* () {
    const rand = Math.random();
    const data = Object.assign({ message: lipsum
            .generateSentences(Math.ceil(Math.max(rand * rand * 3, 1)))
            .slice(0, 300), userId: generatedUsers[Math.floor(Math.random() * generatedUsers.length)].id, postId }, (idsOfOtherCommentsOnPost.length > 0 && Math.random() < 0.666
        ? {
            parentId: idsOfOtherCommentsOnPost[Math.floor(Math.random() * idsOfOtherCommentsOnPost.length)],
        }
        : {}));
    const { id } = yield prisma_1.default.comment.create({
        data,
    });
    return id;
});
const generateCommentsOnPost = (postId) => __awaiter(void 0, void 0, void 0, function* () {
    var e_4, _k;
    const rand = Math.random();
    const rand2 = Math.random() * 100;
    const numComments = Math.floor(rand * rand * rand * rand * rand2);
    let idsOfOtherCommentsOnPost = [];
    try {
        for (var _l = __asyncValues(Array.from(Array(numComments).keys())), _m; _m = yield _l.next(), !_m.done;) {
            const i = _m.value;
            const commentId = yield generateCommentOnPost(postId, idsOfOtherCommentsOnPost);
            idsOfOtherCommentsOnPost.push(commentId);
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (_m && !_m.done && (_k = _l.return)) yield _k.call(_l);
        }
        finally { if (e_4) throw e_4.error; }
    }
});
const generateCommentsOnPosts = () => __awaiter(void 0, void 0, void 0, function* () {
    var e_5, _o;
    try {
        for (var generatedPosts_1 = __asyncValues(generatedPosts), generatedPosts_1_1; generatedPosts_1_1 = yield generatedPosts_1.next(), !generatedPosts_1_1.done;) {
            const p = generatedPosts_1_1.value;
            yield generateCommentsOnPost(p.id);
            console.log("Generated comments for post");
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (generatedPosts_1_1 && !generatedPosts_1_1.done && (_o = generatedPosts_1.return)) yield _o.call(generatedPosts_1);
        }
        finally { if (e_5) throw e_5.error; }
    }
});
const generateLikesAndSharesOnPosts = () => __awaiter(void 0, void 0, void 0, function* () {
    var e_6, _p, e_7, _q, e_8, _r;
    try {
        for (var generatedPosts_2 = __asyncValues(generatedPosts), generatedPosts_2_1; generatedPosts_2_1 = yield generatedPosts_2.next(), !generatedPosts_2_1.done;) {
            const p = generatedPosts_2_1.value;
            const likesRand = Math.random();
            const sharesRand = Math.random();
            const shuffledUsersForLikes = shuffle(generatedUsers);
            const shuffledUsersForShares = shuffle(generatedUsers);
            const numLikes = Math.floor(likesRand * likesRand * generatedUsers.length);
            const numShares = Math.floor(sharesRand * sharesRand * generatedUsers.length);
            try {
                for (var _s = (e_7 = void 0, __asyncValues(Array.from(Array(numLikes).keys()))), _t; _t = yield _s.next(), !_t.done;) {
                    const i = _t.value;
                    yield prisma_1.default.postLike.create({
                        data: {
                            postId: p.id,
                            userId: shuffledUsersForLikes[i].id,
                        },
                    });
                }
            }
            catch (e_7_1) { e_7 = { error: e_7_1 }; }
            finally {
                try {
                    if (_t && !_t.done && (_q = _s.return)) yield _q.call(_s);
                }
                finally { if (e_7) throw e_7.error; }
            }
            try {
                for (var _u = (e_8 = void 0, __asyncValues(Array.from(Array(numShares).keys()))), _v; _v = yield _u.next(), !_v.done;) {
                    const i = _v.value;
                    yield prisma_1.default.postShare.create({
                        data: {
                            postId: p.id,
                            userId: shuffledUsersForShares[i].id,
                        },
                    });
                }
            }
            catch (e_8_1) { e_8 = { error: e_8_1 }; }
            finally {
                try {
                    if (_v && !_v.done && (_r = _u.return)) yield _r.call(_u);
                }
                finally { if (e_8) throw e_8.error; }
            }
            console.log("Generated likes and shares for post");
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (generatedPosts_2_1 && !generatedPosts_2_1.done && (_p = generatedPosts_2.return)) yield _p.call(generatedPosts_2);
        }
        finally { if (e_6) throw e_6.error; }
    }
});
const generateLikesOnComments = () => __awaiter(void 0, void 0, void 0, function* () {
    var e_9, _w, e_10, _x, e_11, _y;
    try {
        for (var generatedPosts_3 = __asyncValues(generatedPosts), generatedPosts_3_1; generatedPosts_3_1 = yield generatedPosts_3.next(), !generatedPosts_3_1.done;) {
            const p = generatedPosts_3_1.value;
            const post = yield prisma_1.default.post.findFirst({
                where: { id: p.id },
                select: { comments: { select: { id: true } } },
            });
            if (post && post.comments)
                try {
                    for (var _z = (e_10 = void 0, __asyncValues(post.comments)), _0; _0 = yield _z.next(), !_0.done;) {
                        const cmt = _0.value;
                        const rand = Math.random();
                        const numLikes = Math.floor(rand * rand * generatedUsers.length);
                        const shuffledUsers = shuffle(generatedUsers);
                        try {
                            for (var _1 = (e_11 = void 0, __asyncValues(Array.from(Array(numLikes).keys()))), _2; _2 = yield _1.next(), !_2.done;) {
                                const i = _2.value;
                                yield prisma_1.default.commentLike.create({
                                    data: {
                                        commentId: cmt.id,
                                        userId: shuffledUsers[i].id,
                                    },
                                });
                            }
                        }
                        catch (e_11_1) { e_11 = { error: e_11_1 }; }
                        finally {
                            try {
                                if (_2 && !_2.done && (_y = _1.return)) yield _y.call(_1);
                            }
                            finally { if (e_11) throw e_11.error; }
                        }
                        console.log("Generated likes for comment");
                    }
                }
                catch (e_10_1) { e_10 = { error: e_10_1 }; }
                finally {
                    try {
                        if (_0 && !_0.done && (_x = _z.return)) yield _x.call(_z);
                    }
                    finally { if (e_10) throw e_10.error; }
                }
        }
    }
    catch (e_9_1) { e_9 = { error: e_9_1 }; }
    finally {
        try {
            if (generatedPosts_3_1 && !generatedPosts_3_1.done && (_w = generatedPosts_3.return)) yield _w.call(generatedPosts_3);
        }
        finally { if (e_9) throw e_9.error; }
    }
});
const generatePostImages = () => __awaiter(void 0, void 0, void 0, function* () {
    var e_12, _3;
    try {
        for (var generatedPosts_4 = __asyncValues(generatedPosts), generatedPosts_4_1; generatedPosts_4_1 = yield generatedPosts_4.next(), !generatedPosts_4_1.done;) {
            const post = generatedPosts_4_1.value;
            const imageRes = yield (0, axios_1.default)({
                url: "https://picsum.photos/1000/800",
                responseType: "arraybuffer",
            });
            const image = Buffer.from(imageRes.data, "binary");
            const scaled = (yield (0, imageProcessing_1.default)(image, { width: 1024, height: 768 }, true));
            const thumb = (yield (0, imageProcessing_1.default)(image, { width: 256, height: 256 }, true));
            yield new Promise((resolve, reject) => {
                s3.upload({
                    Bucket: "prisma-socialmedia",
                    Key: `thumb.${post.slug}.randomPost`,
                    Body: thumb,
                    ContentType: "image/jpeg",
                    ContentEncoding: "base64",
                }, (e, _) => {
                    if (e)
                        reject(e);
                    resolve();
                });
            });
            yield new Promise((resolve, reject) => {
                s3.upload({
                    Bucket: "prisma-socialmedia",
                    Key: `${post.slug}.randomPost`,
                    Body: scaled,
                    ContentType: "image/jpeg",
                    ContentEncoding: "base64",
                }, (e, _) => {
                    if (e)
                        reject(e);
                    resolve();
                });
            });
            const blur = (yield (0, imageProcessing_1.default)(image, {
                width: 14,
                height: 10,
            }));
            yield prisma_1.default.post.update({
                where: { id: post.id },
                data: {
                    imagePending: false,
                    imageKey: `${post.slug}.randomPost`,
                    blur,
                },
            });
            console.log("Added random image to post");
        }
    }
    catch (e_12_1) { e_12 = { error: e_12_1 }; }
    finally {
        try {
            if (generatedPosts_4_1 && !generatedPosts_4_1.done && (_3 = generatedPosts_4.return)) yield _3.call(generatedPosts_4);
        }
        finally { if (e_12) throw e_12.error; }
    }
});
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }
    return array;
}
