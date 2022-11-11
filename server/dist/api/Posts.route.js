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
const router = express_1.default.Router();
router.route("/").get(Posts_controller_1.default.getPosts);
router.route("/").post(Posts_controller_1.default.createPost);
router.route("/:slug").get(authMiddleware_1.withUser, Posts_controller_1.default.getPostBySlug);
router.route("/:id/toggleLike").post(authMiddleware_1.default, Posts_controller_1.default.togglePostLike);
router.route("/:id/comments").post(authMiddleware_1.default, Posts_controller_1.default.addComment);
router.route("/:id/comments/:commentId").put(authMiddleware_1.default, Posts_controller_1.default.updateComment);
router.route("/:id/comments/:commentId").delete(authMiddleware_1.default, Posts_controller_1.default.deleteComment);
router
    .route("/:id/comments/:commentId/toggleLike")
    .post(authMiddleware_1.default, Posts_controller_1.default.toggleCommentLike);
exports.default = router;
