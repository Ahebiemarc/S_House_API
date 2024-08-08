import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";


export const register = async (req: Request, res: Response) => {
    const {username, email, password} = req.body;

   try {
    // hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // create and save new user to database
    const newUser = await prisma.user.create({
        data: {
            username,
            email,
            password: hashedPassword
        }
    });

    res.status(201).json({message: 'User created successfully'});
    console.log(newUser);
   } catch (error) {
    console.log(error);
    res.status(500).json({message: 'Failed to create user!'});

   }
}

export const login = (req: Request, res: Response) => {
    // Code to authenticate | db operations
    const {username, password} = req.body

    try {
        // check if the user exists

        // check if the the password is valid

        // generate a cookie token for the user
    } catch (error) {
        console.log(error);
        res.status(500).json({message: 'Failed to authenticate user!'});
        
    }
}
export const logout = (req: Request, res: Response) =>{
    // Code to log out a user goes here
    res.send('User logged out successfully');
    // Code to log out | db operations
}
