import { NextFunction, Request, Response } from 'express';
import prisma from '../lib/prisma';




// Middleware to check if user is an admin
export const isAdmin = async (req:Request, res: Response, next: NextFunction) => {
    
    const tokenUserId = req.userId; // Assuming user info is attached to request
    const tokenIsAdmin = req.isAdmin;
    const user = await prisma.user.findUnique({
      where: { id: tokenUserId },
    });
  
    if (user?.isAdmin && tokenIsAdmin) {
      return next();
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }
  };