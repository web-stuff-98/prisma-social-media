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
const router = express_1.default.Router();
router.route("/").get((0, express_slow_down_1.default)({
    windowMs: 2000,
    delayAfter: 10,
    delayMs: 1000,
}), authMiddleware_1.withUser, Posts_controller_1.default.getPosts);
router.route("/popular").get((0, express_slow_down_1.default)({
    windowMs: 2000,
    delayAfter: 10,
    delayMs: 1000,
}), authMiddleware_1.withUser, Posts_controller_1.default.getPopularPosts);
router.route("/page/:page").get((0, express_slow_down_1.default)({
    windowMs: 2000,
    delayAfter: 10,
    delayMs: 1000,
}), authMiddleware_1.withUser, Posts_controller_1.default.getPage);
router.route("/").post((0, express_slow_down_1.default)({
    windowMs: 120000,
    delayAfter: 10,
    delayMs: 5000,
}), authMiddleware_1.default, Posts_controller_1.default.createPost);
router.route("/:slug").put((0, express_slow_down_1.default)({
    windowMs: 120000,
    delayAfter: 10,
    delayMs: 5000,
}), authMiddleware_1.default, Posts_controller_1.default.updatePost);
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
router
    .route("/:slug/image/:bytes")
    .post((0, express_slow_down_1.default)({
    windowMs: 10000,
    delayAfter: 3,
    delayMs: 2000,
}), authMiddleware_1.default, Posts_controller_1.default.uploadCoverImage);
router
    .route("/:slug/image/:bytes")
    .put((0, express_slow_down_1.default)({
    windowMs: 10000,
    delayAfter: 3,
    delayMs: 2000,
}), authMiddleware_1.default, Posts_controller_1.default.uploadCoverImage);
router.route("/:id/toggleShare").post((0, express_slow_down_1.default)({
    windowMs: 10000,
    delayAfter: 20,
    delayMs: 3000,
}), authMiddleware_1.default, Posts_controller_1.default.togglePostShare);
router.route("/:id/comments").post((0, limiters_1.simpleRateLimit)({
    routeName: "postComment",
    blockDuration: 300000,
    maxReqs: 30,
    windowMs: 300000,
    msg: "Max 30 comments every 5 minutes. You must wait BLOCKDURATION to comment again.",
}), authMiddleware_1.default, Posts_controller_1.default.addComment);
router.route("/:id/comments/:commentId").put((0, limiters_1.simpleRateLimit)({
    routeName: "editPostComment",
    blockDuration: 300000,
    maxReqs: 30,
    windowMs: 300000,
    msg: "You have edited comments too many times. Wait BLOCKDURATION.",
}), authMiddleware_1.default, Posts_controller_1.default.updateComment);
router
    .route("/:id/comments/:commentId")
    .delete(authMiddleware_1.default, Posts_controller_1.default.deleteComment);
router
    .route("/:id/comments/:commentId/toggleLike")
    .post(authMiddleware_1.default, Posts_controller_1.default.toggleCommentLike);
exports.default = router;
