import prisma from "./prisma";

import { Post } from "@prisma/client";

type Query = {
  rawTags: string;
  rawTerm: string;
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
    rawTags = query.rawTags;
    rawTerm = query.rawTerm;
    clientQueryInput = {
      pageOffset: Number(Math.max(Number(params?.page) - 1, 0) * 20),
      ...(rawTags
        ? {
            tags: rawTags
              ? String(rawTags)
                  .toLowerCase()
                  .split(" ")
                  .filter((tag: string) => tag.trim() !== "")
                  .map((tag: string) => tag.replace(/[^\w-]+/g, ""))
              : [],
          }
        : rawTerm
        ? {
            term: String(rawTerm)
              .toLowerCase()
              .trim()
              .replaceAll("+", " ")
              .replace(/[^\w-]+/g, ""),
          }
        : {}),
    };
  }

  /*
  Need to use type any because there is a typescript error caused by mode: "insensitive"
  for some reason 
  */
  const where: any = rawTags
    ? {
        imagePending: false,
        tags: { some: { name: { in: clientQueryInput.tags } } },
      }
    : {
        imagePending: false,
        ...(clientQueryInput.term
          ? {
              title: {
                contains: clientQueryInput.term,
                mode: "insensitive",
              },
            }
          : {}),
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
      imageKey:true,
      blur:true,
    },
    orderBy: { createdAt: "desc" },
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
      return {
        ...post,
        likes: post.likes.length,
        shares: post.shares.length,
        tags: post.tags.map((tag) => tag.name),
        likedByMe,
        sharedByMe,
      };
    }),
    pageCount: posts.length,
    fullCount: feedQ_count.length,
    maxPage: Math.ceil(feedQ_count.length / 20),
  };
};
