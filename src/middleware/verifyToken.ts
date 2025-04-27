import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';



export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.HAUS_AUTH;
    if (!token) {
        return res.status(401).json({ message: "Not authenticated!" });
    }

    // Verify the token here
    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err:any, payload:any) =>{
        if (err) {
            return res.status(403).json({ message: "Unauthorized!" });
        }
        
        req.userId = payload.id;
        req.isAdmin = payload.isAdmin;
        next();
    });
}