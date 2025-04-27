import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

// Configuration du stockage sur Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => ({
      folder: "posts", // Dossier sur Cloudinary
      format: file.mimetype.split("/")[1], // Déterminer le format depuis le mimetype
      //transformation: [{ width: 300, height: 300, crop: "fill" }],
      transformation: [{ quality: "auto:good" }], // Compression automatique de bonne qualité
    }),
  });
  

const upload = multer({ storage });

export default upload;



