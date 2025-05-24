import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { Property, Prisma, Type, Post } from "@prisma/client";
import cloudinary from "../config/cloudinary";




export const getAllPosts = async (req: Request, res: Response) => {
    try {

      const posts = await prisma.post.findMany({
        orderBy: { createdAt: "desc" }, // Trier du plus récent au plus ancien
        include: {
          user: {
            select: { id: true, username: true, avatar: true }, // Inclure l'auteur du post
          },
          reviews: true,
        },
      });
  
      res.status(200).json(posts);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Failed to fetch posts!" });
    }
};

export const getPostsByUserId = async (req: Request, res: Response) => {
  try {
    const userId = req.userId; // Assure-toi que le middleware d'auth remplit req.user.id

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: User not authenticated." });
    }

    const posts = await prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
        reviews: true,
      },
    });

    res.status(200).json(posts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch user posts!" });
  }
};



export const getAllPostsByLimit = async (req: Request, res: Response) => {
  try {
    // Récupérer la limite depuis les paramètres de requête (ex: ?limit=10)
    const limit = parseInt(req.query.limit as string) || 10; // 10 par défaut

    const posts = await prisma.post.findMany({
      take: limit, // Appliquer la limite
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
        reviews: true,
      },
    });

    res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch posts!" });
  }
};


export const getPostsByProperty = async (req: Request, res: Response) => {
  const { property } = req.params;

  let postsAll = null;
  
  try {
    if (property === "All") {
      postsAll = await prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, username: true, avatar: true },
          },
          reviews: true,
        },
      });
    } else {
      if (!Object.values(Property).includes(property.toUpperCase() as Property)) {
        return res.status(400).json({ message: "Invalid property type!" });
      }
  
      const posts = await prisma.post.findMany({
        where: { property: property.toUpperCase() as Property },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, username: true, avatar: true },
          },
          reviews: true,
        },
      });
  
      postsAll =  posts;
    }
  
    res.status(200).json(postsAll);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch posts!" });
  }
};




export const searchPosts = async (req: Request, res: Response) => {
  const { query } = req.query; // Récupérer le texte saisi dans la requête

  if (!query || typeof query !== "string") {
    return res.status(400).json({ message: "Query parameter is required!" });
  }

  try {
    // Convertir le texte en nombre si possible
    const numericQuery = parseInt(query, 10);

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: Prisma.QueryMode.insensitive } }, // ✅ Correction ici
          { city: { contains: query, mode: Prisma.QueryMode.insensitive } },  // ✅ Correction ici
          numericQuery ? { price: numericQuery } : undefined, // Vérifie si c'est un nombre
        ].filter(Boolean), // Supprime les conditions `undefined`
      },
      orderBy: { createdAt: "desc" }, // Trier du plus récent au plus ancien
      include: {
        user: {
          select: { id: true, username: true, avatar: true }, // Inclure l'auteur du post
        },
        reviews: true,
      },
    });

    res.status(200).json(posts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to search posts!" });
  }
};


export const getPostsByType = async (req: Request, res: Response) => {
    try {
        const { type } = req.params;

        // Vérification que le type fourni est valide
        const validTypes = ["BUY", "RENT"];
        if (!validTypes.includes(type.toUpperCase())) {
            return res.status(400).json({ message: "Invalid type provided!" });
        }

        const posts = await prisma.post.findMany({
            where: { type: type.toUpperCase() as Type },
            orderBy: { createdAt: "desc" }, // Trier par plus récent
            include: {
                user: {
                  select: { id: true, username: true, avatar: true }, // Inclure l'auteur du post
              },
              reviews: true,
            },
        });

        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch posts by type!" });
    }
};


export const getPost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Vérifier si l'ID est valide
        if (!id) {
            return res.status(400).json({ message: "Post ID is required!" });
        }

        // Récupérer le post avec les détails de l'utilisateur
        const post = await prisma.post.findUnique({
            where: { id },
            include: { 
                user: {
                    select: { id: true, username: true, avatar: true }, // Inclure l'auteur du post
                },
                reviews: true,
             }, // Inclut les informations de l'utilisateur qui a posté

        });

        if (!post) {
            return res.status(404).json({ message: "Post not found!" });
        }

        res.status(200).json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch post!" });
    }
};


// Ajouter un post avec plusieurs images
export const addPost = async (req: Request, res: Response) => {
    try {
        const { title, price, address, desc, city, bedroom, bathroom, latitude, longitude, type, property } = req.body;
        const userId = req.userId; // Récupérer l'ID de l'utilisateur authentifié
        console.log(userId);
        
        console.log(req.body);


        // Vérifier si les champs obligatoires sont remplis
        if (!title || !price || !address || !desc || !city || !type || !property) {
            return res.status(400).json({ message: "All required fields must be provided!" });
        }


        // Vérifier si des fichiers ont été envoyés
        if (!req.files || !(req.files as Express.Multer.File[]).length) {
            return res.status(400).json({ message: "At least one image is required!" });
        }

        console.log("Body:", req.body);
        console.log("Files:", req.files);
        console.log("UserID:", req.userId);

        // Uploader les images sur Cloudinary
        const images = (req.files as Express.Multer.File[]).map(file => file.path); // 'path' = URL Cloudinary


        
        

        // Créer le post dans la base de données
        const newPost: Post = await prisma.post.create({
            data: {
                title,
                price: Number(price),
                images: images,
                address,
                desc,
                city,
                bedroom: Number(bedroom),
                bathroom: Number(bathroom),
                latitude : Number(latitude),
                longitude: Number(longitude),
                type,
                property,
                userId,
            },
        });

        res.status(201).json({ post: newPost, message: "Post created successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create post!" });
    }
};




/*export const updatePost = async (req: Request, res: Response) => {
  const { id } = req.params;
  const tokenUserId = req.userId;
  const { title, price, address, city, bedroom, bathroom, latitude, longitude, type, property, existingImages } = req.body;

  try {
    // Vérifier si le post existe
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found!" });
    }

    // Vérifier si l'utilisateur est bien le propriétaire
    if (post.userId !== tokenUserId) {
      return res.status(403).json({ message: "Not authorized!" });
    }

    let updatedImages = existingImages ? JSON.parse(existingImages) : [];

    // Si de nouvelles images sont uploadées
    if (req.files && req.files.images) {
      const uploadedImages = req.files.images;

      // Si plusieurs fichiers
      const files = Array.isArray(uploadedImages) ? uploadedImages : [uploadedImages];

      for (const file of files) {
        const result = await cloudinary.uploader.upload((file as UploadedFile).tempFilePath);
        updatedImages.push(result.secure_url);
      }
    }

    // Supprimer les anciennes images qui ne sont plus utilisées
    const imagesToDelete = post.images.filter((url) => !updatedImages.includes(url));

    for (const imageUrl of imagesToDelete) {
      // Extraire le public_id de Cloudinary
      const publicId = imageUrl.split("/").pop()?.split(".")[0];

      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    // Mettre à jour le post
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title,
        price: parseInt(price),
        address,
        city,
        bedroom: parseInt(bedroom),
        bathroom: parseInt(bathroom),
        latitude,
        longitude,
        type,
        property,
        images: updatedImages,
      },
    });

    res.status(200).json({ post: updatedPost, message: "Post updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update post!" });
  }
};*/


export const updatePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId; // ID de l'utilisateur authentifié
    const { title, price, address, desc, city, bedroom, bathroom, latitude, longitude, type, property, existingImages } = req.body;

    console.log(id);
    console.log(userId);
    console.log(req.body);
    
    
    
    
    // Vérifier si le post existe
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return res.status(404).json({ message: "Post not found!" });
    }

    // Vérifier si l'utilisateur est propriétaire du post ou admin
    if (existingPost.userId !== userId) {
      return res.status(403).json({ message: "Not authorized to update this post!" });
    }

    // Récupérer les images existantes du post
    const currentImages = existingPost.images;
    
    // Déterminer quelles images ont été supprimées
    // existingImages contient les URLs des images que l'utilisateur veut conserver
    const imagesToKeep = existingImages ? 
      (Array.isArray(existingImages) ? existingImages : [existingImages]) : 
      [];
    
    // Identifier les images à supprimer dans Cloudinary
    const imagesToDelete = currentImages.filter(images => !imagesToKeep.includes(images));
    
    // Supprimer les images de Cloudinary
    for (const imageUrl of imagesToDelete) {
      try {
        // Extraire l'ID public de l'URL Cloudinary (format: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/public_id.jpg)
        const publicId = imageUrl.split('/').pop()?.split('.')[0];
        console.log(publicId);
        
        await cloudinary.uploader.destroy(`posts/${publicId}`);
      } catch (error) {
        console.error(`Failed to delete image ${imageUrl} from Cloudinary:`, error);
        // Continuer l'exécution même si la suppression d'une image échoue
      }
    }
    
    // Uploader les nouvelles images si elles existent
    let newImages: string[] = [];
    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      newImages = await Promise.all(
        (req.files as Express.Multer.File[]).map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path);
          return result.secure_url;
        })
      );
    }

    //const imagePost = imagesToKeep.length === 0 ?  existingPost.images : imagesToKeep;
    
    // Combiner les images existantes à conserver avec les nouvelles images
    const updatedImages = [...imagesToKeep, ...newImages];
    
    // Mettre à jour le post dans la base de données
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title: title || existingPost.title,
        price: price ? Number(price) : existingPost.price,
        images: updatedImages,
        address: address || existingPost.address,
        desc: desc || existingPost.desc,
        city: city || existingPost.city,
        bedroom: bedroom ? Number(bedroom) : existingPost.bedroom,
        bathroom: bathroom ? Number(bathroom) : existingPost.bathroom,
        latitude: Number(latitude) || Number(existingPost.latitude),
        longitude: Number(longitude) || Number(existingPost.longitude),
        type: type || existingPost.type,
        property: property || existingPost.property,
      },
    });
    
    res.status(200).json({ 
      post: updatedPost, 
      message: "Post updated successfully!" 
    });
    
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Failed to update post!" });
  }
};


export const deletePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId; // ID de l'utilisateur authentifié
    const isAdmin = req.isAdmin; // Rôle de l'utilisateur (admin ou non)

    // Vérifier si le post existe
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found!" });
    }

    // Vérifier si l'utilisateur est propriétaire du post ou non admin
    if (post.userId !== userId && isAdmin == false ) {
      return res.status(403).json({ message: "Not authorized to delete this post!" });
    }

    // Supprimer les images associées sur Cloudinary
    for (const imageUrl of post.images) {
      try {
        const publicId = imageUrl.split("/").pop()?.split(".")[0];
        await cloudinary.uploader.destroy(`posts/${publicId}`);
      } catch (error) {
        console.error(`Failed to delete image ${imageUrl} from Cloudinary:`, error);
      }
    }

    // Supprimer le post de la base de données
    await prisma.post.delete({
      where: { id },
    });

    res.status(200).json({ message: "Post deleted successfully!" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Failed to delete post!" });
  }
};