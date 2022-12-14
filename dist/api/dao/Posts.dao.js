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
const crypto_1 = __importDefault(require("crypto"));
const __1 = require("../..");
const aws_1 = __importDefault(require("../../utils/aws"));
const parsePost_1 = __importDefault(require("../../utils/parsePost"));
const getPageData_1 = __importDefault(require("../../utils/getPageData"));
const imageProcessing_1 = __importDefault(require("../../utils/imageProcessing"));
const readableStreamToBlob_1 = __importDefault(require("../../utils/readableStreamToBlob"));
const getUserSocket_1 = __importDefault(require("../../utils/getUserSocket"));
const parsePosts_1 = __importDefault(require("../../utils/parsePosts"));
const S3 = new aws_1.default.S3();
class PostsDAO {
    static getPage(page, query, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield (0, getPageData_1.default)({
                tags: query.tags || "",
                term: query.term || "",
                mode: query.mode || "",
                order: query.order || "",
            }, { page }, uid);
            return data;
        });
    }
    static getDataForPosts(slugs, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield prisma_1.default.post.findMany({
                where: { slug: { in: slugs } },
                select: {
                    id: true,
                    slug: true,
                    title: true,
                    createdAt: true,
                    description: true,
                    author: {
                        select: {
                            id: true,
                        },
                    },
                    likes: true,
                    shares: true,
                    tags: true,
                    imageKey: true,
                    blur: true,
                    _count: { select: { comments: true } },
                },
            });
            return (0, parsePosts_1.default)(data, uid);
        });
    }
    static deletePostBySlug(slug, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            let post;
            try {
                post = yield prisma_1.default.post.findUniqueOrThrow({ where: { slug } });
            }
            catch (error) {
                throw new Error("Could not find post");
            }
            if (post.authorId !== uid)
                throw new Error("Unauthorized");
            yield prisma_1.default.post.delete({
                where: { slug },
            });
            if (!post.imagePending)
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
            __1.io.to(`post_card=${slug}`).emit("post_visible_deleted", slug);
        });
    }
    static getPostById(id, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield prisma_1.default.post
                .findUnique({
                where: { id },
                include: {
                    _count: { select: { comments: true, likes: true, shares: true } },
                    comments: {
                        orderBy: {
                            createdAt: "desc",
                        },
                        select: {
                            id: true,
                            message: true,
                            parentId: true,
                            createdAt: true,
                            updatedAt: true,
                            user: {
                                select: {
                                    id: true,
                                },
                            },
                            likes: true,
                            _count: {
                                select: { likes: true },
                            },
                        },
                    },
                    author: {
                        select: {
                            id: true,
                        },
                    },
                    tags: true,
                    likes: true,
                    shares: true,
                },
            })
                .then((post) => __awaiter(this, void 0, void 0, function* () { return (0, parsePost_1.default)(post, uid); }));
            return post;
        });
    }
    static getPostBySlug(slug, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield prisma_1.default.post
                .findUnique({
                where: { slug },
                include: {
                    _count: { select: { comments: true, likes: true, shares: true } },
                    comments: {
                        orderBy: {
                            createdAt: "desc",
                        },
                        select: {
                            id: true,
                            message: true,
                            parentId: true,
                            createdAt: true,
                            updatedAt: true,
                            user: {
                                select: {
                                    id: true,
                                },
                            },
                            _count: {
                                select: { likes: true },
                            },
                        },
                    },
                    author: {
                        select: {
                            id: true,
                        },
                    },
                    tags: true,
                    likes: true,
                    shares: true,
                },
            })
                .then((post) => __awaiter(this, void 0, void 0, function* () { return (0, parsePost_1.default)(post, uid); }));
            return post;
        });
    }
    static createPost(title, body, description, tags, authorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const slug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "") +
                crypto_1.default.randomBytes(64).toString("hex").slice(0, 6);
            const post = yield prisma_1.default.post.create({
                data: {
                    title,
                    body,
                    authorId,
                    description,
                    slug,
                    tags: {
                        connectOrCreate: tags
                            .split("#")
                            .filter((tag) => tag !== "")
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
            return post;
        });
    }
    static updatePost(title, body, description, tags, authorId, slug) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield prisma_1.default.post.update({
                where: {
                    slug,
                },
                data: {
                    title,
                    body,
                    authorId,
                    description,
                    tags: {
                        connectOrCreate: tags
                            .split("#")
                            .filter((tag) => tag !== "")
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
            __1.io.to(`post_card=${slug}`).emit("post_visible_update", post);
            return post;
        });
    }
    static addComment(message, uid, postId, parentId = undefined, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const comment = yield prisma_1.default.comment
                .create({
                data: {
                    message,
                    userId: uid,
                    postId,
                    parentId,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                        },
                    },
                    post: {
                        select: {
                            slug: true,
                        },
                    },
                },
            })
                .then((comment) => (Object.assign(Object.assign({}, comment), { likeCount: 0, likedByMe: false })));
            __1.io.to(comment.post.slug).emit("comment_added", message, comment.id, parentId, uid, name, comment.post.slug);
            __1.io.to(`post_card=${comment.post.slug}`).emit("post_visible_comment_update", true, comment.post.slug);
            return comment;
        });
    }
    static updateComment(message, commentId, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId, post: { slug }, } = yield prisma_1.default.comment.findUniqueOrThrow({
                where: { id: commentId },
                select: { userId: true, post: { select: { slug: true } } },
            });
            if (!userId || userId !== uid)
                return false;
            __1.io.to(slug).emit("comment_updated", message, commentId, uid, slug);
            return yield prisma_1.default.comment.update({
                where: { id: commentId },
                data: { message },
                select: { message: true },
            });
        });
    }
    static deleteComment(commentId, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId, post: { slug }, } = yield prisma_1.default.comment.findUniqueOrThrow({
                where: { id: commentId },
                select: { userId: true, post: { select: { slug: true } } },
            });
            if (!userId || userId !== uid)
                return false;
            __1.io.to(slug).emit("comment_deleted", commentId, uid, slug);
            __1.io.to(`post_card=${slug}`).emit("post_visible_comment_update", false, slug);
            return yield prisma_1.default.comment.delete({
                where: { id: commentId },
                select: { id: true },
            });
        });
    }
    static toggleCommentLike(commentId, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = { userId: uid, commentId };
            const like = yield prisma_1.default.commentLike.findUnique({
                where: { userId_commentId: data },
                include: {
                    comment: {
                        select: { post: { select: { slug: true } } },
                    },
                },
            });
            if (like == null) {
                const newLike = yield prisma_1.default.commentLike.create({
                    data,
                    include: { comment: { select: { post: { select: { slug: true } } } } },
                });
                __1.io.to(newLike.comment.post.slug).emit("comment_liked", true, uid, newLike.comment.post.slug);
                return { addLike: true };
            }
            else {
                yield prisma_1.default.commentLike.delete({
                    where: {
                        userId_commentId: data,
                    },
                });
                __1.io.to(like.comment.post.slug).emit("comment_liked", false, uid, like.comment.post.slug);
                return { addLike: false };
            }
        });
    }
    static togglePostLike(postId, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = { userId: uid, postId };
            const like = yield prisma_1.default.postLike.findUnique({
                where: { userId_postId: data },
            });
            let addLike = false;
            if (like == null) {
                yield prisma_1.default.postLike.create({ data });
                addLike = true;
            }
            else {
                yield prisma_1.default.postLike.delete({
                    where: {
                        userId_postId: data,
                    },
                });
                addLike = false;
            }
            const post = yield prisma_1.default.post.findFirst({
                where: { id: postId },
                select: { slug: true },
            });
            const socket = yield (0, getUserSocket_1.default)(uid);
            __1.io.to(`post_card=${post === null || post === void 0 ? void 0 : post.slug}`).emit("post_visible_like_update", addLike, socket === null || socket === void 0 ? void 0 : socket.id, postId);
            return { addLike };
        });
    }
    static togglePostShare(postId, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = { userId: uid, postId };
            const share = yield prisma_1.default.postShare.findUnique({
                where: { userId_postId: data },
            });
            let addShare = false;
            if (share == null) {
                yield prisma_1.default.postShare.create({ data });
                addShare = true;
            }
            else {
                yield prisma_1.default.postShare.delete({
                    where: {
                        userId_postId: data,
                    },
                });
                addShare = false;
            }
            const post = yield prisma_1.default.post.findFirst({
                where: { id: postId },
                select: { slug: true },
            });
            const socket = yield (0, getUserSocket_1.default)(uid);
            __1.io.to(`post_card=${post === null || post === void 0 ? void 0 : post.slug}`).emit("post_visible_share_update", addShare, socket === null || socket === void 0 ? void 0 : socket.id, postId);
            return { addShare };
        });
    }
    static uploadCoverImage(stream, info, bytes, slug, socketId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!info.mimeType.startsWith("image/jpeg") &&
                !info.mimeType.startsWith("image/jpg") &&
                !info.mimeType.startsWith("image/png") &&
                !info.mimeType.startsWith("image/avif") &&
                !info.mimeType.startsWith("image/heic")) {
                throw new Error("Input is not an image, or is of an unsupported format.");
            }
            const post = yield prisma_1.default.post.findUnique({
                where: { slug },
                select: { imageKey: true },
            });
            if (post) {
                if (post.imageKey) {
                    yield new Promise((resolve, reject) => {
                        S3.deleteObject({
                            Bucket: "prisma-socialmedia",
                            Key: `${(process.env.NODE_ENV !== "production" ? "dev." : "") +
                                post.imageKey}`,
                        }, (e, _) => {
                            if (e)
                                reject(e);
                            resolve();
                        });
                    });
                    yield prisma_1.default.post.update({
                        where: { slug },
                        data: { imagePending: true },
                    });
                }
            }
            const blob = yield (0, readableStreamToBlob_1.default)(stream, info.mimeType, {
                onProgress: (progress) => {
                    if (socketId)
                        __1.io.to(socketId).emit("post_cover_image_progress", progress * 0.5, slug);
                },
                totalBytes: bytes,
            });
            const scaled = yield (0, imageProcessing_1.default)(blob, { width: 768, height: 500 }, true);
            const thumb = yield (0, imageProcessing_1.default)(blob, { width: 300, height: 300 }, true);
            const blur = (yield (0, imageProcessing_1.default)(blob, {
                width: 14,
                height: 10,
            }));
            const hasExtension = info.filename.includes(".");
            let p = 0;
            //upload the thumb first
            yield new Promise((resolve, reject) => {
                const key = `thumb.${slug}.${hasExtension ? info.filename.split(".")[0] : info.filename}.jpg`;
                S3.upload({
                    Bucket: "prisma-socialmedia",
                    Key: `${(process.env.NODE_ENV !== "production" ? "dev." : "") + key}`,
                    Body: thumb,
                    ContentType: "image/jpeg",
                    ContentEncoding: "base64",
                }, (e, _) => {
                    if (e)
                        reject(e);
                    resolve();
                }).on("httpUploadProgress", (e) => {
                    if (!socketId)
                        return;
                    p++;
                    //only send progress updates every 2nd event, otherwise it's probably too many emits
                    if (p === 2) {
                        p = 0;
                        __1.io.to(socketId).emit("post_cover_image_progress", 0.25 * (e.loaded / Buffer.byteLength(thumb)) + 0.5, slug);
                    }
                });
            });
            return new Promise((resolve, reject) => {
                p = 0;
                const key = `${slug}.${hasExtension ? info.filename.split(".")[0] : info.filename}.jpg`;
                S3.upload({
                    Bucket: "prisma-socialmedia",
                    Key: `${(process.env.NODE_ENV !== "production" ? "dev." : "") + key}`,
                    Body: scaled,
                    ContentType: "image/jpeg",
                    ContentEncoding: "base64",
                }, (e, _) => {
                    if (e)
                        reject(e);
                    resolve({ key, blur });
                }).on("httpUploadProgress", (e) => {
                    if (!socketId)
                        return;
                    p++;
                    //only send progress updates every 2nd event, otherwise it's probably too many emits
                    if (p === 2) {
                        p = 0;
                        __1.io.to(socketId).emit("post_cover_image_progress", 0.25 * (e.loaded / Buffer.byteLength(scaled)) + 0.75, slug);
                    }
                });
            });
        });
    }
    static coverImageComplete(slug, blur, key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield prisma_1.default.post.update({
                    where: { slug },
                    data: {
                        imageKey: key,
                        imagePending: false,
                        blur,
                    },
                });
            }
            catch (e) {
                console.warn(e);
                throw new Error("Internal error handling error :-(");
            }
        });
    }
    static coverImageError(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield prisma_1.default.post.delete({ where: { slug } });
            }
            catch (e) {
                console.warn(e);
                throw new Error("Internal error handling error :-(");
            }
        });
    }
}
exports.default = PostsDAO;
