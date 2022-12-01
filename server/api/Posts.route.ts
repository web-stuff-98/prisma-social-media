import express from "express";
import authMiddleware, { withUser } from "../utils/authMiddleware";
import PostsController from "./controllers/Posts.controller";

import { simpleRateLimit } from "./limiter/limiters";
import slowDown from "express-slow-down";

const router = express.Router();

router.route("/").get(
  slowDown({
    windowMs: 2000,
    delayAfter: 10,
    delayMs: 1000,
  }),
  withUser,
  PostsController.getPosts
);
router.route("/popular").get(
  slowDown({
    windowMs: 2000,
    delayAfter: 10,
    delayMs: 1000,
  }),
  withUser,
  PostsController.getPopularPosts
);
router.route("/page/:page").get(
  slowDown({
    windowMs: 2000,
    delayAfter: 10,
    delayMs: 1000,
  }),
  withUser,
  PostsController.getPage
);
router.route("/").post(
  slowDown({
    windowMs: 120000,
    delayAfter: 10,
    delayMs: 5000,
  }),
  authMiddleware,
  PostsController.createPost
);
router.route("/:slug").put(
  slowDown({
    windowMs: 120000,
    delayAfter: 10,
    delayMs: 5000,
  }),
  authMiddleware,
  PostsController.updatePost
);
router.route("/:slug").get(withUser, PostsController.getPostBySlug);
router.route("/:id/toggleLike").post(
  slowDown({
    windowMs: 10000,
    delayAfter: 20,
    delayMs: 3000,
  }),
  authMiddleware,
  PostsController.togglePostLike
);
router
  .route("/:slug/image/:bytes")
  .post(
    slowDown({
      windowMs: 10000,
      delayAfter: 3,
      delayMs: 2000,
    }),
    authMiddleware,
    PostsController.uploadCoverImage
  );
router.route("/:id/toggleShare").post(
  slowDown({
    windowMs: 10000,
    delayAfter: 20,
    delayMs: 3000,
  }),
  authMiddleware,
  PostsController.togglePostShare
);
router.route("/:id/comments").post(
  simpleRateLimit({
    routeName: "postComment",
    blockDuration: 300000,
    maxReqs: 30,
    windowMs: 300000,
    msg: "Max 30 comments every 5 minutes. You must wait BLOCKDURATION to comment again.",
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
    msg: "You have edited comments too many times. Wait BLOCKDURATION.",
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
