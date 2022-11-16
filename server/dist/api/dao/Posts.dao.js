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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../utils/prisma"));
const crypto_1 = __importDefault(require("crypto"));
const __1 = require("../..");
const parsePost = (post, uid) => __awaiter(void 0, void 0, void 0, function* () {
    const usersCommentLikes = yield prisma_1.default.commentLike.findMany({
        where: {
            userId: uid,
            commentId: { in: post.comments.map((cmt) => cmt.id) },
        },
    });
    return Object.assign(Object.assign({}, post), { tags: post.tags.map((tag) => tag.name), likedByMe: post.likes.find((like) => like.userId === uid)
            ? true
            : false, sharedByMe: post.shares.find((share) => share.userId === uid)
            ? true
            : false, comments: post.comments.map((cmt) => {
            const { _count } = cmt, commentFields = __rest(cmt, ["_count"]);
            return Object.assign(Object.assign({}, commentFields), { likedByMe: usersCommentLikes.length > 0
                    ? usersCommentLikes.find((like) => like.commentId === cmt.id)
                    : undefined, likeCount: _count.likes });
        }) });
});
class PostsDAO {
    static getPosts(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const posts = yield prisma_1.default.post.findMany({
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
                },
            });
            return posts.map((post) => {
                let likedByMe = false;
                let sharedByMe = false;
                likedByMe = post.likes.find((like) => like.userId === uid) ? true : false;
                sharedByMe = post.shares.find((share) => share.userId === uid)
                    ? true
                    : false;
                return Object.assign(Object.assign({}, post), { likes: post.likes.length, shares: post.shares.length, tags: post.tags.map((tag) => tag.name), likedByMe,
                    sharedByMe });
            });
        });
    }
    static getPostById(id, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield prisma_1.default.post
                .findUnique({
                where: { id },
                include: {
                    comments: {
                        orderBy: {
                            createdAt: "desc",
                        },
                        select: {
                            id: true,
                            message: true,
                            parentId: true,
                            createdAt: true,
                            user: {
                                select: {
                                    id: true,
                                },
                            },
                            _count: { select: { likes: true } },
                        },
                    },
                    author: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    tags: true,
                    likes: true,
                    shares: true,
                },
            })
                .then((post) => __awaiter(this, void 0, void 0, function* () { return parsePost(post, uid); }));
            return post;
        });
    }
    static getPostBySlug(slug, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield prisma_1.default.post
                .findUnique({
                where: { slug },
                include: {
                    comments: {
                        orderBy: {
                            createdAt: "desc",
                        },
                        select: {
                            id: true,
                            message: true,
                            parentId: true,
                            createdAt: true,
                            user: {
                                select: {
                                    id: true,
                                },
                            },
                            _count: { select: { likes: true } },
                        },
                    },
                    author: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    tags: true,
                    likes: true,
                    shares: true,
                },
            })
                .then((post) => __awaiter(this, void 0, void 0, function* () { return parsePost(post, uid); }));
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
            __1.io.to(comment.post.slug).emit("comment_added", message, comment.id, parentId, uid, name);
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
            __1.io.to(slug).emit("comment_updated", message, commentId, uid);
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
            __1.io.to(slug).emit("comment_deleted", commentId, uid);
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
                __1.io.to(newLike.comment.post.slug).emit("comment_liked", true, uid);
                return { addLike: true };
            }
            else {
                yield prisma_1.default.commentLike.delete({
                    where: {
                        userId_commentId: data,
                    },
                });
                __1.io.to(like.comment.post.slug).emit("comment_liked", false, uid);
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
            if (like == null) {
                yield prisma_1.default.postLike.create({ data });
                return { addLike: true };
            }
            else {
                yield prisma_1.default.postLike.delete({
                    where: {
                        userId_postId: data,
                    },
                });
                return { addLike: false };
            }
        });
    }
    static togglePostShare(postId, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = { userId: uid, postId };
            const share = yield prisma_1.default.postShare.findUnique({
                where: { userId_postId: data },
            });
            if (share == null) {
                yield prisma_1.default.postShare.create({ data });
                return { addShare: true };
            }
            else {
                yield prisma_1.default.postShare.delete({
                    where: {
                        userId_postId: data,
                    },
                });
                return { addShare: false };
            }
        });
    }
}
exports.default = PostsDAO;
