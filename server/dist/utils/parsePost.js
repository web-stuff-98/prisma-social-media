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
const prisma_1 = __importDefault(require("./prisma"));
exports.default = (post, uid) => __awaiter(void 0, void 0, void 0, function* () {
    const usersCommentLikes = yield prisma_1.default.commentLike.findMany({
        where: {
            userId: uid,
            commentId: { in: post.comments.map((cmt) => cmt.id) },
        },
    });
    return Object.assign(Object.assign({}, post), { tags: post.tags.map((tag) => tag.name), likedByMe: post.likes.find((like) => like.userId === uid)
            ? true
            : false, likes: post.likes.length, sharedByMe: post.shares.find((share) => share.userId === uid)
            ? true
            : false, shares: post.shares.length, comments: post.comments
            ? post.comments.map((cmt) => {
                const { _count } = cmt, commentFields = __rest(cmt, ["_count"]);
                return Object.assign(Object.assign({}, commentFields), { likedByMe: usersCommentLikes.length > 0
                        ? usersCommentLikes.find((like) => like.commentId === cmt.id)
                        : undefined, likeCount: _count.likes });
            })
            : [] });
});
