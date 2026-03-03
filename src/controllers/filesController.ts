import type { Request, Response } from "express";
import { cloudinary } from "@/config/cloudinary.js";
import { upload } from "@/lib/multer.js";
import { prisma } from "@/lib/prisma.js";
import { getFileExtension } from "@/utils/helpers.js";

const getAllowedFileTypesForUpload = (): string => {
	const MS_WORD_FILE_TYPES = [
		".doc",
		".docx",
		".xml",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordpressingml.document",
	];

	const acceptedFileTypes = [
		"image/png",
		"image/jpg",
		".pdf",
		".txt",
		...MS_WORD_FILE_TYPES,
	];

	const fileTypeString = acceptedFileTypes.join(",");
	return fileTypeString;
};

export const filesGet = (_req: Request, res: Response) => {
	res.redirect("/");
};

export const fileDetailsGet = async (req: Request, res: Response) => {
	const { user } = req;
	if (!user) return res.status(401).redirect("/login");

	const { id: fileId } = req.params;
	const file = await prisma.file.findUnique({
		where: {
			id: Number(fileId),
			userId: user.id,
		},
	});

	if (file === null)
		return res.status(404).render("pages/error", {
			statusCode: 404,
			errorMessage:
				"Cannot find file. Please return to the previous page to see all files.",
		});

	res.render("pages/fileDetails", { title: file.name, file });
};

export const uploadFileGet = async (req: Request, res: Response) => {
	const { user } = req;
	if (!user) return res.status(401).redirect("/login");

	const { folder: folderIdToAddFile } = req.query;
	if (!folderIdToAddFile) return res.status(400).redirect("/folders"); // files cannot be folderless rn

	const folder = await prisma.folder.findUnique({
		where: {
			id: Number(folderIdToAddFile),
			userId: user.id,
		},
	});
	if (folder === null)
		return res.status(404).render("pages/error", {
			statusCode: 404,
			errorMessage:
				"Folder does not exist. Please only upload files to existing folders.",
		});

	res.render("pages/newFile", {
		title: "Upload new file",
		allowedFileTypes: getAllowedFileTypesForUpload(),
		folderIdToAddFile,
	});
};

export const uploadFilePost = [
	upload.single("file"),
	async (req: Request, res: Response) => {
		const { user, file: fileForUpload } = req;
		if (!user) return res.status(401).redirect("/login");
		if (!fileForUpload)
			throw new Error(
				"Issue with retrieving file that was just uploaded. Please try again.",
			);

		const { folder: folderIdToAddFile } = req.query;
		if (!folderIdToAddFile)
			return res.status(400).render("pages/error", {
				statusCode: 400,
				errorMessage: "You must add your file to an existing folder.",
			});

		try {
			const b64 = Buffer.from(fileForUpload.buffer).toString("base64");
			const dataUri = `data:${fileForUpload.mimetype};base64,${b64}`;
			const cloudinaryUploadResult = await cloudinary.uploader.upload(dataUri, {
				resource_type: "auto",
			});
			console.log("cloudinaryUploadResult:", cloudinaryUploadResult);
		} catch (err) {
			if (err instanceof Error) throw new Error(err.message);
			throw new Error(`Error when uploading file to cloud: ${err}`);
		}

		const {
			filename: filenameWithUniqueSuffix,
			originalname,
			size,
			path,
		} = fileForUpload;

		const fileWithSameOriginalName = await prisma.file.findMany({
			where: {
				name: originalname,
				userId: user.id,
				folderId: Number(folderIdToAddFile),
			},
		});
		const hasDuplicateOriginalFilenameInFolder =
			Array.isArray(fileWithSameOriginalName) &&
			fileWithSameOriginalName.length > 0;

		const newFile = await prisma.file.create({
			data: {
				name: hasDuplicateOriginalFilenameInFolder
					? filenameWithUniqueSuffix
					: originalname,
				sizeInKb: size,
				fileExtension: getFileExtension(fileForUpload),
				location: path,
				userId: user.id,
				folderId: Number(folderIdToAddFile),
			},
		});

		res.redirect(`/folders/${newFile.folderId}`);
	},
];

export const fileDelete = async (req: Request, res: Response) => {
	const { user } = req;
	if (!user) return res.status(401).redirect("/login");

	const { id: fileId } = req.params;

	const deleteFile = await prisma.file.delete({
		where: {
			id: Number(fileId),
			userId: user.id,
		},
	});

	res.redirect(`/folders/${deleteFile.folderId}`);
};
