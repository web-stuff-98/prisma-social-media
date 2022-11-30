"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const Yup = __importStar(require("yup"));
const createPostSchema = Yup.object().shape({
    title: Yup.string().required().max(100).required(),
    body: Yup.string().required().max(10000).required(),
});
const commentSchema = Yup.object()
    .shape({ message: Yup.string().required().max(300).required() })
    .strict();
class PostsController {
    static getPosts(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const posts = yield Posts_dao_1.default.getPosts((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                res.status(200).json(posts);
            }
            catch (e) {
                res.status(500).json({ msg: "Internal error" });
            }
        });
    }
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
    static getPopularPosts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const posts = yield Posts_dao_1.default.getPopularPosts();
                res.status(200).json(posts);
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
    static createPost(req, res) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield createPostSchema.strict().validate(req.body);
            }
            catch (e) {
                return res
                    .status(400)
                    .json({ msg: `${e}`.replace("ValidationError: ", "") })
                    .end();
            }
            try {
                const post = yield Posts_dao_1.default.createPost(req.body.title, req.body.body, req.body.description, req.body.tags, String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
                res.status(201).json(post).end();
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
                yield createPostSchema.strict().validate(req.body);
            }
            catch (e) {
                return res
                    .status(400)
                    .json({ msg: `${e}`.replace("ValidationError: ", "") })
                    .end();
            }
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
                yield commentSchema.validate(req.body);
            }
            catch (e) {
                console.error(e);
                return res
                    .status(400)
                    .json({ msg: `${e}`.replace("ValidationError: ", "") });
            }
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
                yield commentSchema.validate(req.body);
            }
            catch (e) {
                return res
                    .status(400)
                    .json({ msg: `${e}`.replace("ValidationError: ", "") });
            }
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
}
exports.default = PostsController;
