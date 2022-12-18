import dotenv from "dotenv";
dotenv.config();

import seed from "./utils/seed";

import cors from "cors";
import express, { Express } from "express";
import cookieParser from "cookie-parser";
import http from "http";
import path from "path";

import { Server } from "socket.io";

const origin =
  process.env.NODE_ENV === "production" ? "https://prisma-social-media-js.herokuapp.com/" : "*";

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
  app.use(express.static(path.join(__dirname, "../..", "frontend", "build")));
  app.get("*", (_, res) => {
    res.sendFile(
      path.join(__dirname, "../..", "frontend", "build", "index.html")
    );
  });
  //seed();
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
    const otherUserSocket = await getUserSocket(payload.userToSignal);
    io.to(otherUserSocket?.id!).emit(
      "room_video_chat_user_joined",
      payload.signal,
      payload.callerSid,
      String(socket.data.user?.id)
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
          String(socket.data.user?.id)
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

server.listen(process.env.PORT || 80, () => {
  console.log(`Server listening on port ${process.env.PORT || 80}`);

  const deleteAccsInterval = setInterval(async () => {
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
  }, 10000);
  return () => {
    clearInterval(deleteAccsInterval);
  };
});
