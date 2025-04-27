import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { decryptMessage } from "../utils/decryptMessage";
import { ChatWithReceiverAndSender } from "../types/chat.types";


export const getChats = async (req: Request, res: Response) =>{
    try {
        const userId = req.userId;
        const chats : ChatWithReceiverAndSender[] = await prisma.chat.findMany({
           orderBy : {createdAt: 'desc'},
            where: { userIDs:{
                hasSome: [userId]
            } },
            include: { 
                messages:{
                orderBy:{createdAt: 'desc'}
              }
           },
        });

        for (const chat of chats) {
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
        }

        // �� Déchiffrage de chaque message
        let chatWithDecryptedMessages;
        for (const chat of chats) {
             // 🔓 Déchiffrer chaque message
            const decryptedMessages = chat.messages.map(message => ({
                ...message,
                text: decryptMessage(message.text) // Déchiffrer le texte du message
            }));

            // 🔓 Déchiffrer le dernier message
            const decryptedLastMessage = decryptMessage(chat.lastMessage)

            // 📌 Mettre à jour le chat avec les messages déchiffrés
            chatWithDecryptedMessages = { ...chat, messages: decryptedMessages, lastMessage: decryptedLastMessage };
        }

        res.status(200).json(chatWithDecryptedMessages);
        // TODO: Handle unread messages
    } catch (error) {
        console.error("Error fetching chat:", error);
        res.status(500).json({ message: "Failed to fetch chat!" });
    
    
    }
}


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
        const decryptedMessages = chat.messages.map(message => ({
            ...message,
            text: decryptMessage(message.text) // Déchiffrer le texte du message
        }));

        // 🔓 Déchiffrer le dernier message
        const decryptedLastMessage = decryptMessage(chat.lastMessage)

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