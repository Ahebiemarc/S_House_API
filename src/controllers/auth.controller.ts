import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";



export const register = async (req: Request, res: Response) => {

   try {
    const {username, email, password} = req.body;

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // create and save new user to database
    const newUser = await prisma.user.create({
        data: {
            username: username,
            email: email,
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

export const login = async (req: Request, res: Response) => {
    // Code to authenticate | db operations

    try {
        const {username, password} = req.body

        console.log(username, password);
        

        // check if the user exists

        const user = await prisma.user.findUnique({where: {username: username}});

        if (!user) return res.status(401).json({message: 'User not found!'});

        // check if the the password is valid

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) return res.status(401).json({message: 'Invalid password!'});

        // generate a cookie token for the user
        
        //res.setHeader('Set-Cookie', "test=" + "myVAlue").json({message: "success"});

        const age = 1000 * 60 * 60 * 24 * 7; // a one week

        const token = jwt.sign({id: user.id, isAdmin: user.isAdmin}, process.env.JWT_SECRET_KEY, {expiresIn: age});

        const {password: userPassword, isAdmin, ...userInfo} = user;

        res.cookie('HAUS_AUTH', token, 
            {
                httpOnly: true,
                //secure: true, // that's production
                maxAge:age
            }).status(200).json({message: "authentication successful!", token, user: userInfo});

    } catch (error) {
        console.log(error);
        res.status(500).json({message: 'Failed to authenticate user!'});
        
    }
}
export const logout = (req: Request, res: Response) =>{
    // Code to log out a user goes here
    res.clearCookie("HAUS_AUTH").status(200).json({message: "Logout successful"})
}
