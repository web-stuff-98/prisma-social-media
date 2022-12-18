import prisma from "../../utils/prisma";
import { Request as Req, Response as Res } from "express";

import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";
import UsersDAO from "../dao/Users.dao";
import { io } from "../..";
import getUserSocket from "../../utils/getUserSocket";
import { bruteFail, bruteSuccess } from "../limiter/limiters";
import getReqIp from "../../utils/getReqIp";

export default class UsersController {
  static async getUsers(req: Req, res: Res) {
    try {
      const users = await UsersDAO.getUsers();
      res.status(200).json(users);
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async getUserById(req: Req, res: Res) {
    try {
      const user = await UsersDAO.getUserById(req.params.id);
      if (user) res.status(200).json(user);
      else res.status(404).json({ msg: "Not found" });
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async updateUser(req: Req, res: Res) {
    try {
      await UsersDAO.updateUser(String(req.user?.id), req.body);
      res.status(200).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async getProfile(req: Req, res: Res) {
    try {
      const profile = await UsersDAO.getProfile(req.params.uid, req.user?.id);
      res.status(200).json(profile);
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async updateProfile(req: Req, res: Res) {
    try {
      await UsersDAO.updateProfile(String(req.user?.id), req.body);
      res.status(200).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async register(req: Req, res: Res) {
    const { username, password } = req.body;
    const foundUser = await UsersDAO.getUserByName(username);
    if (foundUser) {
      return res
        .status(400)
        .json({ msg: "There is a user with that name already" })
        .end();
    }
    try {
      const user = await UsersDAO.createUser(username.trim(), password);
      res.cookie(
        "token",
        jwt.sign(
          JSON.stringify({ id: String(user?.id), name: user.name }),
          String(process.env.JWT_SECRET)
        ),
        {
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          sameSite: "strict",
          maxAge: 60 * 60 * 24,
        }
      );
      req.user = user;
      res.status(201).json(user).end();
    } catch (e) {
      res
        .status(400)
        .json({ msg: `${e}` })
        .end();
    }
  }

  static async login(req: Req, res: Res) {
    const { username, password } = req.body;
    let user;
    try {
      user = await prisma.user.findFirstOrThrow({
        where: { name: { equals: username, mode: "insensitive" } },
      });
    } catch (e) {
      res.status(404).json({ msg: "User does not exist" });
    }
    let compare;
    const ip = getReqIp(req);
    try {
      compare = await bcrypt.compare(password, user?.password!);
    } catch (error) {
      await bruteFail(ip, "login");
      return res.status(403).json({ msg: "Unauthorized" });
    }
    if (!compare) {
      await bruteFail(ip, "login");
      return res.status(403).json({ msg: "Incorrect credentials" });
    }
    await bruteSuccess(ip, "login");
    req.user = user;
    res.cookie(
      "token",
      jwt.sign(
        JSON.stringify({ id: String(user?.id), name: user?.name }),
        String(process.env.JWT_SECRET)
      ),
      {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 24,
      }
    );
    if (user)
      io.to(`user=${user.id}`).emit("user_visible_update", {
        id: user.id,
        online: true,
      });
    res.status(200).json(user).end();
  }

  static async logout(req: Req, res: Res) {
    if (req.user) {
      const socket = await getUserSocket(req.user.id);
      if (socket) {
        socket.data.user = {
          id: "",
          name: "",
          room: undefined,
        };
      }
      io.to(`user=${req.user?.id}`).emit("user_visible_update", {
        id: req.user.id,
        online: false,
      });
    }
    delete req.user;
    res.status(200).clearCookie("token", { path: "/", maxAge: 0 }).end();
  }

  static async checkLogin(req: Req, res: Res) {
    res.status(200).json(req.user).end();
  }
}
