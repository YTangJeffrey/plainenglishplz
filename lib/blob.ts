import { put } from '@vercel/blob';

const token = process.env.BLOB_READ_WRITE_TOKEN;

const extensionFromMime = (mimeType: string) => {
  const [, subtype] = mimeType.split('/') as [string, string | undefined];
  if (!subtype) {
    return 'bin';
  }

  if (subtype.includes('jpeg')) {
    return 'jpg';
  }

  return subtype;
};

export const uploadDataUrlToBlob = async (dataUrl: string, keyPrefix: string) => {
  if (!token) {
    return null;
  }

  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) {
    return null;
  }

  const [, mimeType, base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  const blob = new Blob([buffer], { type: mimeType || 'application/octet-stream' });

  const ext = extensionFromMime(mimeType || 'application/octet-stream');
  const objectKey = `${keyPrefix}/${Date.now()}.${ext}`;

  try {
    const { url } = await put(objectKey, blob, { access: 'public', token });
    return url;
  } catch (error) {
    console.error('[blob] Failed to upload image', error);
    return null;
  }
};
