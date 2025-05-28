//controllers/chat.controller.ts
import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { decryptMessage } from "../utils/decryptMessage";
import { ChatWithReceiverAndSender } from "../types/chat.types";


export const getChats = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        const chats: ChatWithReceiverAndSender[] = await prisma.chat.findMany({
            orderBy: { createdAt: 'desc' },
            where: {
                userIDs: {
                    hasSome: [userId],
                },
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        const chatWithDecryptedMessages = [];

        for (const chat of chats) {
            const receiverId = chat.userIDs.find((id) => id !== userId);

            const receiver = await prisma.user.findUnique({
                where: { id: receiverId },
                select: {
                    id: true,
                    username: true,
                    avatar: true,
                },
            });

            chat.receiver = receiver;

            const decryptedMessages = chat.messages.map((message) => ({
                ...message,
                text: decryptMessage(message.text) ?? '[Message illisible]',
            }));

            const decryptedLastMessage = chat.messages?.[0]?.text
                ? decryptMessage(chat.messages[0].text) ?? '[Message illisible]'
                : null;

            chatWithDecryptedMessages.push({
                ...chat,
                messages: decryptedMessages,
                lastMessage: decryptedLastMessage,
            });
        }

        res.status(200).json(chatWithDecryptedMessages);
    } catch (error) {
        console.error("Error fetching chat:", error);
        res.status(500).json({ message: "Failed to fetch chat!" });
    }
};



export const getChat = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const chatId = req.params.id;

        // 🔍 Récupérer le chat avec les messages
        const chat : ChatWithReceiverAndSender = await prisma.chat.findUnique({
            where: { 
                id: chatId,
                userIDs: { hasSome: [userId] }
            },
            include: { 
                messages: {
                    orderBy: { createdAt: 'desc' }
                },
            },
        });

        const receiverId = chat.userIDs.find((id) => id !== userId);
      
            const receiver = await prisma.user.findUnique({
              where: {
                id: receiverId,
              },
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            });
            chat.receiver = receiver;


        // 🔓 Déchiffrer chaque message
        const decryptedMessages = chat.messages.map((message) => ({
            ...message,
            text: decryptMessage(message.text) ?? '[Message illisible]',
        }));
        
        // 🔓 Déchiffrer le dernier message
        const decryptedLastMessage = chat.lastMessage
            ? decryptMessage(chat.lastMessage) ?? '[Message illisible]'
            : null;

        // 📌 Mettre à jour le chat avec les messages déchiffrés
        const chatWithDecryptedMessages = { ...chat, messages: decryptedMessages, lastMessage: decryptedLastMessage };

        // ✅ Marquer le chat comme vu
        await prisma.chat.update({
            where: { id: chatId },
            data: { seenBy: { set: [userId] } },
        });

        res.status(200).json(chatWithDecryptedMessages);

    } catch (error) {
        console.error("Error fetching chat:", error);
        res.status(500).json({ message: "Failed to fetch chat!" });
    }
};


export const addChat = async (req: Request, res: Response) =>{
    try {
        const userId = req.userId;
        const { recipientId } = req.body;

        const existingChat = await prisma.chat.findFirst({
            where: {
              userIDs: { hasEvery: [userId, recipientId] },
            },
          });
          
        if (existingChat){
            res.status(200).json(existingChat);
            return;
        }
        // Check if the recipient exists
        const userRecipient = await prisma.user.findUnique({
            where:{id : recipientId}
        }) 

        if(!userRecipient){
            res.status(403).json({ message: "recipientId does'nt exist!" });

        }


        const newChat = await prisma.chat.create({
            data: {
                userIDs: [ userId, recipientId],
            },
        });
        res.status(201).json(newChat);
        // TODO: Handle chat read status
        // TODO: Handle unread messages
    } catch (error) {
        console.error("Error creating chat:", error);
        res.status(500).json({ message: "Failed to create chat!" });
    }
}


export const readChat = async (req: Request, res: Response) =>{
    try {
        const userId = req.userId;
        const chatId = req.params.id
        const chat = await prisma.chat.update({
            where: { 
                id: chatId,
                userIDs: {hasSome: [userId]} 
            },
            data: {
                seenBy: {set: [userId]},
            },        
        });

        await prisma.chat.update({
            where: {id: chatId},
            data: {
              seenBy: {set: [userId]},
            },
        });

        res.status(200).json(chat);
        // TODO: Handle unread messages
    } catch (error) {
        console.error("Error fetching chat:", error);
        res.status(500).json({ message: "Failed to fetch chat!" });
    
    
    }
}