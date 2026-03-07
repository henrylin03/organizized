import { body } from "express-validator";
import { prisma } from "../lib/prisma.js";

const ALPHA_ERROR = "must only contain letters.";

export const validateSignUpForm = [
	body("firstName")
		.trim()
		.isAlpha("en-AU", { ignore: "-" })
		.withMessage(`First name ${ALPHA_ERROR}`)
		.isLength({ min: 2, max: 50 })
		.withMessage("First name must be between 2 and 50 characters"),

	body("lastName")
		.trim()
		.isAlpha("en-AU", { ignore: "-" })
		.withMessage(`Last name ${ALPHA_ERROR}`)
		.isLength({ min: 2, max: 64 })
		.withMessage("Last name must be between 2 and 64 characters"),

	body("email")
		.trim()
		.notEmpty()
		.withMessage("Please enter your email address.")
		.isEmail()
		.withMessage("Please enter a valid email address")
		.isLength({ max: 256 })
		.withMessage("Please enter an email address that is ≤ 256 characters")
		.custom(async (inputtedUsername: string) => {
			const user = await prisma.user.findUnique({
				where: { username: inputtedUsername },
			});
			if (user)
				throw new Error("Username is already in use. Please log in instead.");
		}),

	body("password")
		.notEmpty()
		.withMessage("Please set a password")
		.isLength({ min: 8, max: 64 })
		.withMessage("Password must be between 8 and 64 characters"),
];
