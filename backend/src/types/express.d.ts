import { IUser } from '../models/User';
import {Request} from 'express';


declare global {
  namespace Express {
    interface User extends IUser {}

    export interface Request {
      user: IUser;
    }
  }
}