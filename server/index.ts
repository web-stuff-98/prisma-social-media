import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express, { Express } from "express";
import cookieParser from "cookie-parser";
import http from "http";

import { Server } from "socket.io";

const app: Express = express();
const server = http.createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

export { io };

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import jwt from "jsonwebtoken";

const socketAuthMiddleware = async (socket: any, next: any) => {
  await socketAuth(socket);
  next();
};

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

io.use(socketAuthMiddleware);

io.on("connection", async (socket) => {
  await socketAuth(socket);
  socket.on("auth", async () => {
    await socketAuth(socket);
  });

  socket.on("user_visible", (uid) => socket.join(`user=${uid}`));
  socket.on("user_not_visible", (uid) => socket.leave(`user=${uid}`));

  socket.on("open_post_comments", (slug) => socket.join(slug));
  socket.on("leave_post_comments", (slug) => socket.leave(slug));

  socket.on("room_video_chat_sending_signal", (payload) => {
    io.to(payload.userToSignal).emit(
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

  socket.on("disconnect", () => {
    if (socket.data.user)
      io.to(`user=${socket.data.user.id}`).emit("user_visible_update", {
        id: socket.data.user.id,
        online: false,
      });
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

app.use("/api/posts", Posts);
app.use("/api/users", Users);
app.use("/api/chat", Chat);

server.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});
