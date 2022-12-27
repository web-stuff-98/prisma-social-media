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
const Posts_dao_1 = __importDefault(require("../dao/Posts.dao"));
const getUserSocket_1 = __importDefault(require("../../utils/getUserSocket"));
const busboy_1 = __importDefault(require("busboy"));
class PostsController {
    static getPage(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield Posts_dao_1.default.getPage(Number(req.params.page), req.query, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                res.status(200).json(data);
            }
            catch (error) {
                res.status(500).json({ msg: "Internal error" });
            }
        });
    }
    static getDataForPosts(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield Posts_dao_1.default.getDataForPosts(req.body.shares, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                res.status(200).json(data);
            }
            catch (e) {
                res.status(500).json({ msg: "Internal error" });
            }
        });
    }
    static getPostById(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const post = yield Posts_dao_1.default.getPostById(req.params.id, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                if (post)
                    res.status(200).json(post);
                else
                    res.status(404).json({ msg: "Not found" });
            }
            catch (e) {
                res.status(500).json({ msg: "Internal error" });
            }
        });
    }
    static getPostBySlug(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const post = yield Posts_dao_1.default.getPostBySlug(req.params.slug, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                if (post)
                    res.status(200).json(post);
                else
                    res.status(404).json({ msg: "Not found" });
            }
            catch (e) {
                console.error(e);
                res.status(500).json({ msg: "Internal error" });
            }
        });
    }
    static deletePost(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Posts_dao_1.default.deletePostBySlug(req.params.slug, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                res.status(200).end();
            }
            catch (e) {
                res.status(400).json({ msg: `${e}` });
            }
        });
    }
    static createPost(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const post = yield Posts_dao_1.default.createPost(req.body.title, req.body.body, req.body.description, req.body.tags, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                res.status(201).json({ slug: post.slug }).end();
            }
            catch (e) {
                console.error(e);
                res.status(500).json({ message: "Internal Error" }).end();
            }
        });
    }
    static updatePost(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const post = yield Posts_dao_1.default.updatePost(req.body.title, req.body.body, req.body.description, req.body.tags, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id), req.params.slug);
                res.status(201).json(post).end();
            }
            catch (e) {
                console.error(e);
                res.status(500).json({ message: "Internal Error" }).end();
            }
        });
    }
    static addComment(req, res) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cmt = yield Posts_dao_1.default.addComment(req.body.message, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id), req.params.id, req.body.parentId, String((_b = req.user) === null || _b === void 0 ? void 0 : _b.name));
                return res.status(201).json(cmt).end();
            }
            catch (e) {
                console.error(e);
                return res.status(500).json({ msg: "Internal Error" });
            }
        });
    }
    static updateComment(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cmt = yield Posts_dao_1.default.updateComment(req.body.message, req.params.commentId, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                if (!cmt) {
                    return res.status(403).json({ msg: "Unauthorized" }).end();
                }
                return res.status(200).json(cmt).end();
            }
            catch (e) {
                return res.status(500).json({ msg: "Internal Error" });
            }
        });
    }
    static deleteComment(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cmt = yield Posts_dao_1.default.deleteComment(req.params.commentId, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                if (!cmt) {
                    return res.status(403).json({ msg: "Unauthorized" }).end();
                }
                return res.status(200).json(cmt).end();
            }
            catch (e) {
                console.error(e);
                return res.status(500).json({ msg: "Internal Error" });
            }
        });
    }
    static toggleCommentLike(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const like = yield Posts_dao_1.default.toggleCommentLike(req.params.commentId, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                return res.status(200).json(like).end();
            }
            catch (e) {
                console.error(e);
                return res.status(500).json({ msg: "Internal Error" });
            }
        });
    }
    static togglePostLike(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const like = yield Posts_dao_1.default.togglePostLike(req.params.id, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                return res.status(200).json(like).end();
            }
            catch (e) {
                console.error(e);
                return res.status(500).json({ msg: "Internal Error" });
            }
        });
    }
    static togglePostShare(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const share = yield Posts_dao_1.default.togglePostShare(req.params.id, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                return res.status(200).json(share).end();
            }
            catch (e) {
                console.error(e);
                return res.status(500).json({ msg: "Internal Error" });
            }
        });
    }
    // messy crap ahead
    static uploadCoverImage(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            /* This is messy and breaks the design pattern because busboy.on("file") wouldn't fire from
                inside the Chat DAO for some reason. I wrote the same code in my other project and it
                worked on the first try (webrtc-chat-js). I gave up after trying for 3 + 2 + 3 days and I don't care
                anymore because it doesn't make sense and I can't fix it */
            let post;
            let gotFile = false;
            try {
                post = yield Posts_dao_1.default.getPostBySlug(req.params.slug);
            }
            catch (e) {
                res
                    .status(400)
                    .json({ msg: "Could not find post to upload attachment for" });
            }
            if (post === null || post === void 0 ? void 0 : post.authorId) {
                if (post.authorId !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id))
                    throw new Error("Unauthorized");
            }
            const bb = (0, busboy_1.default)({
                headers: req.headers,
                limits: { files: 1, fields: 0, fileSize: 10000000 },
            });
            bb.on("file", (_, stream, info) => __awaiter(this, void 0, void 0, function* () {
                var _b;
                gotFile = true;
                const socket = yield (0, getUserSocket_1.default)((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
                const { key, blur } = yield Posts_dao_1.default.uploadCoverImage(stream, info, Number(req.params.bytes), req.params.slug, socket.id);
                yield Posts_dao_1.default.coverImageComplete(req.params.slug, blur, key);
                res.writeHead(201, { Connection: "close" });
                res.end();
            }));
            bb.on("finish", () => {
                if (!gotFile) {
                    req.unpipe(bb);
                    res.status(400).json({ msg: "No file!" });
                }
            });
            bb.on("error", (e) => __awaiter(this, void 0, void 0, function* () {
                yield Posts_dao_1.default.coverImageError(req.params.slug);
                req.unpipe(bb);
                res.status(400).json({ msg: `${e}` });
            }));
            req.pipe(bb);
        });
    }
}
exports.default = PostsController;
