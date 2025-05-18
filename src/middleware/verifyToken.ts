import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  // Cherche dans le cookie ou dans le header Authorization
  const token = req.cookies?.HAUS_AUTH ? req.cookies.HAUS_AUTH : req.headers.authorization.split(' ')[1];


  if (!token) {
    return res.status(401).json({ message: 'Not authenticated!' });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY as string, (err: any, payload: any) => {
    if (err) {
      return res.status(403).json({ message: 'Unauthorized!' });
    }

    req.userId = payload.id;
    req.isAdmin = payload.isAdmin;
    next();
  });
};
