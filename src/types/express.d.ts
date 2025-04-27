import { Request } from "express";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;  // L'ID de l'utilisateur connecté
    isAdmin?: boolean; // Indique si l'utilisateur est admin
  }
}
