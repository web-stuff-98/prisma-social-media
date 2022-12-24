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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = __importStar(require("../utils/authMiddleware"));
const Posts_controller_1 = __importDefault(require("./controllers/Posts.controller"));
const limiters_1 = require("./limiter/limiters");
const express_slow_down_1 = __importDefault(require("express-slow-down"));
const validateBodyMiddleware_1 = __importDefault(require("../utils/validateBodyMiddleware"));
const Yup = __importStar(require("yup"));
const router = express_1.default.Router();
const postValidateSchema = {
    title: Yup.string().required().max(80).required(),
    body: Yup.string().required().max(10000).required(),
    description: Yup.string().max(160).required(),
    tags: Yup.string()
        .max(80, "Tags too long. Maximum 80 characters")
        .test("missingHashtag", "You need an # symbol for each tag.", (value) => Boolean(value && value.charAt(0) === "#"))
        .test("tooManyTags", "Maximum 8 tags.", (value) => Boolean(value && value.split("#").filter((t) => t.trim() !== "").length <= 8))
        .test("tagTooLong", "One of your tags is too long. Max 24 characters for each tag.", (value) => {
        if (!value)
            return true;
        const tags = value.split("#");
        for (const tag of tags) {
            if (tag.length > 24)
                return false;
        }
        return true;
    })
        .required(),
};
router.route("/").get((0, express_slow_down_1.default)({
    windowMs: 2000,
    delayAfter: 10,
    delayMs: 1000,
}), authMiddleware_1.withUser, Posts_controller_1.default.getPosts);
router.route("/page/:page").get((0, express_slow_down_1.default)({
    windowMs: 1000,
    delayAfter: 3,
    delayMs: 500,
}), (0, limiters_1.simpleRateLimit)({
    routeName: "getPage",
    maxReqs: 4,
    windowMs: 1000,
    blockDuration: 2000,
    msg: "Your request rate is surpassing the debouncer.",
}), authMiddleware_1.withUser, Posts_controller_1.default.getPage);
router.route("/").post(authMiddleware_1.default, (0, express_slow_down_1.default)({
    windowMs: 120000,
    delayAfter: 10,
    delayMs: 5000,
}), (0, validateBodyMiddleware_1.default)(postValidateSchema), Posts_controller_1.default.createPost);
router.route("/:slug").put(authMiddleware_1.default, (0, express_slow_down_1.default)({
    windowMs: 120000,
    delayAfter: 10,
    delayMs: 5000,
}), (0, validateBodyMiddleware_1.default)(postValidateSchema), Posts_controller_1.default.updatePost);
router.route("/:slug").delete((0, express_slow_down_1.default)({
    windowMs: 120000,
    delayAfter: 10,
    delayMs: 5000,
}), authMiddleware_1.default, Posts_controller_1.default.deletePost);
router.route("/:slug").get(authMiddleware_1.withUser, Posts_controller_1.default.getPostBySlug);
router.route("/:id/toggleLike").post((0, express_slow_down_1.default)({
    windowMs: 10000,
    delayAfter: 20,
    delayMs: 3000,
}), authMiddleware_1.default, Posts_controller_1.default.togglePostLike);
router.route("/:slug/image/:bytes").post((0, express_slow_down_1.default)({
    windowMs: 10000,
    delayAfter: 3,
    delayMs: 2000,
}), authMiddleware_1.default, Posts_controller_1.default.uploadCoverImage);
router.route("/:slug/image/:bytes").put((0, express_slow_down_1.default)({
    windowMs: 10000,
    delayAfter: 3,
    delayMs: 2000,
}), authMiddleware_1.default, Posts_controller_1.default.uploadCoverImage);
router.route("/:id/toggleShare").post((0, express_slow_down_1.default)({
    windowMs: 10000,
    delayAfter: 20,
    delayMs: 3000,
}), authMiddleware_1.default, Posts_controller_1.default.togglePostShare);
router.route("/:id/comments").post(authMiddleware_1.default, (0, limiters_1.simpleRateLimit)({
    routeName: "postComment",
    blockDuration: 300000,
    maxReqs: 30,
    windowMs: 300000,
    msg: "Max 30 comments every 5 minutes. You must wait BLOCKDURATION to comment again.",
}), (0, validateBodyMiddleware_1.default)({
    message: Yup.string().required().max(300),
    parentId: Yup.string().nullable().notRequired(),
}), Posts_controller_1.default.addComment);
router.route("/:id/comments/:commentId").put(authMiddleware_1.default, (0, limiters_1.simpleRateLimit)({
    routeName: "editPostComment",
    blockDuration: 300000,
    maxReqs: 30,
    windowMs: 300000,
    msg: "You have edited comments too many times. Wait BLOCKDURATION.",
}), (0, validateBodyMiddleware_1.default)({
    message: Yup.string().required().max(300),
}), Posts_controller_1.default.updateComment);
router
    .route("/:id/comments/:commentId")
    .delete(authMiddleware_1.default, Posts_controller_1.default.deleteComment);
router
    .route("/:id/comments/:commentId/toggleLike")
    .post(authMiddleware_1.default, Posts_controller_1.default.toggleCommentLike);
exports.default = router;
