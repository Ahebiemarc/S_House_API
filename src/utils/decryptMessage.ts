import CryptoJS from "crypto-js";


// ✅ Fonction pour déchiffrer un message avec AES
export const decryptMessage = (encryptedText: string) => {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedText, process.env.MSG_SECRET_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error("Error decrypting message:", error);
        return "[Error decrypting message]";
    }
};