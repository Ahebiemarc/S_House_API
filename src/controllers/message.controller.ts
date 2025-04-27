import { Request, Response } from "express";
import prisma from "../lib/prisma";
import CryptoJS from "crypto-js";




export const addMessage = async (req: Request, res: Response) => {
    try {
        const { text } = req.body;
        const {chatId} = req.params;
        const userId = req.userId;

        const chat = await prisma.chat.findUnique({
            where: {
              id: chatId,
              userIDs: {
                hasSome: [userId],
              },
            },
        });
      
        if (!chat) return res.status(404).json({ message: "Chat not found!" });
        
        // 🔒 Chiffrer le message
        const encryptedMessage = CryptoJS.AES.encrypt(text, process.env.MSG_SECRET_KEY).toString();

        const newMessage = await prisma.message.create({
            data: {
                chatId,
                senderId: userId,
                text: encryptedMessage,
            },
        });

        await prisma.chat.update({
            where: {
              id: chatId,
            },
            data: {
              seenBy: [userId],
              lastMessage: encryptedMessage,
            },
          });

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error creating message:", error);
        res.status(500).json({ message: "Failed to create message!" });
    }
};