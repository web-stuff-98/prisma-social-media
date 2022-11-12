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

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

import jwt from "jsonwebtoken";

io.on("connection", (socket) => {
  const rawCookie = socket.handshake.headers.cookie;
  if (rawCookie) {
    try {
      const decoded = jwt.verify(
        rawCookie.replace("token=", ""),
        String(process.env.JWT_SECRET)
      );
      socket.data.user = decoded as { id: string; name: string };
    } catch (e) {
      console.warn(
        "User trying to connect to socket with malformed token : " + e
      );
      socket.disconnect();
    }
  }

  socket.on("open_post", (slug) => {
    console.log("opened post")
    socket.join(slug)
  });
  socket.on("leave_post", (slug) => {
    console.log("left post")
    socket.leave(slug)
  });

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
});

import Posts from "./api/Posts.route";
import Users from "./api/Users.route";
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./socket-interfaces";
import MessengerDAO from "./api/dao/Messenger.dao";

app.use("/api/posts", Posts);
app.use("/api/users", Users);

server.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});
