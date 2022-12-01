import express from "express";
import authMiddleware, { withUser } from "../utils/authMiddleware";
import UsersController from "./controllers/Users.controller";

import slowDown from "express-slow-down";
import { bruteRateLimit } from "./limiter/limiters";

const router = express.Router();

router.route("/").get(UsersController.getUsers);
router.route("/").post(
  slowDown({
    windowMs: 20000,
    delayAfter: 5,
    delayMs: 2000,
  }),
  authMiddleware,
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
router.route("/register").post(UsersController.register);
router.route("/check").post(withUser, UsersController.checkLogin);
router.route("/login").post(bruteRateLimit({
  routeName:"login",
  blockDuration: 21600000,
  failsRequired: 3,
}), UsersController.login);
router.route("/logout").post(withUser, UsersController.logout);

export default router;
