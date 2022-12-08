import express from "express";
import authMiddleware, { withUser } from "../utils/authMiddleware";
import UsersController from "./controllers/Users.controller";

import slowDown from "express-slow-down";
import { bruteRateLimit } from "./limiter/limiters";
import validateBodyMiddleware from "../utils/validateBodyMiddleware";

import * as Yup from "yup";
import YupPassword from "yup-password";
YupPassword(Yup);

const router = express.Router();

router.route("/").get(UsersController.getUsers);
router.route("/").post(
  authMiddleware,
  slowDown({
    windowMs: 20000,
    delayAfter: 5,
    delayMs: 2000,
  }),
  validateBodyMiddleware({
    name: Yup.string().notRequired().nullable().max(24),
    pfp: Yup.string().notRequired().nullable().max(100000),
  }),
  UsersController.updateUser
);
router.route("/:id").get(
  slowDown({
    windowMs: 10000,
    delayAfter: 50,
    delayMs: 5000,
  }),
  UsersController.getUserById
);
router.route("/register").post(
  validateBodyMiddleware({
    name: Yup.string().required().max(24),
    password: Yup.string().password().required().max(100),
  }),
  UsersController.register
);
router.route("/profile/:uid").get(withUser, UsersController.getProfile);
router.route("/profile").put(
  authMiddleware,
  validateBodyMiddleware({
    bio: Yup.string().notRequired().nullable().max(300),
    backgroundBase64: Yup.string().notRequired().nullable().max(100000),
  }),
  UsersController.updateProfile
);
router.route("/check").post(withUser, UsersController.checkLogin);
router.route("/login").post(
  bruteRateLimit({
    routeName: "login",
    blockDuration: 21600000,
    failsRequired: 3,
    msg: "You have made too many attempts. You will get 3 more attempts after BLOCKDURATION.",
  }),
  validateBodyMiddleware({
    username: Yup.string().required().max(24),
    password: Yup.string().required().max(100),
  }),
  UsersController.login
);
router.route("/logout").post(withUser, UsersController.logout);

export default router;
