import { Router } from "express";
import {
	loginGet,
	loginPost,
	signupGet,
	signupPost,
	usernameCheckGet,
} from "@/controllers/authController.js";

const authRouter = Router();

authRouter.get("/signup", signupGet);
authRouter.post("/signup", ...signupPost);

authRouter.get("/login", loginGet);
authRouter.post("/username-check", usernameCheckGet);
authRouter.post("/login", loginPost);

export { authRouter };
