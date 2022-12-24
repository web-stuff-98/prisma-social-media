import prisma from "./prisma";
import { LoremIpsum } from "lorem-ipsum";
import crypto from "crypto";
import axios from "axios";
import imageProcessing from "./imageProcessing";
import AWS from "./aws";
import zlib from "zlib";

const s3 = new AWS.S3();

const lipsum = new LoremIpsum();

let generatedUsers: any[] = [];
let generatedPosts: any[] = [];
let generatedRooms: any[] = [];

export default async function seed() {
  await prisma.user.deleteMany();
  await s3.deleteBucket();

  await generateUsers(50);
  await generatePosts(1000);
  await generateRooms(20);
  await generatePostImages();
  await generateCommentsOnPosts();
  await generateLikesAndSharesOnPosts();
  await generateLikesOnComments();

  console.log(" --- GENERATED SEED ---");
}

const generateUser = async (i: number) => {
  const imageRes = await axios({
    method: "GET",
    url: "https://100k-faces.glitch.me/random-image",
    responseType: "arraybuffer",
  });
  const pfp = (await imageProcessing(Buffer.from(imageRes.data, "binary"), {
    width: 42,
    height: 42,
  })) as string;
  const u = await prisma.user.create({
    data: {
      name: `TestAcc${i + 1}`,
      password: "$2a$12$KhAwjN8WzTUdYNmAjIN8nuM0XpIFhnfPCmPaimxH9YBr0pufFKBGq",
    },
  });
  await prisma.pfp.create({
    data: {
      base64: pfp,
      userId: u.id,
    },
  });
  generatedUsers = [u, ...generatedUsers];
};
const generateUsers = async (num: number) => {
  for await (const i of Array.from(Array(num).keys())) {
    await generateUser(i);
    console.log("Generated user");
  }
};

const generatePost = async () => {
  const res = await axios({
    method: "GET",
    url: "https://jaspervdj.be/lorem-markdownum/markdown.txt",
    responseType: "arraybuffer",
  });
  const body = await new Promise<string>((resolve, reject) => {
    zlib.gunzip(res.data, (err, out) => {
      if (err) reject(err);
      resolve(out.toString());
    });
  });
  const title = lipsum.generateParagraphs(1).slice(0, 80);
  const description = lipsum
    .generateParagraphs(Math.ceil(Math.random() * 3))
    .slice(0, 160);
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") +
    crypto.randomBytes(64).toString("hex").slice(0, 6);
  const randomCreationDate = Math.ceil(
    Math.random() * 345600000 * (Math.random() > 0.5 ? -1 : 1)
  );
  const p = await prisma.post.create({
    data: {
      title,
      description,
      slug,
      body,
      createdAt: new Date(Date.now() + randomCreationDate),
      updatedAt: new Date(
        Math.random() < 0.8
          ? randomCreationDate
          : randomCreationDate +
            (Date.now() - randomCreationDate) * Math.random()
      ),
      authorId:
        generatedUsers[Math.floor(Math.random() * generatedUsers.length)].id,
      tags: {
        connectOrCreate: lipsum
          .generateParagraphs(1)
          .replaceAll(".", "")
          .split(" ")
          .filter((tag: string) => tag && tag.length > 1)
          .slice(0, 8)
          .map((tag: string) => {
            const name = tag.trim().toLowerCase();
            return {
              where: { name },
              create: { name },
            };
          }),
      },
    },
  });
  generatedPosts = [p, ...generatedPosts];
};
const generatePosts = async (num: number) => {
  for await (const i of Array.from(Array(num).keys())) {
    await generatePost();
    console.log("Generated post");
  }
};

const generateRoom = async (i: number) => {
  const authorId =
    generatedUsers[Math.floor(Math.random() * generatedUsers.length)].id;
  const numMembers = Math.floor(Math.random() * generatedUsers.length);
  let members = [authorId];
  while (i < numMembers) {
    i++;
    members.push(
      generatedUsers[Math.floor(Math.random() * generatedUsers.length)].id
    );
  }
  members = [...new Set(members)];
  const numBanned = Math.floor(Math.random() * 5);
  let banned = [];
  while (i < numBanned) {
    i++;
    banned.push(
      generatedUsers[Math.floor(Math.random() * generatedUsers.length)].id
    );
  }
  banned = [...new Set(banned)].filter(
    (bannedUid) => !members.includes(bannedUid)
  );
  const r = await prisma.room.create({
    data: {
      name: `Example Room ${i + 1}`,
      public: Math.random() < 0.8,
      authorId,
      members: { connect: members.map((uid) => ({ id: uid })) },
      banned: { connect: banned.map((uid) => ({ id: uid })) },
    },
    include: {
      author: { select: { id: true } },
      members: { select: { id: true } },
      banned: { select: { id: true } },
    },
  });
  generatedRooms = [r, ...generatedRooms];
};
const generateRooms = async (num: number) => {
  for await (const i of Array.from(Array(num).keys())) {
    await generateRoom(i);
    console.log("Generated room");
  }
};

const generateCommentOnPost = async (
  postId: string,
  idsOfOtherCommentsOnPost: string[] = []
) => {
  const rand = Math.random();
  const data = {
    message: lipsum
      .generateSentences(Math.ceil(Math.max(rand * rand * 3, 1)))
      .slice(0, 300),
    userId:
      generatedUsers[Math.floor(Math.random() * generatedUsers.length)].id,
    postId,
    ...(idsOfOtherCommentsOnPost.length > 0 && Math.random() < 0.666
      ? {
          parentId:
            idsOfOtherCommentsOnPost[
              Math.floor(Math.random() * idsOfOtherCommentsOnPost.length)
            ],
        }
      : {}),
  };
  const { id } = await prisma.comment.create({
    data,
  });
  return id;
};
const generateCommentsOnPost = async (postId: string) => {
  const rand = Math.random();
  const rand2 = Math.random() * 100;
  const numComments = Math.floor(rand * rand * rand * rand * rand2);
  let idsOfOtherCommentsOnPost: string[] = [];
  for await (const i of Array.from(Array(numComments).keys())) {
    const commentId: string = await generateCommentOnPost(
      postId,
      idsOfOtherCommentsOnPost
    );
    idsOfOtherCommentsOnPost.push(commentId);
  }
};
const generateCommentsOnPosts = async () => {
  for await (const p of generatedPosts) {
    await generateCommentsOnPost(p.id);
    console.log("Generated comments for post");
  }
};

const generateLikesAndSharesOnPosts = async () => {
  for await (const p of generatedPosts) {
    const likesRand = Math.random();
    const sharesRand = Math.random();
    const shuffledUsersForLikes = shuffle(generatedUsers);
    const shuffledUsersForShares = shuffle(generatedUsers);
    const numLikes = Math.floor(likesRand * likesRand * generatedUsers.length);
    const numShares = Math.floor(
      sharesRand * sharesRand * generatedUsers.length
    );
    for await (const i of Array.from(Array(numLikes).keys())) {
      await prisma.postLike.create({
        data: {
          postId: p.id,
          userId: shuffledUsersForLikes[i].id,
        },
      });
    }
    for await (const i of Array.from(Array(numShares).keys())) {
      await prisma.postShare.create({
        data: {
          postId: p.id,
          userId: shuffledUsersForShares[i].id,
        },
      });
    }
    console.log("Generated likes and shares for post");
  }
};

const generateLikesOnComments = async () => {
  for await (const p of generatedPosts) {
    const post = await prisma.post.findFirst({
      where: { id: p.id },
      select: { comments: { select: { id: true } } },
    });
    if (post && post.comments)
      for await (const cmt of post.comments) {
        const rand = Math.random();
        const numLikes = Math.floor(rand * rand * generatedUsers.length);
        const shuffledUsers = shuffle(generatedUsers);
        for await (const i of Array.from(Array(numLikes).keys())) {
          await prisma.commentLike.create({
            data: {
              commentId: cmt.id,
              userId: shuffledUsers[i].id,
            },
          });
        }
        console.log("Generated likes for comment");
      }
  }
};

const generatePostImages = async () => {
  for await (const post of generatedPosts) {
    const imageRes = await axios({
      url: "https://picsum.photos/1000/800",
      responseType: "arraybuffer",
    });
    const image = Buffer.from(imageRes.data, "binary");
    const scaled = (await imageProcessing(
      image,
      { width: 768, height: 500 },
      true
    )) as string;
    const thumb = (await imageProcessing(
      image,
      { width: 300, height: 300 },
      true
    )) as string;
    await new Promise<void>((resolve, reject) => {
      s3.upload(
        {
          Bucket: "prisma-socialmedia",
          Key: `${process.env.NODE_ENV !== "production" ? "dev." : ""}thumb.${post.slug}.randomPost`,
          Body: thumb,
          ContentType: "image/jpeg",
          ContentEncoding: "base64",
        },
        (e, _) => {
          if (e) reject(e);
          resolve();
        }
      );
    });
    await new Promise<void>((resolve, reject) => {
      s3.upload(
        {
          Bucket: "prisma-socialmedia",
          Key: `${(process.env.NODE_ENV !== "production" ? "dev." : "") + post.slug}.randomPost`,
          Body: scaled,
          ContentType: "image/jpeg",
          ContentEncoding: "base64",
        },
        (e, _) => {
          if (e) reject(e);
          resolve();
        }
      );
    });
    const blur = (await imageProcessing(image, {
      width: 14,
      height: 10,
    })) as string;
    await prisma.post.update({
      where: { id: post.id },
      data: {
        imagePending: false,
        imageKey: `${post.slug}.randomPost`,
        blur,
      },
    });
    console.log("Added random image to post");
  }
};

function shuffle(array: any[]) {
  let currentIndex = array.length,
    randomIndex;
  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}
