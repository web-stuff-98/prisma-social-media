import express from "express";
import authMiddleware, { withUser } from "../utils/authMiddleware";
import PostsController from "./controllers/Posts.controller";
const router = express.Router();

router.route("/").get(PostsController.getPosts);
router.route("/").post(PostsController.createPost);
router.route("/:slug").get(withUser, PostsController.getPostBySlug);
router.route("/:id/toggleLike").post(authMiddleware, PostsController.togglePostLike);
router.route("/:id/comments").post(authMiddleware,PostsController.addComment);
router.route("/:id/comments/:commentId").put(authMiddleware, PostsController.updateComment);
router.route("/:id/comments/:commentId").delete(authMiddleware, PostsController.deleteComment);
router
  .route("/:id/comments/:commentId/toggleLike")
  .post(authMiddleware, PostsController.toggleCommentLike);

export default router;
