import { Prisma } from "@prisma/client";

export type ChatWithReceiverAndSender = Prisma.ChatGetPayload<{
  include: { messages: true};
}> & { 
  receiver?: { id: string; username: string; avatar: string } 
  sender?: { id: string; username: string; avatar: string } 
};
