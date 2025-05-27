//controllers/message.controller.ts


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


// UPDATE MESSAGE
export const updateMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    const message = await prisma.message.findUnique({ where: { id } });

    if (!message) return res.status(404).json({ message: "Message not found!" });

    if (message.senderId !== userId) {
      return res.status(403).json({ message: "You are not the sender of this message!" });
    }

    const encryptedText = CryptoJS.AES.encrypt(text, process.env.MSG_SECRET_KEY).toString();

    const updated = await prisma.message.update({
      where: { id },
      data: { text: encryptedText },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error("Update Message Error:", error);
    res.status(500).json({ message: "Failed to update message!" });
  }
};

// DELETE MESSAGE
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const message = await prisma.message.findUnique({ where: { id } });

    if (!message) return res.status(404).json({ message: "Message not found!" });

    if (message.senderId !== userId) {
      return res.status(403).json({ message: "You are not authorized to delete this message!" });
    }

    await prisma.message.delete({ where: { id } });

    res.status(200).json({ message: "Message deleted successfully!" });
  } catch (error) {
    console.error("Delete Message Error:", error);
    res.status(500).json({ message: "Failed to delete message!" });
  }
};