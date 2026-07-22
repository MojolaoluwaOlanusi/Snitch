import mongoose, { Schema, model, Document } from 'mongoose';

export interface UserDocument extends Document {
    email: string;
    passwordHash: string;
    username: string;
    usernameLower: string;
    displayName?: string;
    accountType: 'Work' | 'Personal' | 'Business';
    accountVisibility: 'Private' | 'Public' | 'Friends';
    followers: mongoose.Types.ObjectId[];
    blockedBy: mongoose.Types.ObjectId[];
    blocked: mongoose.Types.ObjectId[];
    following: mongoose.Types.ObjectId[];
    likedPosts: mongoose.Types.ObjectId[];
    pushSubscriptions: {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    }[];
    bio: string;
    avatarUrl: string;
    coverImg: string;
    link: string;
    location: string;
    incognito: boolean;
    isBanned: boolean;
    followerCount: number;
    followingCount: number;
    warningsCount: number;
    isAdmin: boolean;
    createdAt: Date;
    verified?: boolean;
    verificationCode?: string;
    verificationCodeValidation?: Date;
    forgotPasswordCode?: string;
    forgotPasswordCodeValidation?: Date;
    adminInvite: {
        codeHash: string;
        createdAt: Date;
        expiresAt: Date;
        issuedBy: mongoose.Types.ObjectId;
        targetEmail: string;
    };
    chatReportCount: number;
    chatRestrictedUntil: Date;
    lastSeen: Date;
    gender: string;
    socialHandles: {
        platform: string;
        url: string;
    }[];
    bookmarkedPosts: mongoose.Types.ObjectId[];
    theme: string;
}

const UserSchema = new Schema<UserDocument>({
    email: { type: String, unique: true, index: true },
    passwordHash: String,
    displayName: { type: String, trim: true },
    username: { type: String, unique: true, index: true, trim: true },
    usernameLower: { type: String, unique: true, index: true },
    accountType: {
        type: String,
        enum: ['Work', 'Personal', 'Business'],
        default: 'Personal',
    },
    accountVisibility: {
        type: String,
        enum: ['Private', 'Public', 'Friends'],
        default: 'Public',
    },
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: [],
        },
    ],
    blockedBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: [],
        },
    ],
    blocked: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: [],
        },
    ],
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: [],
        },
    ],
    likedPosts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            default: [],
        },
    ],
    pushSubscriptions: {
        type: [
            {
                endpoint: { type: String },
                keys: {
                    p256dh: { type: String },
                    auth: { type: String },
                },
            },
        ],
        default: [],
    },
    coverImg: String,
    link: String,
    location: String,
    bio: String,
    avatarUrl: String,
    incognito: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    warningsCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    followerCount: { type: Number, default: 0 },
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
        targetEmail: String,
    },
    chatReportCount: { type: Number, default: 0 },
    chatRestrictedUntil: { type: Date },
    lastSeen: { type: Date },
    gender: { type: String, default: '' },
    socialHandles: [
        {
            platform: { type: String },
            url: { type: String },
        },
    ],
    bookmarkedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    theme: { type: String, default: 'winter' },
});

// 🔥 Pre‑save middleware: Automatically set usernameLower on creation/update
UserSchema.pre('save', function (next) {
    if (this.isModified('username')) {
        this.usernameLower = this.username.toLowerCase();
    }
    next();
});

// 🔥 Also handle findOneAndUpdate operations
UserSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate() as any;

    // Handle direct update or $set
    let username = update.username || (update.$set && update.$set.username);

    if (username) {
        username = username.trim(); // 🔥 Trim the username
        const usernameLower = username.toLowerCase();

        if (update.$set) {
            update.$set.username = username;
            update.$set.usernameLower = usernameLower;
        } else {
            update.username = username;
            update.usernameLower = usernameLower;
        }
    }
    next();
});

// Text search index (keep as-is)
UserSchema.index(
    {
        username: 'text',
        displayName: 'text',
        bio: 'text',
    },
    {
        weights: {
            username: 5,
            displayName: 3,
            bio: 1,
        },
        name: 'UserSearchIndex',
    }
);

export const User = model<UserDocument>('User', UserSchema);