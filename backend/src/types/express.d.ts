import "express";

declare global {
    namespace Express {
        interface Request {
            userId?: string; // or number if that’s your type
        }
    }
}
export {};