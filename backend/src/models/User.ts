import { Schema, model, Document, Types } from 'mongoose';

export interface UserDocument extends Document {
    email: string;
    passwordHash: string;
    username: string;
    displayName?: string;
    accountType: 'Work' | 'Personal' | 'Business';
    bio?: string;
    avatarUrl?: string;
    incognito: boolean;
    isBanned: boolean;
    warningsCount: number;
    isAdmin: boolean;
    createdAt: Date;
    verified?: boolean;
    verificationCode?: string;
    verificationCodeValidation?: Date;
    forgotPasswordCode?: string;
    forgotPasswordCodeValidation?: Date;
    adminInvite: {
        codeHash: String,
        createdAt: Date,
        expiresAt: Date,
        issuedBy: Schema.Types.ObjectId,
        targetEmail: String
    };
}

const UserSchema = new Schema<UserDocument>({
    email: { type: String, unique: true, index: true },
    passwordHash: String,
    username: { type: String, unique: true, index: true },
    displayName: String,
    accountType: {
        type: String,
        enum: ['Work', 'Personal', 'Business'],
        default: 'Personal',
    },
    bio: String,
    avatarUrl: String,
    incognito: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    warningsCount: { type: Number, default: 0 },
    isAdmin: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    verificationCode: { type: String, select: false },
    verificationCodeValidation: { type: Date, select: false },
    forgotPasswordCode: { type: String, select: false },
    forgotPasswordCodeValidation: { type: Date, select: false },
    createdAt: { type: Date, default: Date.now },
    adminInvite: {
        codeHash: String,
        createdAt: Date,
        expiresAt: Date,
        issuedBy: Schema.Types.ObjectId,
        targetEmail: String
    },
});

export const User = model<UserDocument>('User', UserSchema);
