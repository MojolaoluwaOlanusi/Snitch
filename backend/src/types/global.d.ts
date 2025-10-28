import { Server } from "socket.io";

declare global {
    // This lets TypeScript know `globalThis.io` exists and is a Socket.IO Server
    // eslint-disable-next-line no-var
    var io: Server;
}
export {};