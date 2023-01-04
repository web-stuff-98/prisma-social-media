import prisma from "./prisma";
import { LoremIpsum } from "lorem-ipsum";
import crypto from "crypto";
import axios from "axios";
import imageProcessing from "./imageProcessing";
import AWS from "./aws";

const s3 = new AWS.S3();

const lipsum = new LoremIpsum();

/*
 I was having weird errors about invalid update invocation
 so I put the generated IDs inside global variables and it fixed
 it somehow
*/

async function seed(users: number, posts: number, rooms: number) {
  await prisma.user.deleteMany();
  await prisma.privateMessage.deleteMany();
  await prisma.roomMessage.deleteMany();
  await s3.deleteBucket();

  globalThis.generatedPosts = [];
  globalThis.generatedRooms = [];
  globalThis.generatedUsers = [];

  await generateUsers(users);
  await generatePosts(posts);
  await generateRooms(rooms);
  await generatePostImages();
  await generateCommentsOnPosts();
  await generateLikesAndSharesOnPosts();
  await generateLikesOnComments();

  console.log(" --- GENERATED SEED ---");
}
export default seed;

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
  globalThis.generatedUsers.push(u.id);
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
  const body = (res.data as Buffer).toString();
  // no longer need to use gunzip, must have been an update
  /*const body = await new Promise<string>((resolve, reject) => {
    zlib.gunzip(res.data, (err, out) => {
      console.log(res.data);
      if (err) reject(err);
      resolve(out.toString());
    });
  });*/
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
        globalThis.generatedUsers[
          Math.floor(Math.random() * globalThis.generatedUsers.length)
        ],
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
  globalThis.generatedPosts.push(p.id);
};
const generatePosts = async (num: number) => {
  for await (const i of Array.from(Array(num).keys())) {
    await generatePost();
    console.log("Generated post");
  }
};

const generateRoom = async (i: number) => {
  const authorId =
    globalThis.generatedUsers[
      Math.floor(Math.random() * globalThis.generatedUsers.length)
    ];
  const numMembers = Math.floor(
    Math.random() * globalThis.generatedUsers.length
  );
  let members = [authorId];
  while (i < numMembers) {
    i++;
    members.push(
      globalThis.generatedUsers[
        Math.floor(Math.random() * globalThis.generatedUsers.length)
      ]
    );
  }
  members = [...new Set(members)];
  const numBanned = Math.floor(Math.random() * 5);
  let banned = [];
  while (i < numBanned) {
    i++;
    banned.push(
      globalThis.generatedUsers[
        Math.floor(Math.random() * globalThis.generatedUsers.length)
      ]
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
  globalThis.generatedRooms.push(r.id);
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
      globalThis.generatedUsers[
        Math.floor(Math.random() * globalThis.generatedUsers.length)
      ],
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
  let id;
  try {
    const cmt = await prisma.comment.create({
      data,
    });
    id = cmt.id;
  } catch (error) {
    console.log("Failed to add comment for some reason");
  }
  return id;
};
const generateCommentsOnPost = async (postId: string) => {
  const rand = Math.random();
  const rand2 = Math.random() * 120;
  const numComments = Math.floor(rand * rand * rand * rand2);
  let idsOfOtherCommentsOnPost: string[] = [];
  for await (const i of Array.from(Array(numComments).keys())) {
    const commentId: string | undefined = await generateCommentOnPost(
      postId,
      idsOfOtherCommentsOnPost
    );
    if (commentId) idsOfOtherCommentsOnPost.push(commentId);
  }
};
const generateCommentsOnPosts = async () => {
  for await (const p of globalThis.generatedPosts) {
    await generateCommentsOnPost(p);
    console.log("Generated comments for post");
  }
};

const generateLikesAndSharesOnPosts = async () => {
  for await (const p of globalThis.generatedPosts) {
    const likesRand = Math.random();
    const sharesRand = Math.random();
    const shuffledUsersForLikes = shuffle(globalThis.generatedUsers);
    const shuffledUsersForShares = shuffle(globalThis.generatedUsers);
    const numLikes = Math.floor(
      likesRand * likesRand * globalThis.generatedUsers.length
    );
    const numShares = Math.floor(
      sharesRand * sharesRand * globalThis.generatedUsers.length
    );
    for await (const i of Array.from(Array(numLikes).keys())) {
      try {
        await prisma.postLike.create({
          data: {
            postId: p,
            userId: shuffledUsersForLikes[i],
          },
        });
      } catch (e) {
        console.log("Failed to add post like for some reason");
      }
    }
    for await (const i of Array.from(Array(numShares).keys())) {
      try {
        await prisma.postShare.create({
          data: {
            postId: p,
            userId: shuffledUsersForShares[i],
          },
        });
      } catch (e) {
        console.log("Failed to add post share for some reason");
      }
    }
    console.log("Generated likes and shares for post");
  }
};

const generateLikesOnComments = async () => {
  for await (const p of globalThis.generatedPosts) {
    const post = await prisma.post.findFirst({
      where: { id: p },
      select: { comments: { select: { id: true } } },
    });
    if (post && post.comments)
      for await (const cmt of post.comments) {
        const rand = Math.random();
        const numLikes = Math.floor(
          rand * rand * globalThis.generatedUsers.length
        );
        const shuffledUsers = shuffle(globalThis.generatedUsers);
        for await (const i of Array.from(Array(numLikes).keys())) {
          try {
            await prisma.commentLike.create({
              data: {
                commentId: cmt.id,
                userId: shuffledUsers[i],
              },
            });
          } catch (error) {
            console.log("Failed to add comment like for some reason");
          }
        }
        console.log("Generated likes for comment");
      }
  }
};

const generatePostImages = async () => {
  for await (const post of globalThis.generatedPosts) {
    //wait a but so that the images aren't being downloaded too fast
    await new Promise<void>((resolve, _) => {
      setTimeout(() => {
        resolve();
      }, 250);
    });
    const imageRes = await axios({
      url: "https://picsum.photos/1000/500",
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
    let slug: string;
    await new Promise<void>((resolve, reject) => {
      prisma.post
        .findUnique({ where: { id: post }, select: { slug: true } })
        .then((data) => {
          slug = data?.slug!;
          s3.upload(
            {
              Bucket: "prisma-socialmedia",
              Key: `${
                process.env.NODE_ENV !== "production" ? "dev." : ""
              }thumb.${slug}.randomPost`,
              Body: thumb,
              ContentType: "image/jpeg",
              ContentEncoding: "base64",
            },
            (e, _) => {
              if (e) reject(e);
              resolve();
            }
          );
        })
        .catch((e) => reject(e));
    });
    await new Promise<void>((resolve, reject) => {
      s3.upload(
        {
          Bucket: "prisma-socialmedia",
          Key: `${
            (process.env.NODE_ENV !== "production" ? "dev." : "") + slug
          }.randomPost`,
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
    await new Promise<void>((resolve, reject) => {
      imageProcessing(image, {
        width: 14,
        height: 10,
      })
        .then((blur) => {
          prisma.post
            .update({
              where: { id: post },
              data: {
                imagePending: false,
                imageKey: `${slug}.randomPost`,
                blur: blur as string,
              },
            })
            .then(() => resolve())
            .catch((e) => reject(e));
        })
        .catch((e) => {
          reject(e);
        });
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
