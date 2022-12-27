/*
This doesn't include the comments because its for displaying posts in the feed, not for displaying post pages
*/

import { Post, PostLike, PostShare, Tag } from "@prisma/client";

type PostWithLikesAndShares = Omit<
  Post & {
    likes: PostLike[];
    shares: PostShare[];
    tags: Tag[];
  },
  "body" | "authorId" | "updatedAt" | "imagePending"
>;

export default (posts: PostWithLikesAndShares[], uid?: string) =>
  posts.map((post) => {
    let likedByMe = false;
    let sharedByMe = false;
    likedByMe = post.likes.find((like) => like.userId === uid) ? true : false;
    sharedByMe = post.shares.find((share) => share.userId === uid)
      ? true
      : false;
    let out: any = {
      ...post,
      likes: post.likes.length,
      shares: post.shares.length,
      tags: post.tags.map((tag) => tag.name),
      likedByMe,
      sharedByMe,
    };
    out.commentCount = out._count.comments;
    delete out._count;
    return out;
  });
