import express from "express";
import authMiddleware, { withUser } from "../utils/authMiddleware";
import PostsController from "./controllers/Posts.controller";
import { simpleRateLimit } from "./limiter/limiters";
const router = express.Router();

router.route("/").get(withUser, PostsController.getPosts);
router.route("/popular").get(withUser, PostsController.getPopularPosts);
router.route("/").post(authMiddleware, PostsController.createPost);
router.route("/:slug").put(authMiddleware, PostsController.updatePost);
router.route("/:slug").get(withUser, PostsController.getPostBySlug);
router
  .route("/:id/toggleLike")
  .post(authMiddleware, PostsController.togglePostLike);
router
  .route("/:id/toggleShare")
  .post(authMiddleware, PostsController.togglePostShare);
router.route("/:id/comments").post(
  simpleRateLimit({
    routeName: "postComment",
    blockDuration: 300000,
    maxReqs: 30,
    windowMs: 300000,
    msg: "Max 30 comments every 5 minutes. You must wait 5 more minutes to comment again.",
  }),
  authMiddleware,
  PostsController.addComment
);
router.route("/:id/comments/:commentId").put(
  simpleRateLimit({
    routeName: "editPostComment",
    blockDuration: 300000,
    maxReqs: 30,
    windowMs: 300000,
    msg: "You have edited comments too many times. Wait 5 minutes.",
  }),
  authMiddleware,
  PostsController.updateComment
);
router
  .route("/:id/comments/:commentId")
  .delete(authMiddleware, PostsController.deleteComment);
router
  .route("/:id/comments/:commentId/toggleLike")
  .post(authMiddleware, PostsController.toggleCommentLike);

export default router;
