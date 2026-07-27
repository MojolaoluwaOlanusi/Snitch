import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 600000, // 10 minutes for large file uploads
});
export default axiosInstance;
