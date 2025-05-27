import { Request, Response} from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import cloudinary from "../config/cloudinary";



export const getUsers = async (req: Request, res: Response) =>{
    try {
        const users = await prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            reviews: true, 
          },
        });
        res.status(200).json({users});
      } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to get users!" });
      }
};



export const getUser = async (req: Request, res: Response) =>{
    const id = req.userId;
    try {
        const user = await prisma.user.findUnique({
        where: { id },
        include: {
          reviews: true, 
        },
        });
        res.status(200).json({ user });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to get user!" });
    }
};



export const getUserById = async (req: Request, res: Response) => {
  const userId = req.params.id;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, avatar: true } // UserMinimal
    });

    if (!user) {
       res.status(404).json({ message: 'Utilisateur non trouvé' });
       return
    }

    res.status(200).json(user);
  } catch (err) {
    console.error('Erreur lors de la récupération du user:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};


export const updateUser = async (req: Request, res: Response) => {
    const id = req.params.id;
    const tokenUserId = req.userId;
    const { password, ...inputs } = req.body;
  
    if (id !== tokenUserId) {
      return res.status(403).json({ message: "Not Authorized!" });
    }
  
    let updatedPassword = null;
    let avatarUrl = null;
  
    try {
      if (password) {
        updatedPassword = await bcrypt.hash(password, 10);
      }
  
      // Récupérer l'utilisateur pour supprimer son ancienne image
      const existingUser = await prisma.user.findUnique({ where: { id } });
  
      // Si une nouvelle image a été uploadée
      if (req.file) {
        // Supprimer l'ancienne image si elle existe
        if (existingUser?.avatar) {
          const publicId = existingUser.avatar.split("/").pop()?.split(".")[0]; // Récupérer l'ID public Cloudinary
          await cloudinary.uploader.destroy(`avatars/${publicId}`); // Supprimer l'image
        }
  
        // Uploader la nouvelle image
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "avatars",
        });
        avatarUrl = result.secure_url;
      }
      console.log('Upload successful');
      
  
      // Mise à jour de l'utilisateur
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...inputs,
          ...(updatedPassword && { password: updatedPassword }),
          ...(avatarUrl && { avatar: avatarUrl }),
        },
      });
  
      const { password: userPassword, ...rest } = updatedUser;
  
      res.status(200).json({ user: rest, message: "User updated successfully" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Failed to update user!" });
    }
  };

  


/*export const deleteUser = async (req: Request, res: Response) =>{
    const id = req.params.id;
    const tokenUserId = req.userId;
    const tokenIsAdmin = req.isAdmin;
  
    // Si l'utilisateur essaie de supprimer son propre compte ou si c'est un admin
    if (id === tokenUserId || tokenIsAdmin) {
      try {
        // Suppression de l'utilisateur
        await prisma.user.delete({
          where: { id },
        });
        res.status(200).json({ message: "User deleted" });
      } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to delete user!" });
      }
    } else {
      // Si ce n'est ni l'utilisateur lui-même ni un admin
      return res.status(403).json({ message: "Not Authorized!" });
    }
};
*/

export const deleteUser = async (req: Request, res: Response) => {
  const id = req.params.id;
  const tokenUserId = req.userId;
  const tokenIsAdmin = req.isAdmin;

  if (id === tokenUserId || tokenIsAdmin) {
      try {
          // Récupérer l'utilisateur avant suppression
          const user = await prisma.user.findUnique({
              where: { id },
              select: { avatar: true },
          });

          // Supprimer l'image de Cloudinary si elle existe
          if (user?.avatar) {
              const publicId = user.avatar.split("/").pop()?.split(".")[0]; // Extraire le public_id
              await cloudinary.uploader.destroy(`avatars/${publicId}`);
          }

          // Supprimer l'utilisateur
          await prisma.user.delete({ where: { id } });

          res.status(200).json({ message: "User deleted" });
      } catch (err) {
          console.log(err);
          res.status(500).json({ message: "Failed to delete user!" });
      }
  } else {
      return res.status(403).json({ message: "Not Authorized!" });
  }
};
