import { Request, Response } from "express";
import bcrypt from "bcrypt";


export const register = async (req: Request, res: Response) => {
    const {username, email, password} = req.body;

    // hash password

    const hashedPassword = await bcrypt.hash(password, 10)

    // creaate and save new user to database
}

export const login = (req: Request, res: Response) => {
    // Code to authenticate a user goes here
    res.send('User logged in successfully');
    // Code to authenticate | db operations
}
export const logout = (req: Request, res: Response) =>{
    // Code to log out a user goes here
    res.send('User logged out successfully');
    // Code to log out | db operations
}
