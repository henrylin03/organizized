import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { cloudinary } from "@/config/cloudinary.js";
import { multerUpload } from "@/lib/multer.js";
import { prisma } from "@/lib/prisma.js";
import {
	generateUniqueFilename,
	getCloudinaryDownloadLink,
	getFileExtension,
} from "@/utils/helpers.js";

const ALLOWED_MIMETYPES_FOR_UPLOAD = [
	"image/jpg",
	"image/png",
	"image/jpeg",
	"application/pdf",
];

const MAX_FILESIZE_FOR_UPLOAD_IN_KB = 2 * 1024 * 1024; // 2MB

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

	res.render("pages/fileDetails", { title: file.displayName, file });
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
		allowedFileTypes: ALLOWED_MIMETYPES_FOR_UPLOAD,
		folderIdToAddFile,
	});
};

export const uploadFilePost = [
	(req: Request, res: Response, next: NextFunction) => {
		const upload = multerUpload.single("file");
		upload(req, res, (err) => {
			if (err instanceof MulterError)
				return res.status(400).render("pages/newFile", { error: err.message });
			if (err) return res.status(400).render("pages/newFile", { error: err });
			next();
		});
	},
	async (req: Request, res: Response) => {
		const { user, file: fileForUpload } = req;
		if (!user) return res.status(401).redirect("/login");
		if (!fileForUpload)
			throw new Error(
				"Issue with retrieving file that was just uploaded. Please try again.",
			);

		if (
			!ALLOWED_MIMETYPES_FOR_UPLOAD.includes(fileForUpload.mimetype) ||
			fileForUpload.size > MAX_FILESIZE_FOR_UPLOAD_IN_KB
		)
			return res.status(400).render("pages/error", {
				statusCode: 400,
				errorMessage:
					"Only PDFs and image files (jpg, png) less than 2MB can be uploaded.",
			});

		const { folder: folderIdToAddFile } = req.query;
		if (!folderIdToAddFile)
			return res.status(400).render("pages/error", {
				statusCode: 400,
				errorMessage: "You must add your file to an existing folder.",
			});

		let cloudinaryUploadResult = null;
		const uniqueDisplayName = generateUniqueFilename(fileForUpload);
		try {
			const b64 = Buffer.from(fileForUpload.buffer).toString("base64");
			const dataUri = `data:${fileForUpload.mimetype};base64,${b64}`;
			cloudinaryUploadResult = await cloudinary.uploader.upload(dataUri, {
				resource_type: "auto",
				public_id: uniqueDisplayName,
				asset_folder: `user-${user.id}`,
			});
		} catch (err) {
			console.error(err);
			if (err instanceof Error) throw new Error(err.message);
			throw new Error(`Error when uploading file to cloud: ${err}`);
		}

		const filesWithSameOriginalNameInFolder = await prisma.file.findMany({
			where: {
				displayName: fileForUpload.originalname,
				userId: user.id,
				folderId: Number(folderIdToAddFile),
			},
		});
		const hasDuplicateOriginalFilenameInFolder =
			filesWithSameOriginalNameInFolder.length;

		const newFile = await prisma.file.create({
			data: {
				name: uniqueDisplayName,
				displayName: hasDuplicateOriginalFilenameInFolder
					? uniqueDisplayName
					: fileForUpload.originalname,
				sizeInKb: fileForUpload.size,
				downloadUrl: getCloudinaryDownloadLink(
					cloudinaryUploadResult.secure_url,
				),
				userId: user.id,
				folderId: Number(folderIdToAddFile),
				fileExtension: cloudinaryUploadResult.format
					? `.${cloudinaryUploadResult.format}`
					: getFileExtension(fileForUpload),
				uploadedAt: cloudinaryUploadResult.created_at,
			},
		});
		res.redirect(`/folders/${newFile.folderId}`);
	},
];

export const fileDelete = async (req: Request, res: Response) => {
	const { user } = req;
	if (!user) return res.status(401).redirect("/login");

	const { id: fileId } = req.params;

	const file = await prisma.file.findUnique({
		where: { id: Number(fileId) },
	});
	if (!file)
		return res.status(404).render("pages/error", {
			statusCode: 404,
			errorMessage: "File has already been deleted.",
		});

	const _deleteFile = await prisma.file.delete({
		where: {
			id: file.id,
			userId: user.id,
		},
	});

	let cloudinaryDeleteResult = null;
	try {
		cloudinaryDeleteResult = await cloudinary.uploader.destroy(file.name);
	} catch (err) {
		console.error(err);
		if (err instanceof Error) throw new Error(err.message);
		throw new Error(`Error when deleting file from cloud: ${err}`);
	}

	if (cloudinaryDeleteResult.result === "ok")
		res.redirect(`/folders/${file.folderId}`);
	else
		res.status(404).render("pages/error", {
			statusCode: 404,
			errorMessage:
				"An error occurred when trying to delete that file from the cloud. It's possible that the file has already been deleted. Please refresh the folder.",
		});
};
