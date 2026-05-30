import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "http://localhost:4500/api",
});
export default axiosInstance;
