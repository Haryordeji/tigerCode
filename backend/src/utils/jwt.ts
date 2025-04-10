import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';
import dotenv from 'dotenv';
dotenv.config();

interface UserPayload {
  id: string;
  email: string;
  role: string;
}

const JWT_OPTION: jwt.SignOptions = {
  expiresIn: '7d',
  algorithm: 'HS256'
};

const JWT_SECRET = process.env.JWT_SECRET;

if(!JWT_SECRET){
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export const generateToken = (user: IUser): string => {

  if(!user){
    throw new Error('User not found');
  }

  const payload: UserPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role
  };

  if (!payload){
    throw new Error('Invalid user payload');
  }

  return jwt.sign(payload, JWT_SECRET, JWT_OPTION);
};

export const verifyToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;
  } catch (error) {
    return null;
  }
};