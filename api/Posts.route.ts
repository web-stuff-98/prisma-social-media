import express from "express";
import authMiddleware, { withUser } from "../utils/authMiddleware";
import PostsController from "./controllers/Posts.controller";

import { simpleRateLimit } from "./limiter/limiters";
import slowDown from "express-slow-down";
import validateBodyMiddleware from "../utils/validateBodyMiddleware";

import * as Yup from "yup";

const router = express.Router();

const postValidateSchema = {
  title: Yup.string().required().max(80).required(),
  body: Yup.string().required().max(10000).required(),
  description: Yup.string().max(160).required(),
  tags: Yup.string()
    .max(80, "Tags too long. Maximum 80 characters")
    .test("missingHashtag", "You need an # symbol for each tag.", (value) =>
      Boolean(value && value.charAt(0) === "#")
    )
    .test("tooManyTags", "Maximum 8 tags.", (value) =>
      Boolean(
        value && value.split("#").filter((t) => t.trim() !== "").length <= 8
      )
    )
    .test(
      "tagTooLong",
      "One of your tags is too long. Max 24 characters for each tag.",
      (value) => {
        if (!value) return true;
        const tags = value.split("#");
        for (const tag of tags) {
          if (tag.length > 24) return false;
        }
        return true;
      }
    )
    .required(),
};

router.route("/page/:page").get(
  slowDown({
    windowMs: 1000,
    delayAfter: 3,
    delayMs: 500,
  }),
  simpleRateLimit({
    routeName: "getPage",
    maxReqs: 4,
    windowMs: 1000,
    blockDuration: 2000,
    msg: "Your request rate is surpassing the debouncer.",
  }),
  withUser,
  PostsController.getPage
);
router.route("/").post(
  authMiddleware,
  slowDown({
    windowMs: 120000,
    delayAfter: 10,
    delayMs: 5000,
  }),
  validateBodyMiddleware(postValidateSchema),
  PostsController.createPost
);
router.route("/slugs").post(
  withUser,
  slowDown({
    windowMs: 120000,
    delayAfter: 10,
    delayMs: 5000,
  }),
  validateBodyMiddleware({
    slugs: Yup.array().of(Yup.string()).required(),
  }),
  PostsController.getDataForPosts
);
router.route("/:slug").put(
  authMiddleware,
  slowDown({
    windowMs: 120000,
    delayAfter: 10,
    delayMs: 5000,
  }),
  validateBodyMiddleware(postValidateSchema),
  PostsController.updatePost
);
router.route("/:slug").delete(
  slowDown({
    windowMs: 120000,
    delayAfter: 10,
    delayMs: 5000,
  }),
  authMiddleware,
  PostsController.deletePost
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
router.route("/:slug/image/:bytes").post(
  slowDown({
    windowMs: 10000,
    delayAfter: 3,
    delayMs: 2000,
  }),
  authMiddleware,
  PostsController.uploadCoverImage
);
router.route("/:slug/image/:bytes").put(
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
  authMiddleware,
  simpleRateLimit({
    routeName: "postComment",
    blockDuration: 300000,
    maxReqs: 30,
    windowMs: 300000,
    msg: "Max 30 comments every 5 minutes. You must wait BLOCKDURATION to comment again.",
  }),
  validateBodyMiddleware({
    message: Yup.string().required().max(300),
    parentId: Yup.string().nullable().notRequired(),
  }),
  PostsController.addComment
);
router.route("/:id/comments/:commentId").put(
  authMiddleware,
  simpleRateLimit({
    routeName: "editPostComment",
    blockDuration: 300000,
    maxReqs: 30,
    windowMs: 300000,
    msg: "You have edited comments too many times. Wait BLOCKDURATION.",
  }),
  validateBodyMiddleware({
    message: Yup.string().required().max(300),
  }),
  PostsController.updateComment
);
router
  .route("/:id/comments/:commentId")
  .delete(authMiddleware, PostsController.deleteComment);
router
  .route("/:id/comments/:commentId/toggleLike")
  .post(authMiddleware, PostsController.toggleCommentLike);

export default router;
