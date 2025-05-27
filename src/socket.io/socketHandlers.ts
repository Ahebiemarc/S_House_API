import { Server as SocketIOServer, Socket } from 'socket.io';
import prisma from '../lib/prisma'; // Votre client Prisma
import CryptoJS from 'crypto-js'; // Pour le chiffrement

const MSG_SECRET_KEY = process.env.MSG_SECRET_KEY;

if (!MSG_SECRET_KEY) {
  console.error("ERREUR FATALE : MSG_SECRET_KEY n'est pas défini dans socketHandlers.ts.");
  // Il est préférable de gérer cela au démarrage du serveur, mais une vérification ici est une sécurité supplémentaire.
  // process.exit(1); // Peut-être trop agressif ici, le serveur principal devrait gérer l'arrêt.
}

export const initializeSocketIO = (io: SocketIOServer) => {
  io.on('connection', (socket: Socket) => {
    console.log(`Utilisateur connecté: ${socket.id}`);

    // Un utilisateur rejoint une salle de chat
    socket.on('joinChat', (chatId: string) => {
      socket.join(chatId);
      console.log(`Utilisateur ${socket.id} a rejoint le chat ${chatId}`);
    });

    // Écoute des nouveaux messages d'un client
    socket.on('sendMessage', async (data :any) => {
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

      try {
        // Chiffrer le message
        const encryptedText = CryptoJS.AES.encrypt(text, MSG_SECRET_KEY).toString();

        // Sauvegarder le message dans la base de données
        const newMessage = await prisma.message.create({
          data: {
            text: encryptedText,
            senderId: senderId,
            chatId: chatId,
          },
        });

        // Mettre à jour le dernier message du chat et le statut seenBy
        const updatedChat = await prisma.chat.update({
          where: { id: chatId },
          data: {
            lastMessage: encryptedText,
            seenBy: { set: [senderId] }, // Marquer comme vu par l'expéditeur
          },
          include: {
            users: { // Inclure les utilisateurs pour potentiellement notifier
              select: { id: true, username: true, avatar: true }
            }
          }
        });
        
        // Préparer le message à envoyer aux clients (déchiffré)
        const messageForClient = {
          _id: newMessage.id,
          text: text, // Envoyer le texte déchiffré au client
          createdAt: newMessage.createdAt,
          senderId: newMessage.senderId,
          chatId: newMessage.chatId,
          user: { // Imiter la structure utilisateur de GiftedChat
              _id: senderId,
              // Vous pourriez avoir besoin de récupérer le nom/avatar de l'expéditeur
          }
        };

        // Émettre le nouveau message à tous les clients dans la salle de chat spécifique
        io.to(chatId).emit('newMessageReceived', messageForClient);

        // Potentiellement émettre une mise à jour des listes de chat pour les utilisateurs impliqués
        const chatParticipants = updatedChat.userIDs;
        // Logique pour notifier les participants du chat d'une mise à jour (par exemple, pour actualiser leur liste de chats)
        // Cela pourrait être un événement comme 'chatListUpdated' envoyé aux sockets des utilisateurs concernés.
        chatParticipants.forEach(userId => {
            // Vous auriez besoin d'un moyen de mapper userId aux socket.id si vous voulez cibler spécifiquement.
            // Pour l'instant, on se fie à newMessageReceived côté client pour mettre à jour le chat ouvert.
            // Et la liste des chats sera mise à jour via l'API ou un autre événement si nécessaire.
        });

      } catch (error) {
        console.error('Erreur lors de la gestion de sendMessage:', error);
        socket.emit('messageError', { error: 'Échec de l\'envoi du message' });
      }
    });

    // Un utilisateur quitte une salle de chat (optionnel)
    socket.on('leaveChat', (chatId: string) => {
      socket.leave(chatId);
      console.log(`Utilisateur ${socket.id} a quitté le chat ${chatId}`);
    });

    // Gestion de la déconnexion
    socket.on('disconnect', () => {
      console.log(`Utilisateur déconnecté: ${socket.id}`);
      // Nettoyage, par exemple, retirer l'utilisateur des salles actives si vous suivez cela
    });
  });
};