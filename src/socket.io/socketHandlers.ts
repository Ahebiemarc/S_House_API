import { Server as SocketIOServer, Socket } from 'socket.io';
import prisma from '../lib/prisma';
import CryptoJS from 'crypto-js';

const MSG_SECRET_KEY = process.env.MSG_SECRET_KEY;

if (!MSG_SECRET_KEY) {
  console.error("ERREUR FATALE : MSG_SECRET_KEY n'est pas défini dans socketHandlers.ts.");
  // Processus principal devrait gérer ça avant démarrage
}

export const initializeSocketIO = (io: SocketIOServer) => {
  io.on('connection', (socket: Socket) => {
    console.log(`Utilisateur connecté: ${socket.id}`);

    socket.on('joinChat', (chatId: string) => {
      socket.join(chatId);
      console.log(`Utilisateur ${socket.id} a rejoint le chat ${chatId}`);
    });

    socket.on('sendMessage', (data: any) => {
      const { chatId, text, senderId, receiverId } = data;

      if (!chatId || !text || !senderId) {
        socket.emit('messageError', { error: 'Données manquantes pour sendMessage' });
        return;
      }
      if (!MSG_SECRET_KEY) {
        console.error("ERREUR : MSG_SECRET_KEY n'est pas disponible pour le chiffrement.");
        socket.emit('messageError', { error: 'Erreur serveur lors de l\'envoi du message.' });
        return;
      }

      // 1) Chiffrer le message immédiatement
      const encryptedText = CryptoJS.AES.encrypt(text, MSG_SECRET_KEY).toString();

      // 2) Émettre immédiatement le message déchiffré aux clients (optimistic UI)
      const optimisticMessage = {
        _id: 'temp-' + Date.now(), // ID temporaire, le client devra gérer la mise à jour
        text,
        createdAt: new Date().toISOString(),
        senderId,
        chatId,
        user: { _id: senderId }
      };
      io.to(chatId).emit('newMessageReceived', optimisticMessage);

      // 3) Sauvegarder en base en tâche asynchrone (non bloquante)
      (async () => {
        try {
          const newMessage = await prisma.message.create({
            data: {
              text: encryptedText,
              senderId,
              chatId,
            },
          });

          await prisma.chat.update({
            where: { id: chatId },
            data: {
              lastMessage: encryptedText,
              seenBy: { set: [senderId] },
            },
          });

          // Optionnel : émettre une mise à jour avec vrai ID et date après sauvegarde
          const confirmedMessage = {
            _id: newMessage.id,
            text,
            createdAt: newMessage.createdAt.toISOString(),
            senderId: newMessage.senderId,
            chatId: newMessage.chatId,
            user: { _id: senderId },
          };

          io.to(chatId).emit('messageConfirmed', {
            tempId: optimisticMessage._id,
            confirmedMessage,
          });
        } catch (error) {
          console.error('Erreur lors de la sauvegarde du message:', error);
          socket.emit('messageError', { error: 'Échec de l\'enregistrement du message' });
          // Optionnel : informer clients de l'échec
          io.to(chatId).emit('messageFailed', { tempId: optimisticMessage._id });
        }
      })();
    });

    socket.on('leaveChat', (chatId: string) => {
      socket.leave(chatId);
      console.log(`Utilisateur ${socket.id} a quitté le chat ${chatId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Utilisateur déconnecté: ${socket.id}`);
    });
  });
};
