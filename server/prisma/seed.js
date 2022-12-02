const { PrismaClient } = require("@prisma/client");
const { LoremIpsum } = require("lorem-ipsum");
const prisma = new PrismaClient();
const lipsum = new LoremIpsum();
const crypto = require("crypto");
const axios = require("axios")

// the password for the example users is "Test1234!"

let generatedUsers = [];
let generatedPosts = [];
let generatedRooms = [];

async function seed() {
  //deleting just users on their own SHOULD cascade and delete everything else.
  //if it doesn't there is something wrong with the schema somehow.
  await prisma.user.deleteMany();

  await generateUsers(10);
  await generatePosts(30);
  await generateRooms(20);
  await generateCommentsOnPosts();
  await generateLikesAndSharesOnPosts();
  await generateLikesOnComments();
}

const generateUser = async (i) => {
  const u = await prisma.user.create({
    data: {
      name: `TestAcc${i + 1}`,
      password: "$2a$12$KhAwjN8WzTUdYNmAjIN8nuM0XpIFhnfPCmPaimxH9YBr0pufFKBGq",
    },
  });
  generatedUsers = [u, ...generatedUsers];
};
const generateUsers = async (num) => {
  for await (const i of Array.from(Array(num).keys())) {
    await generateUser(i);
    console.log("Generated user");
  }
};

const generatePost = async () => {
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
  const p = await prisma.post.create({
    data: {
      title,
      description,
      slug,
      body: lipsum.generateParagraphs(10),
      authorId:
        generatedUsers[
          parseInt(Math.floor(Math.random() * generatedUsers.length))
        ].id,
      tags: {
        connectOrCreate: lipsum
          .generateParagraphs(1)
          .split(" ")
          .filter((tag) => tag !== "")
          .slice(0, 8)
          .map((tag) => {
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
const generatePosts = async (num) => {
  for await (const i of Array.from(Array(num).keys())) {
    await generatePost();
    console.log("Generated post");
  }
};

const generateRoom = async (i) => {
  const authorId =
    generatedUsers[
      parseInt(`${Math.floor(Math.random() * generatedUsers.length)}`)
    ].id;
  const numMembers = parseInt(`${Math.floor(Math.random() * generatedUsers.length)}`);
  let members = [authorId];
  while (i < numMembers) {
    i++;
    members.push(
      generatedUsers[
        parseInt(`${Math.floor(Math.random() * generatedUsers.length)}`)
      ].id
    );
  }
  members = [...new Set(members)];
  const numBanned = parseInt(`${Math.floor(Math.random() * 5)}`);
  let banned = [];
  while (i < numBanned) {
    i++;
    banned.push(
      generatedUsers[
        parseInt(`${Math.floor(Math.random() * generatedUsers.length)}`)
      ].id
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
const generateRooms = async (num) => {
  for await (const i of Array.from(Array(num).keys())) {
    await generateRoom(i);
    console.log("Generated room");
  }
};

const generateCommentOnPost = async (postId, idsOfOtherCommentsOnPost = []) => {
  const rand = Math.random();
  const data = {
    message: lipsum.generateSentences(
      parseInt(`${Math.max(rand * rand * 6, 1)}`)
    ),
    userId:
      generatedUsers[
        parseInt(`${Math.floor(Math.random() * generatedUsers.length)}`)
      ].id,
    postId,
    ...(idsOfOtherCommentsOnPost.length > 0 && Math.random() < 0.5
      ? {
          parentId:
            idsOfOtherCommentsOnPost[
              parseInt(
                `${Math.floor(Math.random() * idsOfOtherCommentsOnPost.length)}`
              )
            ],
        }
      : {}),
  };
  const { id } = await prisma.comment.create({
    data,
  });
  return id;
};
const generateCommentsOnPost = async (postId) => {
  const rand = Math.random();
  const rand2 = Math.random() * 150 * rand;
  const numComments = Math.floor(rand * rand * rand2);
  let idsOfOtherCommentsOnPost = [];
  for await (const i of Array.from(Array(numComments).keys())) {
    const commentId = await generateCommentOnPost(
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
    const { comments } = await prisma.post.findFirst({
      where: { id: p.id },
      select: { comments: { select: { id: true } } },
    });
    for await (const cmt of comments) {
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

function shuffle(array) {
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

seed();
