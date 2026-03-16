import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';

const PASSWORD_ROUNDS = 12;

export const hashPassword = (value: string) => bcrypt.hash(value, PASSWORD_ROUNDS);
export const verifyPassword = (value: string, hash: string) => bcrypt.compare(value, hash);

export const hashOpaqueToken = (value: string) => createHash('sha256').update(value).digest('hex');

export const generateOpaqueToken = (size = 32) => randomBytes(size).toString('hex');

export const generateTemporaryPassword = () => {
  const chunk = randomBytes(6).toString('base64url');
  return `Sc!${chunk}9`;
};
