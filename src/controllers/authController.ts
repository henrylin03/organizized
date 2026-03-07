import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { matchedData, validationResult } from "express-validator";
import { passport } from "@/config/passport.js";
import { prisma } from "@/lib/prisma.js";
import { validateSignUpForm } from "@/validators/validateSignUp.js";

const PAGE_TITLES = {
	login: "Log in",
	signup: "Sign up for free",
};

const LOGIN_ERROR_MESSAGES = {
	username: "Sorry, we couldn't find an account with that username.",
	password: "Sorry, that password isn't right. Please try again.",
} as const;
type LoginField = keyof typeof LOGIN_ERROR_MESSAGES;

const loginGet = async (req: Request, res: Response) => {
	if (req.user) return res.redirect("/");

	if (
		typeof req.session.messages === "undefined" ||
		!req.session.messages.length
	)
		return res.render("pages/auth/login", { title: PAGE_TITLES.login });

	const loginFieldWithError: LoginField = req.session.messages.at(-1);
	req.session.messages.length = 0; // clear array

	res.render("pages/auth/login", {
		title: PAGE_TITLES.login,
		error: LOGIN_ERROR_MESSAGES[loginFieldWithError],
	});
};

const loginPost = passport.authenticate("local", {
	successRedirect: "/",
	failureRedirect: "/login",
	failureMessage: true,
});

const signupGet = async (req: Request, res: Response) => {
	if (req.user) return res.redirect("/");
	res.render("pages/auth/signup", { title: PAGE_TITLES.signup });
};

const signupPost = [
	validateSignUpForm,
	async (req: Request, res: Response) => {
		const formData = matchedData(req, {
			onlyValidData: false,
		});
		const { firstName, lastName, email } = formData;

		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).render("pages/auth/signup", {
				title: PAGE_TITLES.signup,
				errors: errors.array(),
				firstName,
				lastName,
				email,
			});

		const { password } = formData;
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		await prisma.user.create({
			data: {
				firstName,
				lastName,
				username: email,
				password: hashedPassword,
			},
		});

		res.redirect("/");
	},
];

export { loginGet, loginPost, signupGet, signupPost };
