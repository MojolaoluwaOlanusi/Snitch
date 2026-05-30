import { Server } from  "socket.io";
import Message from "../models/Message.ts"

export const initializeSocket = (server: any) => {
    const io = new Server(server, {
        cors:{
            origin: process.env.CLIENT_URL,
            credentials: true
        }
    });

    const userSockets = new Map();
    const userActivities = new Map();

    io.on("connection", (socket) => {

        socket.on("user_connected", (userId) => {
            userSockets.set(userId, socket.id);
            userActivities.set(userId, "idle");

            io.emit("user_connected", userId);

            socket.emit("users_online", Array.from(userSockets.keys()));

        });

        socket.on("send_message", async (data) => {
            try {
                const {senderId, receiverId, text, image} = data;

                const message = await Message.create({
                    senderId,
                    receiverId,
                    text,
                    image
                });

                const  receiverSocketId = userSockets.get(receiverId);
                if(receiverSocketId){
                    io.to(receiverSocketId).emit("receive_message",message)
                }

                socket.emit("message_sent",message)

            } catch (error: any) {
                console.error("Message error", error);
                socket.emit("message_error", error.message);
            }
        });

        socket.on("disconnect", () => {
            let disconnectedUserId;
            for(const [userId, socketId] of userSockets.entries()) {
                if(socketId === socket.id){
                    disconnectedUserId = userId;
                    userSockets.delete(userId);
                    userActivities.delete(userId);
                    break;
                }
            }
            if(disconnectedUserId){
                io.emit("user_disconnected",disconnectedUserId);
            }
        });
    });
};