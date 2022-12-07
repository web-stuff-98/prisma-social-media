import prisma from "./prisma";

import { Post } from "@prisma/client";

type Query = {
  tags: string;
  term: string;
};
type Params = {
  page: number;
};

export default async (
  query?: Query,
  params?: Params,
  uid?: string
): Promise<{
  posts: Partial<Post>[];
  pageCount: number;
  fullCount: number;
  maxPage: number;
}> => {
  let clientQueryInput: any = {
    pageOffset: 0,
  };
  let rawTags = "";
  let rawTerm = "";
  if (query) {
    if(query.tags)
    rawTags = query.tags;
    if(query.term)
    rawTerm = query.term;
    clientQueryInput = {
      pageOffset: Number(Math.max(Number(params?.page) - 1, 0) * 20),
      tags: rawTags
        ? String(rawTags)
            .toLowerCase()
            .split(" ")
            .filter((tag: string) => tag.trim() !== "")
            .map((tag: string) => tag.replace(/[^\w-]+/g, ""))
        : [],
      term: rawTerm ? String(rawTerm)
        .toLowerCase()
        .trim() : ""
    };
  }

  /*
  Need to use type any because there is a typescript error caused by mode: "insensitive"
  for some reason 
  */
  const where: any =
  clientQueryInput.tags.length || clientQueryInput.term
      ? {
          imagePending: false,
          ...(clientQueryInput.tags.length > 0
            ? {
                tags: { some: { name: { in: clientQueryInput.tags } } },
              }
            : {}),
          ...(clientQueryInput.term
            ? {
                title: {
                  contains: clientQueryInput.term,
                  mode: "insensitive",
                },
              }
            : {}),
        }
      : {
          imagePending: false,
        };

  const posts = await prisma.post.findMany({
    where: {
      ...where,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      createdAt: true,
      description: true,
      author: {
        select: {
          id: true,
        },
      },
      likes: true,
      shares: true,
      tags: true,
      imageKey: true,
      blur: true,
      _count: { select: { comments: true } },
    },
    orderBy: { likes: { _count: "desc" } },
    skip: clientQueryInput.pageOffset,
    take: 10,
  });

  const feedQ_count = await prisma.post.findMany({
    where: {
      ...where,
    },
    select: { id: true },
  });

  return {
    posts: posts.map((post) => {
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
    }),
    pageCount: posts.length,
    fullCount: feedQ_count.length,
    maxPage: Math.ceil(feedQ_count.length / 20),
  };
};
