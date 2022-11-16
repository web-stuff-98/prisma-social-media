import prisma from "../../utils/prisma";
import { Request as Req, Response as Res } from "express";

import * as Yup from "yup";
import YupPassword from "yup-password";
YupPassword(Yup);

import jwt from "jsonwebtoken";
import UsersDAO from "../dao/Users.dao";
import { io } from "../..";

const loginValidateSchema = Yup.object().shape({
  username: Yup.string().required().max(100),
  password: Yup.string().password().required(),
});

export default class UsersController {
  static async getUsers(req: Req, res: Res) {
    try {
      const users = await UsersDAO.getUsers();
      res.status(200).json(users);
    } catch (e) {
      res.status(500).json({ msg: "Internal error" });
    }
  }

  static async getUserById(req: Req, res: Res) {
    try {
      const user = await UsersDAO.getUserById(req.params.id);
      if (user) res.status(200).json(user);
      else res.status(404).json({ msg: "Not found" });
    } catch (error) {
      res.status(500).json({ msg: "Internal error" });
    }
  }

  static async updateUser(req: Req, res: Res) {
    try {
      await UsersDAO.updateUser(String(req.user?.id), req.body);
      res.status(200).end();
    } catch (error) {
      res.status(500).json({ msg: "Internal error" });
    }
  }

  static async register(req: Req, res: Res) {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ msg: "You cannot provide an empty input" });
    }
    try {
      await loginValidateSchema.strict().validate(req.body);
    } catch (e) {
      return res
        .status(400)
        .json({ msg: `${e}`.replace("ValidationError: ", "") })
        .end();
    }
    const foundUser = await UsersDAO.getUserByName(username);
    if (foundUser) {
      return res
        .status(400)
        .json({ msg: "There is a user with that name already" })
        .end();
    }
    try {
      const user = await UsersDAO.createUser(username, password);
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
        }
      );
      req.user = user;
      res.status(201).json(user).end();
    } catch (e) {
      res.status(500).json({ msg: "Internal error" }).end();
    }
  }

  static async login(req: Req, res: Res) {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ msg: "You cannot provide an empty input" });
    }
    try {
      await loginValidateSchema.strict().validate(req.body);
    } catch (e) {
      return res
        .status(400)
        .json({ msg: `${e}`.replace("ValidationError: ", "") })
        .end();
    }
    let user;
    try {
      user = await UsersDAO.getUserByName(username);
    } catch (e) {
      res.status(404).json({ msg: "User does not exist" });
    }
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
      }
    );
    if (user)
      io.to(user.id).emit("user_subscription_update", {
        id: user.id,
        online: true,
      });
    res.status(200).json(user).end();
  }

  static async logout(req: Req, res: Res) {
    if (req.user)
      io.to(req.user?.id).emit("user_subscription_update", {
        id: req.user.id,
        online: false,
      });
    res.clearCookie("token").status(200).end();
  }

  static async checkLogin(req: Req, res: Res) {
    res.status(200).json(req.user).end();
  }
}