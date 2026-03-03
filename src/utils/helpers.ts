export const getFileExtension = (file: Express.Multer.File): `.${string}` => {
	const originalNameSplit = file.originalname.split(".");
	const fileExtension = originalNameSplit.pop();
	return `.${fileExtension}`;
};

export const generateUniqueFilename = (file: Express.Multer.File): string => {
	const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

	const originalNameSplit = file.originalname.split(".");
	const fileExtension = originalNameSplit.pop();
	const originalNameWithoutFileExtension = originalNameSplit.join("");

	return `${originalNameWithoutFileExtension} - ${uniqueSuffix}.${fileExtension}`;
};
