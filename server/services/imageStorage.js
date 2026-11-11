import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const uploadDirectory = fileURLToPath(new URL('../uploads/', import.meta.url));

function detectImageExtension(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return '.png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return '.jpg';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return '.webp';
  return null;
}

export async function saveImage(buffer) {
  const extension = detectImageExtension(buffer);
  if (!extension) {
    const error = new Error('The uploaded file is not a supported image');
    error.status = 400;
    throw error;
  }
  await mkdir(uploadDirectory, { recursive: true });
  const filename = `${randomUUID()}${extension}`;
  await writeFile(path.join(uploadDirectory, filename), buffer, { flag: 'wx' });
  return filename;
}

export async function deleteImage(filename) {
  await unlink(path.join(uploadDirectory, filename));
}

export function getImagePath(filename) {
  if (!/^[\da-f-]{36}\.(png|jpg|webp)$/.test(filename)) return null;
  return path.join(uploadDirectory, filename);
}
