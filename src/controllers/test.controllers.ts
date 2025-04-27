import { Request, Response } from "express";
import jwt from "jsonwebtoken";



export const shouldBeLoggedIn = (req: Request, res: Response) =>{

    const token = req.cookies.HAUS_AUTH;
    if (!token) {
        return res.status(401).json({ message: "Not authenticated!" });
    }

    // Verify the token here
    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err:any, payload:any) =>{
        if (err) {
            return res.status(403).json({ message: "Unauthorized!" });
        }
        res.json({ message: "You are authenticated" });
    });  

};


export const shouldBeAdmin = (req: Request, res: Response) =>{
    const token = req.cookies.HAUS_AUTH;
    if (!token) {
        return res.status(401).json({ message: "Not authenticated!" });
    }

    // Verify the token here
    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err:any, payload:any) =>{
        if (err) {
            return res.status(403).json({ message: "Token is invalid !" });
        }
        if(!payload.isAdmin){
            return res.status(403).json({ message: "Unauthorized!" });
        }
        res.json({ message: "You are authenticated" });
    }); 
};