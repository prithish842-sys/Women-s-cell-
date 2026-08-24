import { Request, Response, NextFunction, RequestHandler } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import os from 'os';
import { Readable } from 'stream';
import { del, get, put } from '@vercel/blob';
import dotenv from 'dotenv';

dotenv.config();

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');
const TEMP_UPLOAD_ROOT = path.join(os.tmpdir(), 'singa-pen-portal-uploads');
const STORAGE_DRIVER = process.env.STORAGE_DRIVER || (process.env.NODE_ENV === 'production' ? 'vercel_blob' : 'local');
const isBlobStorage = STORAGE_DRIVER === 'vercel_blob';
const ACTIVE_UPLOAD_ROOT = isBlobStorage ? TEMP_UPLOAD_ROOT : UPLOAD_ROOT;

export const PUBLIC_UPLOAD_ROOT = UPLOAD_ROOT;
export const PRIVATE_UPLOAD_ROOT = path.join(UPLOAD_ROOT, 'private');
export const PRIVATE_ICC_UPLOAD_ROOT = path.join(PRIVATE_UPLOAD_ROOT, 'icc');
export const PRIVATE_REPORT_UPLOAD_ROOT = path.join(PRIVATE_UPLOAD_ROOT, 'reports');
export const storageDriver = STORAGE_DRIVER;

const uploadFolders = [
  'profiles',
  'skills',
  'gallery',
  'gallery/covers',
  'gallery/images',
  'achievements',
  'achievements/images',
  'achievements/certificates',
  'private/icc',
  'private/anonymous-concerns',
  'thumbnails',
  'private/reports',
];

for (const folder of uploadFolders) {
  fs.mkdirSync(path.join(ACTIVE_UPLOAD_ROOT, folder), { recursive: true });
}

const imageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const pdfMimeTypes = new Set(['application/pdf']);
const extensionByMime: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
};

function isAllowedExtension(file: Express.Multer.File, allowedMimeTypes: Set<string>) {
  const extension = path.extname(file.originalname).toLowerCase();
  return allowedMimeTypes.has(file.mimetype) && (extensionByMime[file.mimetype] || []).includes(extension);
}

function makeStorage(resolveFolder: (file: Express.Multer.File) => string) {
  return multer.diskStorage({
    destination: (_req, file, cb) => {
      const folder = resolveFolder(file);
      const destination = path.join(ACTIVE_UPLOAD_ROOT, folder);
      fs.mkdirSync(destination, { recursive: true });
      cb(null, destination);
    },
    filename: (_req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      cb(null, `${file.fieldname}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`);
    },
  });
}

function makeFilter(allowedMimeTypes: Set<string>) {
  return (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (isAllowedExtension(file, allowedMimeTypes)) {
      cb(null, true);
      return;
    }
    cb(new Error('Invalid file type or extension.'));
  };
}

function fileArrayFromRequest(req: Request) {
  const files: Express.Multer.File[] = [];
  if ((req as any).file) files.push((req as any).file);
  const requestFiles = (req as any).files;
  if (Array.isArray(requestFiles)) files.push(...requestFiles);
  else if (requestFiles && typeof requestFiles === 'object') {
    for (const value of Object.values(requestFiles)) {
      if (Array.isArray(value)) files.push(...value as Express.Multer.File[]);
    }
  }
  return files;
}

function removeUploadedFiles(files: Express.Multer.File[]) {
  for (const file of files) {
    if (file.path) fs.rmSync(file.path, { force: true });
  }
}

function relativeUploadPath(file: Express.Multer.File) {
  const relative = path.relative(ACTIVE_UPLOAD_ROOT, file.path).replace(/\\/g, '/');
  if (relative.startsWith('../') || relative === '..' || path.isAbsolute(relative)) {
    throw new Error('Uploaded file resolved outside the upload root.');
  }
  return relative;
}

function blobPathnameFor(file: Express.Multer.File) {
  const relative = relativeUploadPath(file);
  return relative.startsWith('private/') ? relative : `uploads/${relative}`;
}

function publicUrlForLocal(relativePath: string) {
  return `/uploads/${relativePath.replace(/^uploads\//, '')}`;
}

async function persistUploadedFiles(files: Express.Multer.File[]) {
  if (!isBlobStorage) return;
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    throw new Error('BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID is required when STORAGE_DRIVER=vercel_blob.');
  }

  for (const file of files) {
    const pathname = blobPathnameFor(file);
    const access = pathname.startsWith('private/') ? 'private' : 'public';
    const buffer = await fs.promises.readFile(file.path);
    const blob = await put(pathname, buffer, {
      access,
      contentType: file.mimetype,
      allowOverwrite: false,
    });
    (file as any).storageKey = blob.pathname;
    (file as any).storageUrl = access === 'public' ? blob.url : `/${blob.pathname}`;
    (file as any).storageAccess = access;
    fs.rmSync(file.path, { force: true });
  }
}

function hasSignature(buffer: Buffer, signature: number[]) {
  return signature.every((byte, index) => buffer[index] === byte);
}

export async function validateFileSignature(file: Pick<Express.Multer.File, 'path' | 'mimetype'>) {
  const buffer = await fs.promises.readFile(file.path);
  if (file.mimetype === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (file.mimetype === 'image/png') {
    return hasSignature(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }
  if (file.mimetype === 'image/webp') {
    return buffer.length >= 12
      && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
      && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  if (file.mimetype === 'application/pdf') {
    return buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }
  return false;
}

const validateUploadedFileSignatures: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const files = fileArrayFromRequest(req);
  try {
    for (const file of files) {
      if (!(await validateFileSignature(file))) {
        removeUploadedFiles(files);
        return res.status(400).json({ success: false, message: 'Invalid file content.' });
      }
    }
    await persistUploadedFiles(files);
    return next();
  } catch {
    removeUploadedFiles(files);
    return res.status(400).json({ success: false, message: 'File upload could not be stored.' });
  }
};

export function storedFileReference(file: Express.Multer.File, localPath: string) {
  return (file as any).storageUrl || localPath;
}

export async function deleteStoredFile(storedPath?: string | null) {
  if (!storedPath) return;
  if (isBlobStorage) {
    const pathname = storedPath.replace(/^https?:\/\/[^/]+\//i, '').replace(/^\//, '');
    await del(pathname);
    return;
  }
  const localRelativePath = storedPath.startsWith('/private/')
    ? path.join('uploads', storedPath.replace(/^\//, ''))
    : storedPath.startsWith('/uploads/')
      ? storedPath.replace(/^\//, '')
      : '';
  if (!localRelativePath) return;
  const filePath = path.join(process.cwd(), localRelativePath);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

function contentTypeForPath(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (['.jpg', '.jpeg'].includes(extension)) return 'image/jpeg';
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.pdf') return 'application/pdf';
  return 'application/octet-stream';
}

export async function sendPrivateStoredFile(
  res: Response,
  storedPath: string,
  options: { downloadName?: string; localRoot?: string } = {},
) {
  const filename = path.basename(options.downloadName || storedPath).replace(/"/g, '');
  if (isBlobStorage) {
    const pathname = storedPath.replace(/^\//, '');
    const blob = await get(pathname, { access: 'private', useCache: false });
    if (!blob || blob.statusCode !== 200) {
      res.status(404).json({ success: false, message: 'Attachment not found.' });
      return;
    }
    res.setHeader('Content-Type', blob.blob.contentType || contentTypeForPath(pathname));
    res.setHeader('Content-Length', String(blob.blob.size));
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    Readable.fromWeb(blob.stream as any).pipe(res);
    return;
  }

  const root = options.localRoot || PRIVATE_UPLOAD_ROOT;
  const filePath = path.join(root, path.basename(storedPath));
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ success: false, message: 'Attachment not found.' });
    return;
  }
  res.setHeader('Content-Type', contentTypeForPath(filePath));
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(filePath);
}

function secureUpload(upload: multer.Multer) {
  return {
    single: (fieldName: string) => [upload.single(fieldName), validateUploadedFileSignatures],
    array: (fieldName: string, maxCount?: number) => [upload.array(fieldName, maxCount), validateUploadedFileSignatures],
    fields: (fields: readonly multer.Field[]) => [upload.fields(fields), validateUploadedFileSignatures],
  };
}

const profileLimitMb = Number(process.env.PROFILE_IMAGE_MAX_SIZE_MB || 3);
const galleryLimitMb = Number(process.env.GALLERY_IMAGE_MAX_SIZE_MB || 8);
const achievementLimitMb = Number(process.env.ACHIEVEMENT_IMAGE_MAX_SIZE_MB || 5);
const certLimitMb = Number(process.env.CERTIFICATE_MAX_SIZE_MB || 10);

export const uploadProfile = secureUpload(multer({
  storage: makeStorage(() => 'profiles'),
  fileFilter: makeFilter(imageMimeTypes),
  limits: { fileSize: profileLimitMb * 1024 * 1024 },
}));

export const uploadSkillCertificate = secureUpload(multer({
  storage: makeStorage(() => 'skills'),
  fileFilter: makeFilter(pdfMimeTypes),
  limits: { fileSize: certLimitMb * 1024 * 1024 },
}));

export const uploadGallery = secureUpload(multer({
  storage: makeStorage((file) => (file.fieldname === 'cover' || file.fieldname === 'coverImage' ? 'gallery/covers' : 'gallery/images')),
  fileFilter: makeFilter(imageMimeTypes),
  limits: { fileSize: galleryLimitMb * 1024 * 1024 },
}));

export const uploadAchievementFiles = secureUpload(multer({
  storage: makeStorage((file) => (file.fieldname === 'certificate' ? 'achievements/certificates' : 'achievements/images')),
  fileFilter: (_req, file, cb) => {
    const allowed = file.fieldname === 'certificate' ? pdfMimeTypes : imageMimeTypes;
    if (isAllowedExtension(file, allowed)) {
      cb(null, true);
      return;
    }
    cb(new Error(file.fieldname === 'certificate' ? 'Only PDF certificate files are allowed.' : 'Only JPG, PNG, and WEBP images are allowed.'));
  },
  limits: { fileSize: Math.max(achievementLimitMb, certLimitMb) * 1024 * 1024 },
}));


export const uploadReportDocument = secureUpload(multer({
  storage: makeStorage(() => 'private/reports'),
  fileFilter: makeFilter(pdfMimeTypes),
  limits: { fileSize: certLimitMb * 1024 * 1024 },
}));

export const uploadCertificate = uploadAchievementFiles;
export const uploadIccAttachment = secureUpload(multer({
  storage: makeStorage(() => 'private/icc'),
  fileFilter: makeFilter(new Set([...imageMimeTypes, ...pdfMimeTypes])),
  limits: { fileSize: certLimitMb * 1024 * 1024 },
}));
export const uploadAnonymousConcernAttachment = secureUpload(multer({
  storage: makeStorage(() => 'private/anonymous-concerns'),
  fileFilter: makeFilter(new Set([...imageMimeTypes, ...pdfMimeTypes])),
  limits: { fileSize: certLimitMb * 1024 * 1024 },
}));
export const upload = secureUpload(multer({
  storage: makeStorage(() => 'uploads'),
  fileFilter: makeFilter(new Set([...imageMimeTypes, ...pdfMimeTypes])),
  limits: { fileSize: certLimitMb * 1024 * 1024 },
}));
