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

io.on("connection", (socket) => {
  const rawCookie = socket.handshake.headers.cookie;
  if (rawCookie) {
    try {
      socket.data.user = jwt.verify(
        rawCookie.replace("token=", ""),
        String(process.env.JWT_SECRET)
      ) as { id: string; name: string };
      socket.join(socket.data.user.id);
      socket.join(`inbox=${socket.data.user.id}`);
      io.to(socket.data.user.id).emit("user_subscription_update", {
        id: socket.data.user.id,
        online: true,
      });
      console.log("emit online");
    } catch (e) {
      console.warn(
        "User trying to connect to socket with malformed token : " + e
      );
      socket.disconnect();
    }
  } else {
    socket.data.user = undefined;
  }

  socket.on("subscribe_to_user", (uid) => {
    console.log("sub");
    socket.join(uid);
  });
  socket.on("unsubscribe_to_user", (uid) => socket.leave(uid));

  socket.on("open_post", (slug) => socket.join(slug));
  socket.on("leave_post", (slug) => socket.leave(slug));

  socket.on("private_message", async (message, recipientId, hasAttachment) => {
    try {
      await MessengerDAO.sendMessage(
        message,
        hasAttachment,
        recipientId,
        String(socket.data.user?.id)
      );
    } catch (e) {
      socket.emit("private_message_error", String(e));
    }
  });
  socket.on("private_message_update", async (id, message) => {
    try {
      await MessengerDAO.updateMessage(
        id,
        message,
        String(socket.data.user?.id)
      );
    } catch (e) {
      socket.emit("private_message_error", String(e));
    }
  });
  socket.on("private_message_delete", async (id) => {
    try {
      await MessengerDAO.deleteMessage(id, String(socket.data.user?.id));
    } catch (e) {
      socket.emit("private_message_error", String(e));
    }
  });

  socket.on("disconnect", () => {
    if (socket.data.user)
      io.to(socket.data.user.id).emit("user_subscription_update", {
        id: socket.data.user.id,
        online: false,
      });
  });
});

import Posts from "./api/Posts.route";
import Users from "./api/Users.route";
import Messenger from "./api/Messenger.route";
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./socket-interfaces";
import MessengerDAO from "./api/dao/Messenger.dao";

app.use("/api/posts", Posts);
app.use("/api/users", Users);
app.use("/api/messenger", Messenger);

server.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});
