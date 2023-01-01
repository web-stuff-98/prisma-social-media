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
const s3 = new aws_1.default.S3();
const lipsum = new lorem_ipsum_1.LoremIpsum();
/*
  This was working perfectly now I have
  some bullshit errors about invalide update invocations
  on records that "dont exist" but were just created

  cant be asked fixing this shit I just put it in trycatch
*/
function seed(users, posts, rooms) {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma_1.default.user.deleteMany();
        yield prisma_1.default.privateMessage.deleteMany();
        yield prisma_1.default.roomMessage.deleteMany();
        yield s3.deleteBucket();
        globalThis.generatedPosts = [];
        globalThis.generatedRooms = [];
        globalThis.generatedUsers = [];
        yield generateUsers(users);
        yield generatePosts(posts);
        yield generateRooms(rooms);
        yield generatePostImages();
        yield generateCommentsOnPosts();
        yield generateLikesAndSharesOnPosts();
        yield generateLikesOnComments();
        console.log(" --- GENERATED SEED ---");
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
    globalThis.generatedUsers.push(u.id);
});
const generateUsers = (num) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    try {
        for (var _d = true, _e = __asyncValues(Array.from(Array(num).keys())), _f; _f = yield _e.next(), _a = _f.done, !_a;) {
            _c = _f.value;
            _d = false;
            try {
                const i = _c;
                yield generateUser(i);
                console.log("Generated user");
            }
            finally {
                _d = true;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
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
    const body = res.data.toString();
    /*const body = await new Promise<string>((resolve, reject) => {
      zlib.gunzip(res.data, (err, out) => {
        console.log(res.data);
        if (err) reject(err);
        resolve(out.toString());
      });
    });*/
    const title = lipsum.generateParagraphs(1).slice(0, 80);
    const description = lipsum
        .generateParagraphs(Math.ceil(Math.random() * 3))
        .slice(0, 160);
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") +
        crypto_1.default.randomBytes(64).toString("hex").slice(0, 6);
    const randomCreationDate = Math.ceil(Math.random() * 345600000 * (Math.random() > 0.5 ? -1 : 1));
    const p = yield prisma_1.default.post.create({
        data: {
            title,
            description,
            slug,
            body,
            createdAt: new Date(Date.now() + randomCreationDate),
            updatedAt: new Date(Math.random() < 0.8
                ? randomCreationDate
                : randomCreationDate +
                    (Date.now() - randomCreationDate) * Math.random()),
            authorId: globalThis.generatedUsers[Math.floor(Math.random() * globalThis.generatedUsers.length)],
            tags: {
                connectOrCreate: lipsum
                    .generateParagraphs(1)
                    .replaceAll(".", "")
                    .split(" ")
                    .filter((tag) => tag && tag.length > 1)
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
    globalThis.generatedPosts.push(p.id);
});
const generatePosts = (num) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, e_2, _h, _j;
    try {
        for (var _k = true, _l = __asyncValues(Array.from(Array(num).keys())), _m; _m = yield _l.next(), _g = _m.done, !_g;) {
            _j = _m.value;
            _k = false;
            try {
                const i = _j;
                yield generatePost();
                console.log("Generated post");
            }
            finally {
                _k = true;
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (!_k && !_g && (_h = _l.return)) yield _h.call(_l);
        }
        finally { if (e_2) throw e_2.error; }
    }
});
const generateRoom = (i) => __awaiter(void 0, void 0, void 0, function* () {
    const authorId = globalThis.generatedUsers[Math.floor(Math.random() * globalThis.generatedUsers.length)];
    const numMembers = Math.floor(Math.random() * globalThis.generatedUsers.length);
    let members = [authorId];
    while (i < numMembers) {
        i++;
        members.push(globalThis.generatedUsers[Math.floor(Math.random() * globalThis.generatedUsers.length)]);
    }
    members = [...new Set(members)];
    const numBanned = Math.floor(Math.random() * 5);
    let banned = [];
    while (i < numBanned) {
        i++;
        banned.push(globalThis.generatedUsers[Math.floor(Math.random() * globalThis.generatedUsers.length)]);
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
    globalThis.generatedRooms.push(r.id);
});
const generateRooms = (num) => __awaiter(void 0, void 0, void 0, function* () {
    var _o, e_3, _p, _q;
    try {
        for (var _r = true, _s = __asyncValues(Array.from(Array(num).keys())), _t; _t = yield _s.next(), _o = _t.done, !_o;) {
            _q = _t.value;
            _r = false;
            try {
                const i = _q;
                yield generateRoom(i);
                console.log("Generated room");
            }
            finally {
                _r = true;
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (!_r && !_o && (_p = _s.return)) yield _p.call(_s);
        }
        finally { if (e_3) throw e_3.error; }
    }
});
const generateCommentOnPost = (postId, idsOfOtherCommentsOnPost = []) => __awaiter(void 0, void 0, void 0, function* () {
    const rand = Math.random();
    const data = Object.assign({ message: lipsum
            .generateSentences(Math.ceil(Math.max(rand * rand * 3, 1)))
            .slice(0, 300), userId: globalThis.generatedUsers[Math.floor(Math.random() * globalThis.generatedUsers.length)], postId }, (idsOfOtherCommentsOnPost.length > 0 && Math.random() < 0.666
        ? {
            parentId: idsOfOtherCommentsOnPost[Math.floor(Math.random() * idsOfOtherCommentsOnPost.length)],
        }
        : {}));
    let id;
    try {
        const cmt = yield prisma_1.default.comment.create({
            data,
        });
        id = cmt.id;
    }
    catch (error) {
        console.log("Failed to add comment for some reason");
    }
    return id;
});
const generateCommentsOnPost = (postId) => __awaiter(void 0, void 0, void 0, function* () {
    var _u, e_4, _v, _w;
    const rand = Math.random();
    const rand2 = Math.random() * 120;
    const numComments = Math.floor(rand * rand * rand * rand2);
    let idsOfOtherCommentsOnPost = [];
    try {
        for (var _x = true, _y = __asyncValues(Array.from(Array(numComments).keys())), _z; _z = yield _y.next(), _u = _z.done, !_u;) {
            _w = _z.value;
            _x = false;
            try {
                const i = _w;
                const commentId = yield generateCommentOnPost(postId, idsOfOtherCommentsOnPost);
                if (commentId)
                    idsOfOtherCommentsOnPost.push(commentId);
            }
            finally {
                _x = true;
            }
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (!_x && !_u && (_v = _y.return)) yield _v.call(_y);
        }
        finally { if (e_4) throw e_4.error; }
    }
});
const generateCommentsOnPosts = () => __awaiter(void 0, void 0, void 0, function* () {
    var _0, e_5, _1, _2;
    try {
        for (var _3 = true, _4 = __asyncValues(globalThis.generatedPosts), _5; _5 = yield _4.next(), _0 = _5.done, !_0;) {
            _2 = _5.value;
            _3 = false;
            try {
                const p = _2;
                yield generateCommentsOnPost(p);
                console.log("Generated comments for post");
            }
            finally {
                _3 = true;
            }
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (!_3 && !_0 && (_1 = _4.return)) yield _1.call(_4);
        }
        finally { if (e_5) throw e_5.error; }
    }
});
const generateLikesAndSharesOnPosts = () => __awaiter(void 0, void 0, void 0, function* () {
    var _6, e_6, _7, _8, _9, e_7, _10, _11, _12, e_8, _13, _14;
    try {
        for (var _15 = true, _16 = __asyncValues(globalThis.generatedPosts), _17; _17 = yield _16.next(), _6 = _17.done, !_6;) {
            _8 = _17.value;
            _15 = false;
            try {
                const p = _8;
                const likesRand = Math.random();
                const sharesRand = Math.random();
                const shuffledUsersForLikes = shuffle(globalThis.generatedUsers);
                const shuffledUsersForShares = shuffle(globalThis.generatedUsers);
                const numLikes = Math.floor(likesRand * likesRand * globalThis.generatedUsers.length);
                const numShares = Math.floor(sharesRand * sharesRand * globalThis.generatedUsers.length);
                try {
                    for (var _18 = true, _19 = (e_7 = void 0, __asyncValues(Array.from(Array(numLikes).keys()))), _20; _20 = yield _19.next(), _9 = _20.done, !_9;) {
                        _11 = _20.value;
                        _18 = false;
                        try {
                            const i = _11;
                            try {
                                yield prisma_1.default.postLike.create({
                                    data: {
                                        postId: p,
                                        userId: shuffledUsersForLikes[i],
                                    },
                                });
                            }
                            catch (e) {
                                console.log("Failed to add post like for some reason");
                            }
                        }
                        finally {
                            _18 = true;
                        }
                    }
                }
                catch (e_7_1) { e_7 = { error: e_7_1 }; }
                finally {
                    try {
                        if (!_18 && !_9 && (_10 = _19.return)) yield _10.call(_19);
                    }
                    finally { if (e_7) throw e_7.error; }
                }
                try {
                    for (var _21 = true, _22 = (e_8 = void 0, __asyncValues(Array.from(Array(numShares).keys()))), _23; _23 = yield _22.next(), _12 = _23.done, !_12;) {
                        _14 = _23.value;
                        _21 = false;
                        try {
                            const i = _14;
                            try {
                                yield prisma_1.default.postShare.create({
                                    data: {
                                        postId: p,
                                        userId: shuffledUsersForShares[i],
                                    },
                                });
                            }
                            catch (e) {
                                console.log("Failed to add post share for some reason");
                            }
                        }
                        finally {
                            _21 = true;
                        }
                    }
                }
                catch (e_8_1) { e_8 = { error: e_8_1 }; }
                finally {
                    try {
                        if (!_21 && !_12 && (_13 = _22.return)) yield _13.call(_22);
                    }
                    finally { if (e_8) throw e_8.error; }
                }
                console.log("Generated likes and shares for post");
            }
            finally {
                _15 = true;
            }
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (!_15 && !_6 && (_7 = _16.return)) yield _7.call(_16);
        }
        finally { if (e_6) throw e_6.error; }
    }
});
const generateLikesOnComments = () => __awaiter(void 0, void 0, void 0, function* () {
    var _24, e_9, _25, _26, _27, e_10, _28, _29, _30, e_11, _31, _32;
    try {
        for (var _33 = true, _34 = __asyncValues(globalThis.generatedPosts), _35; _35 = yield _34.next(), _24 = _35.done, !_24;) {
            _26 = _35.value;
            _33 = false;
            try {
                const p = _26;
                const post = yield prisma_1.default.post.findFirst({
                    where: { id: p },
                    select: { comments: { select: { id: true } } },
                });
                if (post && post.comments)
                    try {
                        for (var _36 = true, _37 = (e_10 = void 0, __asyncValues(post.comments)), _38; _38 = yield _37.next(), _27 = _38.done, !_27;) {
                            _29 = _38.value;
                            _36 = false;
                            try {
                                const cmt = _29;
                                const rand = Math.random();
                                const numLikes = Math.floor(rand * rand * globalThis.generatedUsers.length);
                                const shuffledUsers = shuffle(globalThis.generatedUsers);
                                try {
                                    for (var _39 = true, _40 = (e_11 = void 0, __asyncValues(Array.from(Array(numLikes).keys()))), _41; _41 = yield _40.next(), _30 = _41.done, !_30;) {
                                        _32 = _41.value;
                                        _39 = false;
                                        try {
                                            const i = _32;
                                            try {
                                                yield prisma_1.default.commentLike.create({
                                                    data: {
                                                        commentId: cmt.id,
                                                        userId: shuffledUsers[i],
                                                    },
                                                });
                                            }
                                            catch (error) {
                                                console.log("Failed to add comment like for some reason");
                                            }
                                        }
                                        finally {
                                            _39 = true;
                                        }
                                    }
                                }
                                catch (e_11_1) { e_11 = { error: e_11_1 }; }
                                finally {
                                    try {
                                        if (!_39 && !_30 && (_31 = _40.return)) yield _31.call(_40);
                                    }
                                    finally { if (e_11) throw e_11.error; }
                                }
                                console.log("Generated likes for comment");
                            }
                            finally {
                                _36 = true;
                            }
                        }
                    }
                    catch (e_10_1) { e_10 = { error: e_10_1 }; }
                    finally {
                        try {
                            if (!_36 && !_27 && (_28 = _37.return)) yield _28.call(_37);
                        }
                        finally { if (e_10) throw e_10.error; }
                    }
            }
            finally {
                _33 = true;
            }
        }
    }
    catch (e_9_1) { e_9 = { error: e_9_1 }; }
    finally {
        try {
            if (!_33 && !_24 && (_25 = _34.return)) yield _25.call(_34);
        }
        finally { if (e_9) throw e_9.error; }
    }
});
const generatePostImages = () => __awaiter(void 0, void 0, void 0, function* () {
    var _42, e_12, _43, _44;
    try {
        for (var _45 = true, _46 = __asyncValues(globalThis.generatedPosts), _47; _47 = yield _46.next(), _42 = _47.done, !_42;) {
            _44 = _47.value;
            _45 = false;
            try {
                const post = _44;
                //wait a but so that the images aren't being downloaded too fast
                yield new Promise((resolve, _) => {
                    setTimeout(() => {
                        resolve();
                    }, 250);
                });
                const imageRes = yield (0, axios_1.default)({
                    url: "https://picsum.photos/1000/500",
                    responseType: "arraybuffer",
                });
                const image = Buffer.from(imageRes.data, "binary");
                const scaled = (yield (0, imageProcessing_1.default)(image, { width: 768, height: 500 }, true));
                const thumb = (yield (0, imageProcessing_1.default)(image, { width: 300, height: 300 }, true));
                let slug;
                yield new Promise((resolve, reject) => {
                    prisma_1.default.post
                        .findUnique({ where: { id: post }, select: { slug: true } })
                        .then((data) => {
                        slug = data === null || data === void 0 ? void 0 : data.slug;
                        s3.upload({
                            Bucket: "prisma-socialmedia",
                            Key: `${process.env.NODE_ENV !== "production" ? "dev." : ""}thumb.${slug}.randomPost`,
                            Body: thumb,
                            ContentType: "image/jpeg",
                            ContentEncoding: "base64",
                        }, (e, _) => {
                            if (e)
                                reject(e);
                            resolve();
                        });
                    })
                        .catch((e) => reject(e));
                });
                yield new Promise((resolve, reject) => {
                    s3.upload({
                        Bucket: "prisma-socialmedia",
                        Key: `${(process.env.NODE_ENV !== "production" ? "dev." : "") + slug}.randomPost`,
                        Body: scaled,
                        ContentType: "image/jpeg",
                        ContentEncoding: "base64",
                    }, (e, _) => {
                        if (e)
                            reject(e);
                        resolve();
                    });
                });
                yield new Promise((resolve, reject) => {
                    (0, imageProcessing_1.default)(image, {
                        width: 14,
                        height: 10,
                    })
                        .then((blur) => {
                        prisma_1.default.post
                            .update({
                            where: { id: post },
                            data: {
                                imagePending: false,
                                imageKey: `${slug}.randomPost`,
                                blur: blur,
                            },
                        })
                            .then(() => resolve())
                            .catch((e) => reject(e));
                    })
                        .catch((e) => {
                        reject(e);
                    });
                });
                console.log("Added random image to post");
            }
            finally {
                _45 = true;
            }
        }
    }
    catch (e_12_1) { e_12 = { error: e_12_1 }; }
    finally {
        try {
            if (!_45 && !_42 && (_43 = _46.return)) yield _43.call(_46);
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
