import mongoose, { Schema, model, Types } from 'mongoose';
const PostSchema = new Schema({
    author:{
        type:Types.ObjectId
        ,ref:'User',
        index:true
    },

    text:String,

    reportCount:Number,

    reaction: [{type:String}],

    url:String,

    scheduledAt: { type: Date, default: null },
    isPublished: { type: Boolean, default: true },

    mediaType:{
        type:String,
        enum:['Audio','Video','Image','None'],
        default: "None"
    },

    isWarp:{
        type:Boolean,
        default:false
    },

    repostOf:{
        type:Types.ObjectId
        ,ref:'Post',
        default:null
    },

    repostCount:{
        type: Number,
        default: 0
    },

    visibility:{
        type:String,
        enum:['public','followers','private'],
        default:'public'
    },

    hashtags:[String],

    mentions:[String],

    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],

    createdAt:{type:Date,default:Date.now},

    bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    bookmarksCount: { type: Number, default: 0 },

    comments: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            text: String,
            media: {
                url: String,
                type: { type: String, enum: ['sticker', 'gif'] },
            },
            userAvatar: String,
            userDisplayName: String,
            userUsername: String,
            createdAt: { type: Date, default: Date.now },
            replies: [
                {
                    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                    text: String,
                    media: {
                        url: String,
                        type: { type: String, enum: ['sticker', 'gif'] },
                    },
                    userAvatar: String,
                    userDisplayName: String,
                    userUsername: String,
                    createdAt: { type: Date, default: Date.now },
                },
            ],
        },
    ],
});

PostSchema.index(
    {
        text: "text",
        hashtags: "text",
    },
    {
        weights: {
            text: 5,
            hashtags: 3,
        },
        name: "PostSearchIndex",
    }
);

export default model('Post', PostSchema);