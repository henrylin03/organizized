export const generateUniqueFilename = (file: Express.Multer.File): string => {
	const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

	const originalNameSplit = file.originalname.split(".");
	const fileExtension = originalNameSplit.pop();
	const originalNameWithoutFileExtension = originalNameSplit.join("");

	return `${originalNameWithoutFileExtension} - ${uniqueSuffix}.${fileExtension}`;
};

export const getFileExtension = (file: Express.Multer.File): `.${string}` => {
	const originalNameSplit = file.originalname.split(".");
	const fileExtension = originalNameSplit.pop();
	return `.${fileExtension}`;
};

export const getCloudinaryDownloadLink = (
	cloudinarySecureUrl: string,
): string => {
	const ATTACHMENT_FLAG_REQUIRED_TO_DOWNLOAD_FILE = "fl_attachment";
	return cloudinarySecureUrl.replace(
		"/upload/",
		`/upload/${ATTACHMENT_FLAG_REQUIRED_TO_DOWNLOAD_FILE}/`,
	);
};
