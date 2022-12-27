import prisma from "./prisma";

import { Post } from "@prisma/client";
import parsePosts from "./parsePosts";

type Query = {
  tags: string;
  term: string;
  mode: string;
  order: string;
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
  let rawOrder = "";
  let rawMode = "";
  if (query) {
    if (query.tags) rawTags = query.tags;
    if (query.term) rawTerm = query.term;
    if (query.order) rawOrder = query.order;
    if (query.mode) rawMode = query.mode;
    clientQueryInput = {
      pageOffset: Number(Math.max(Number(params?.page) - 1, 0) * 20),
      tags: rawTags
        ? String(rawTags)
            .toLowerCase()
            .split(" ")
            .filter((tag: string) => tag.trim() !== "")
            .map((tag: string) => tag.replace(/[^\w-]+/g, ""))
        : [],
      term: rawTerm ? String(rawTerm).toLowerCase().trim() : "",
      order: rawOrder || "des",
      mode: rawMode || "popular",
    };
  }

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

  const orderByCreated = {
    createdAt: (clientQueryInput.order === "des" ? "desc" : "asc") as
      | "desc"
      | "asc",
  } as any;

  const orderByPopular = {
    likes: {
      _count: (clientQueryInput.order === "des" ? "desc" : "asc") as
        | "desc"
        | "asc",
    },
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
    orderBy:
      clientQueryInput.mode === "popular" ? orderByPopular : orderByCreated,
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
    posts: parsePosts(posts, uid),
    pageCount: posts.length,
    fullCount: feedQ_count.length,
    maxPage: Math.ceil(feedQ_count.length / 20),
  };
};
