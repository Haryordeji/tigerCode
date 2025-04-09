import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { IUser } from '../models/User';

interface UserPayload {
  id: string;
  email: string;
  role: string;
}

export const generateToken = (user: IUser): string => {
  const payload: UserPayload = {
    id: user._id.toString(),  // Convert ObjectId to string
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
};

export const verifyToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as UserPayload;
  } catch (error) {
    return null;
  }
};