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

    comments: [
        {
            text: {
                type: String,
                required: true,
            },
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            userAvatar: {
                type: String
            },
            userDisplayName: {
                type: String
            },
            userUsername: {
                type: String
            }
        },
    ]
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