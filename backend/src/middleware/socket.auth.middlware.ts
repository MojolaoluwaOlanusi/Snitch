import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const socketAuthMiddleware = async (socket: any, next: any) => {
    try {
        // token may come in handshake auth or in headers
        const tokenFromAuth = socket.handshake?.auth?.token;
        const authHeader = socket.handshake?.headers?.authorization;
        let token: string | undefined = undefined;

        if (tokenFromAuth) token = tokenFromAuth;
        else if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];

        if (!token) {
            console.log("Socket connection rejected: No token provided");
            return next(new Error("Unauthorized - No Token Provided"));
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
        if (!decoded) {
            console.log("Socket connection rejected: Invalid token");
            return next(new Error("Unauthorized - Invalid Token"));
        }

        // find the user from the db
        const user = await User.findById(decoded.userId || decoded.id).select("-password");
        if (!user) {
            console.log("Socket connection rejected: User not found");
            return next(new Error("User not found"));
        }

        // attach user info to socket
        socket.data.user = user;
        socket.data.userId = user._id.toString();

        // proceed
        return next();
    } catch (err: any) {
        console.log("Error in socket authentication:", err.message);
        return next(new Error("Unauthorized - Authentication failed"));
    }
};
