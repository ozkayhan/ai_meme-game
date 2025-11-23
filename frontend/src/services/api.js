import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
    baseURL: API_URL,
    timeout: 60000, // 60s timeout for AI operations
});

export const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const wakeUpServer = async () => {
    try {
        await api.get("/");
    } catch (e) {
        console.log("Wake up ping failed", e);
    }
};
