import dotenv from "dotenv";
dotenv.config();

import seed from "./utils/seed";

import cors from "cors";
import express, { Express } from "express";
import cookieParser from "cookie-parser";
import http from "http";
import path from "path";

import AWS from "./utils/aws";

import { Server } from "socket.io";

import prisma from "./utils/prisma";

const origin =
  process.env.NODE_ENV === "production"
    ? [
        "https://prisma-social-media-js.herokuapp.com/",
        "http://prisma-social-media-js.herokuapp.com/",
      ]
    : "http://localhost:3000";

const app: Express = express();
const server = http.createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin,
    credentials: true,
  },
});

export { io };

let seedGeneratedAt: Date;

app.use(
  cors({
    origin,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "..", "frontend", "build")));

  ///The seed has already been generated
  /*seed(
    process.env.NODE_ENV !== "production" ? 5 : 50,
    process.env.NODE_ENV !== "production" ? 5 : 1000,
    process.env.NODE_ENV !== "production" ? 2 : 200
  ).then(() => {
    seedGeneratedAt = new Date();
  });*/

  /*Because the seed has already been generated, after a new version
  of the project just add all the existing posts,rooms and users IDs
  to the protected lists*/
  prisma.post
    .findMany({ where: {}, select: { id: true } })
    .then((data) => (globalThis.generatedPosts = data.map((p) => p.id)));
  prisma.user
    .findMany({ where: {}, select: { id: true } })
    .then((data) => (globalThis.generatedUsers = data.map((u) => u.id)));
  prisma.room
    .findMany({ where: {}, select: { id: true } })
    .then((data) => (globalThis.generatedRooms = data.map((r) => r.id)));
  seedGeneratedAt = new Date("2023-01-01T10:15:40.975928+00:00");
}

import jwt from "jsonwebtoken";

const socketAuth = async (socket: any) => {
  const rawCookie = socket.handshake.headers.cookie;
  if (rawCookie) {
    try {
      socket.data.user = jwt.verify(
        rawCookie.replace("token=", ""),
        String(process.env.JWT_SECRET)
      ) as { id: string; name: string };
      socket.join(`user=${socket.data.user.id}`);
      socket.join(`inbox=${socket.data.user.id}`);
      socket.data.vidChatOpen = false;
      io.to(`user=${socket.data.user.id}`).emit("user_visible_update", {
        id: socket.data.user.id,
        online: true,
      });
    } catch (e) {
      console.warn(
        "User trying to connect to socket with malformed token : " + e
      );
    }
  } else {
    socket.data.user = undefined;
  }
};

io.on("connection", async (socket) => {
  await socketAuth(socket);
  socket.on("user_visible", (uid) => socket.join(`user=${uid}`));
  socket.on("user_not_visible", (uid) => socket.leave(`user=${uid}`));
  socket.on("post_card_visible", (slug) => socket.join(`post_card=${slug}`));
  socket.on("post_card_not_visible", (slug) =>
    socket.leave(`post_card=${slug}`)
  );

  socket.on("open_profile", (uid: string) => socket.join(`profile=${uid}`));
  socket.on("close_profile", (uid: string) => socket.leave(`profile=${uid}`));
  socket.on("open_post", (slug) => socket.join(slug));
  socket.on("leave_post", (slug) => socket.leave(slug));

  socket.on("auth", async () => await socketAuth(socket));

  socket.on("room_video_chat_sending_signal", async (payload) => {
    io.to(payload.userToSignal).emit(
      "room_video_chat_user_joined",
      payload.signal,
      payload.callerSid,
      socket.data.user?.id as string
    );
  });
  socket.on("room_video_chat_returning_signal", (payload) => {
    io.to(payload.callerSid).emit(
      "room_video_chat_receiving_returned_signal",
      payload.signal,
      socket.id
    );
  });

  socket.on(
    "private_conversation_video_chat_sending_signal",
    async (payload) => {
      const calledSocket = await getUserSocket(payload.userToSignal);
      io.to(calledSocket?.id!).emit(
        "private_conversation_video_chat_user_joined",
        payload.signal,
        socket.id
      );
    }
  );
  socket.on("private_conversation_video_chat_returning_signal", (payload) => {
    io.to(payload.callerSid).emit(
      "private_conversation_video_chat_receiving_returned_signal",
      payload.signal
    );
  });

  socket.on("private_conversation_open", (subjectUid: string) => {
    socket.data.vidChatOpen = false;
    socket.data.conversationSubjectUid = subjectUid;
  });
  socket.on("private_conversation_close", async () => {
    if (socket.data.vidChatOpen && socket.data.conversationSubjectUid) {
      const otherSocket = await getUserSocket(
        socket.data.conversationSubjectUid
      );
      if (otherSocket)
        io
          .to(otherSocket.id)
          .emit("private_conversation_video_chat_user_left")!;
    }
    socket.data.vidChatOpen = false;
    socket.data.conversationSubjectUid = "";
  });
  socket.on("private_conversation_vid_chat_close", async () => {
    socket.data.vidChatOpen = false;
    if (socket.data.conversationSubjectUid) {
      const otherSocket = await getUserSocket(
        socket.data.conversationSubjectUid
      );
      if (otherSocket)
        io
          .to(otherSocket.id)
          .emit("private_conversation_video_chat_user_left")!;
    }
  });
  socket.on("private_conversation_vid_chat_open", () => {
    socket.data.vidChatOpen = true;
  });

  socket.on("disconnect", async () => {
    if (socket.data.user)
      io.to(`user=${socket.data.user.id}`).emit("user_visible_update", {
        id: socket.data.user.id,
        online: false,
      });
    socket.data.user = undefined;
    if (socket.data.vidChatOpen && socket.data.conversationSubjectUid) {
      const otherSocket = await getUserSocket(
        socket.data.conversationSubjectUid
      );
      if (otherSocket)
        io.to(otherSocket.id).emit("private_conversation_video_chat_user_left");
    }
    socket.data.vidChatOpen = false;
    socket.data.conversationSubjectUid = "";
    socket.rooms.forEach((room) => {
      if (room.startsWith("room="))
        io.to(room).emit(
          "room_video_chat_user_left",
          socket.data.user?.id as string
        );
    });
  });
});

import Posts from "./api/Posts.route";
import Users from "./api/Users.route";
import Chat from "./api/Chat.route";
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./socket-interfaces";
import getUserSocket from "./utils/getUserSocket";
import redisClient from "./utils/redis";
import UsersDAO from "./api/dao/Users.dao";

app.use("/api/posts", Posts);
app.use("/api/users", Users);
app.use("/api/chat", Chat);

app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "build", "index.html"));
});

const s3 = new AWS.S3();

server.listen(process.env.PORT || 80, () => {
  console.log(`Server listening on port ${process.env.PORT || 80}`);

  const deleteOldAccsInterval = setInterval(async () => {
    const keyVal = await redisClient.get("deleteAccountsCountdownList");
    let deleteAccountsCountdownList = [];
    if (keyVal) deleteAccountsCountdownList = JSON.parse(keyVal);
    let deletedIds: string[] = [];
    for await (const info of deleteAccountsCountdownList) {
      const deleteAt = new Date(info.deleteAt).getTime();
      if (Date.now() >= deleteAt) {
        await UsersDAO.deleteUser(info.id);
        deletedIds += info.id;
      }
    }
    await redisClient.set(
      "deleteAccountsCountdownList",
      JSON.stringify(
        deleteAccountsCountdownList.filter(
          (info: { id: string; deletedAt: string }) =>
            !deletedIds.includes(info.id)
        )
      )
    );
  }, 100000);

  const deleteOldMessagesRoomsAndPostsInterval = setInterval(async () => {
    const twentyMinutesAgo = new Date(Date.now() - 1200000);
    const roomMessages = await prisma.roomMessage.findMany({
      where: { createdAt: { lt: twentyMinutesAgo } },
    });
    const privateMessages = await prisma.privateMessage.findMany({
      where: { createdAt: { lt: twentyMinutesAgo } },
    });
    for await (const m of roomMessages) {
      if (m.hasAttachment)
        await new Promise<void>((resolve, reject) => {
          s3.deleteObject(
            {
              Key: `${process.env.NODE_ENV !== "production" ? "dev." : ""}${
                m.attachmentKey
              }`,
              Bucket: "prisma-socialmedia",
            },
            (err, _) => {
              if (err) reject(err);
              resolve();
            }
          );
        });
    }
    for await (const m of privateMessages) {
      if (m.hasAttachment)
        await new Promise<void>((resolve, reject) => {
          s3.deleteObject(
            {
              Key: `${process.env.NODE_ENV !== "production" ? "dev." : ""}${
                m.attachmentKey
              }`,
              Bucket: "prisma-socialmedia",
            },
            (err, _) => {
              if (err) reject(err);
              resolve();
            }
          );
        });
    }
    await prisma.roomMessage.deleteMany({
      where: { createdAt: { lt: twentyMinutesAgo } },
    });
    await prisma.privateMessage.deleteMany({
      where: { createdAt: { lt: twentyMinutesAgo } },
    });
    await prisma.room.deleteMany({
      where: {
        createdAt: { lt: twentyMinutesAgo },
        id: { notIn: globalThis.generatedRooms },
      },
    });
    await prisma.user.deleteMany({
      where: {
        createdAt: { lt: twentyMinutesAgo },
        id: { notIn: globalThis.generatedUsers },
      },
    });
    const postsToDelete = await prisma.post.findMany({
      where: {
        createdAt: { lt: twentyMinutesAgo },
        id: { notIn: globalThis.generatedPosts },
      },
    });
    await prisma.post.deleteMany({
      where: {
        id: { notIn: globalThis.generatedPosts },
        createdAt: { lt: twentyMinutesAgo },
      },
    });
    for await (const p of postsToDelete) {
      await new Promise<void>((resolve, reject) => {
        s3.deleteObject(
          {
            Key: `${process.env.NODE_ENV !== "production" ? "dev." : ""}${
              p.imageKey
            }`,
            Bucket: "prisma-socialmedia",
          },
          (err, _) => {
            if (err) reject(err);
            resolve();
          }
        );
      });
      await new Promise<void>((resolve, reject) => {
        s3.deleteObject(
          {
            Key: `${process.env.NODE_ENV !== "production" ? "dev." : ""}thumb.${
              p.imageKey
            }`,
            Bucket: "prisma-socialmedia",
          },
          (err, _) => {
            if (err) reject(err);
            resolve();
          }
        );
      });
    }
    await prisma.comment.deleteMany({
      where: { createdAt: { lt: twentyMinutesAgo, gt: seedGeneratedAt } },
    });
  }, 100000);
  return () => {
    clearInterval(deleteOldAccsInterval);
    clearInterval(deleteOldMessagesRoomsAndPostsInterval);
  };
});
