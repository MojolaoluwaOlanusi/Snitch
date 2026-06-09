import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.ts";

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const protectRoute = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized - No token provided' });
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
        
        const user = await User.findById(decoded.userId || decoded.id).select("-password");
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error: any) {
        console.error('Error in protectRoute:', error.message);
        return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
};
