import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { matchedData, validationResult } from "express-validator";
import { passport } from "@/config/passport.js";
import { prisma } from "@/lib/prisma.js";
import { validateSignUpForm } from "@/validators/validateSignUp.js";

const loginGet = async (req: Request, res: Response) => {
	if (req.user) return res.redirect("/");

	const { session } = req;
	if (!session.messages || !session.messages.length)
		return res.render("pages/auth/login", { title: "Log in" });

	const loginErrorMessage = session.messages.at(-1);
	res.render("pages/auth/login", { title: "Log in", error: loginErrorMessage });
};

const loginPost = passport.authenticate("local", {
	successRedirect: "/",
	failureRedirect: "/login",
	failureMessage: true,
});

const signupGet = async (req: Request, res: Response) => {
	if (req.user) return res.redirect("/");
	res.render("pages/auth/signup", { title: "Sign up" });
};

const signupPost = [
	validateSignUpForm,
	async (req: Request, res: Response) => {
		const formData = matchedData(req, {
			onlyValidData: false,
		});
		const { firstName, lastName, username } = formData;

		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).render("pages/auth/signup", {
				errors: errors.array(),
				firstName,
				lastName,
				username,
			});

		const { password } = formData;
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		await prisma.user.create({
			data: {
				firstName,
				lastName,
				username,
				password: hashedPassword,
			},
		});

		res.redirect("/");
	},
];

const usernameCheckGet = (req: Request, res: Response) => {
	// check if username exists within database
	// if yes, render proper login page [might need to separate the two pages]
	// if no, then render sign up page
};

export { loginGet, loginPost, signupGet, signupPost, usernameCheckGet };
