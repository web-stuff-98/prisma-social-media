import express from "express";
import { withUser } from "../utils/authMiddleware";
import UsersController from "./controllers/Users.controller";
const router = express.Router();

router.route("/").get(UsersController.getUsers);
router.route("/:id").get(UsersController.getUserById);
router.route("/register").post(UsersController.register);
router.route("/check").post(withUser, UsersController.checkLogin)
router.route("/login").post(UsersController.login);
router.route("/logout").post(withUser, UsersController.logout);

export default router