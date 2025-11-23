import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
    baseURL: API_URL,
    timeout: 60000, // 60s timeout for AI operations
});

export const uploadTempImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/api/upload-temp", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

export const wakeUpServer = async () => {
    try {
        await api.get("/");
    } catch (e) {
        console.log("Wake up ping failed", e);
    }
};
