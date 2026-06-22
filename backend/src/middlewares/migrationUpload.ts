import multer from 'multer';

export const migrationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(csv|xlsx|xls)$/i.test(file.originalname);
    if (!allowed) {
      cb(new Error('Only .csv, .xlsx, and .xls files are allowed'));
      return;
    }
    cb(null, true);
  },
});
