import { Request, Response } from "express";

import prisma from "../lib/prisma";


/**
 * ✅ Récupérer tous les avis (ADMIN uniquement)
 */
export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
       orderBy: { createdAt: "desc" }, // Trier du plus récent au plus ancien
      include: { user: true, post: true },

    });
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews!" });
  }
};

/**
 * ✅ Récupérer un avis par son ID
 */
export const getReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const review = await prisma.review.findUnique({
      where: { id },
      include: { user: true, post: true },
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found!" });
    }

    res.status(200).json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({ message: "Failed to fetch review!" });
  }
};

/**
 * ✅ Récupérer tous les avis d'un PostDetail donné
 */
export const getAllReviewByPosts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reviews = await prisma.review.findMany({
      where: { postId: id },
      orderBy: { createdAt: "desc" }, // Trier du plus récent au plus ancien
      include: { user: true },
    });

    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching reviews for PostDetail:", error);
    res.status(500).json({ message: "Failed to fetch reviews!" });
  }
};

/**
 * ✅ Récupérer tous les avis d'un utilisateur donné
 */
export const getAllReviewByUser = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const reviews = await prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }, // Trier du plus récent au plus ancien
      include: { post: true },
    });

    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching reviews by user:", error);
    res.status(500).json({ message: "Failed to fetch reviews!" });
  }
};

/**
 * ✅ Ajouter un nouvel avis
 */
export const addReview = async (req: Request, res: Response) => {
  try {
    const { rating, comment } = req.body;
    const { id } = req.params;
    const userId = req.userId; // ID de l'utilisateur connecté
    const postId = id; // ID du PostDetail lié à l'avis

    const newReview = await prisma.review.create({
      data: {
        rating: Number(rating),
        comment,
        userId,
        postId,
      },
    });

    res.status(201).json({ review: newReview, message: "Review added successfully!" });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Failed to add review!" });
  }
};

/**
 * ✅ Mettre à jour un avis
 */
export const updateReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.userId; // ID de l'utilisateur connecté

    // Vérifier si l'avis existe
    const existingReview = await prisma.review.findUnique({ where: { id } });
    if (!existingReview) {
      return res.status(404).json({ message: "Review not found!" });
    }

    // Vérifier si l'utilisateur est le propriétaire de l'avis
    if (existingReview.userId !== userId) {
      return res.status(403).json({ message: "Not authorized to update this review!" });
    }

    // Mettre à jour l'avis
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        rating: rating ? Number(rating) : existingReview.rating,
        comment: comment || existingReview.comment,
      },
    });

    res.status(200).json({ review: updatedReview, message: "Review updated successfully!" });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ message: "Failed to update review!" });
  }
};

/**
 * ✅ Supprimer un avis
 */
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId; // ID de l'utilisateur connecté

    // Vérifier si l'avis existe
    const existingReview = await prisma.review.findUnique({ where: { id } });
    if (!existingReview) {
      return res.status(404).json({ message: "Review not found!" });
    }

    // Vérifier si l'utilisateur est le propriétaire de l'avis ou admin
    if (existingReview.userId !== userId && !req.isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this review!" });
    }

    // Supprimer l'avis
    await prisma.review.delete({ where: { id } });

    res.status(200).json({ message: "Review deleted successfully!" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Failed to delete review!" });
  }
};
