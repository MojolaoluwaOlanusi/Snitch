import { UserDocument } from '../models/User'; // adjust path to your model

declare global {
    namespace Express {
        export interface Request {
            user?: UserDocument; // or any type that matches your user object
        }
    }
}
