import { Request, Response } from "express";
import PostsDAO from "../dao/Posts.dao";

import * as Yup from "yup";

const createPostSchema = Yup.object().shape({
  title: Yup.string().required().max(100).required(),
  body: Yup.string().required().max(10000).required(),
});

const commentSchema = Yup.object()
  .shape({ message: Yup.string().required().max(300).required() })
  .strict();

export default class PostsController {
  static async getPosts(req: Request, res: Response) {
    try {
      const posts = await PostsDAO.getPosts();
      res.status(200).json(posts);
    } catch (e) {
      res.status(500).json({ msg: "Internal error" });
    }
  }

  static async getPostById(req: Request, res: Response) {
    try {
      const post = await PostsDAO.getPostById(req.params.id, req.user?.id);
      if (post) res.status(200).json(post);
      else res.status(404).json({ msg: "Not found" });
    } catch (e) {
      res.status(500).json({ msg: "Internal error" });
    }
  }

  static async getPostBySlug(req: Request, res: Response) {
    try {
      const post = await PostsDAO.getPostBySlug(req.params.slug, req.user?.id);
      if (post) res.status(200).json(post);
      else res.status(404).json({ msg: "Not found" });
    } catch (e) {
      res.status(500).json({ msg: "Internal error" });
    }
  }

  static async createPost(req: Request, res: Response) {
    try {
      await createPostSchema.strict().validate(req.body);
    } catch (e) {
      return res
        .status(400)
        .json({ msg: `${e}`.replace("ValidationError: ", "") })
        .end();
    }

    try {
      const post = await PostsDAO.createPost(
        req.body.title,
        req.body.body,
        req.body.description,
        String(req.user?.id)
      );
      res.status(201).json(post).end();
    } catch (e) {
      res.status(500).json({ message: "Internal Error" }).end();
    }
  }

  static async addComment(req: Request, res: Response) {
    try {
      await commentSchema.validate(req.body);
    } catch (e) {
      console.error(e);
      return res
        .status(400)
        .json({ msg: `${e}`.replace("ValidationError: ", "") });
    }

    try {
      const cmt = await PostsDAO.addComment(
        req.body.message,
        String(req.user?.id),
        req.params.id,
        req.body.parentId,
        String(req.user?.name),
      );
      return res.status(201).json(cmt).end();
    } catch (e) {
      console.error(e);
      return res.status(500).json({ msg: "Internal Error" });
    }
  }

  static async updateComment(req: Request, res: Response) {
    try {
      await commentSchema.validate(req.body);
    } catch (e) {
      return res
        .status(400)
        .json({ msg: `${e}`.replace("ValidationError: ", "") });
    }

    try {
      const cmt = await PostsDAO.updateComment(
        req.body.message,
        req.params.commentId,
        String(req.user?.id)
      );
      if (!cmt) {
        return res.status(403).json({ msg: "Unauthorized" }).end();
      }
      return res.status(200).json(cmt).end();
    } catch (e) {
      return res.status(500).json({ msg: "Internal Error" });
    }
  }

  static async deleteComment(req: Request, res: Response) {
    try {
      const cmt = await PostsDAO.deleteComment(
        req.params.commentId,
        String(req.user?.id)
      );
      if (!cmt) {
        return res.status(403).json({ msg: "Unauthorized" }).end();
      }
      return res.status(200).json(cmt).end();
    } catch (e) {
      return res.status(500).json({ msg: "Internal Error" });
    }
  }

  /**
   Sends back { addLike } to the client, if addLike is true that means the user likes the comment, if it is not true that means that the user has removed their like. The frontend uses or should use this variable accordingly.
   */
  static async toggleCommentLike(req: Request, res: Response) {
    try {
      console.log(req.params.commentId, req.user?.id);
      const like = await PostsDAO.toggleCommentLike(
        req.params.commentId,
        String(req.user?.id)
      );
      return res.status(200).json(like).end();
    } catch (e) {
      console.error(e);
      return res.status(500).json({ msg: "Internal Error" });
    }
  }

  /**
   Sends back { addLike } to the client, if addLike is true that means the user likes the post, if it is not true that means that the user has removed their like. The frontend uses or should use this variable accordingly.
   */
  static async togglePostLike(req: Request, res: Response) {
    try {
      console.log(req.params.postId, req.user?.id);
      const like = await PostsDAO.togglePostLike(
        req.params.postId,
        String(req.user?.id)
      );
      return res.status(200).json(like).end();
    } catch (e) {
      console.error(e);
      return res.status(500).json({ msg: "Internal Error" });
    }
  }
}
