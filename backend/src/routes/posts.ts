import express from 'express';
import Post from '../models/Post.ts';
import Notification from '../models/Notification.ts'
import {User} from '../models/User.ts';
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import s3 from '../config/s3Client.ts';

const router = express.Router();

async function authMiddleware(req:any, _res:any,next:any){
  const h = req.headers.authorization; if(!h) return next(); const parts = h.split(' '); if(parts.length!==2) return next(); try{ const decoded:any = jwt.verify(parts[1], process.env.JWT_SECRET || 'DevelopmentSecret'); const user = await User.findById(decoded.id); req.userId = decoded.id ; if(user) req.user = user; }catch(e){} next();
}

router.use(authMiddleware);

router.post('/', async (req,res)=>{
    if(!req.user) return res.status(401).json({ error:'unauthorized' });
    const { text, url, isWarp, mediaType, mentions, hashtags } = req.body;
    if (!text) return  res.status(400).json({message: "Post Content is Required"});
    const p =
        await Post.create({ author: req.user._id, text, url, isWarp, mediaType: mediaType || "None", mentions, hashtags, createdAt: new Date() });
    res.status(201).json(p);
});

router.get('/', async (_req,res)=>{ const posts = await Post.find().sort({ createdAt:-1 }).limit(50).populate('author','username displayName avatarUrl'); res.json(posts); });

router.get('/trending', async (req,res)=>{
    const parsedLimit = Number(req.query.limit);
    const parsedSkip = Number(req.query.skip);
    const limit = Number.isFinite(parsedLimit)
        ? Math.min(Math.max(Math.trunc(parsedLimit), 1), 50)
            : 20;
    const skip = Number.isFinite(parsedSkip)
        ? Math.max(Math.trunc(parsedSkip), 0)
            : 0;


    const trendingPosts = await Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author','username displayName avatarUrl');

    const total = await Post.countDocuments();

    res.json({ posts: trendingPosts, hasMore: skip + limit < total });
});

router.get('/trending/hashtags', async (req,res)=>{
    const parsedLimit = Number(req.query.limit);
    const parsedSkip = Number(req.query.skip);
    const limit = Number.isFinite(parsedLimit)
        ? Math.min(Math.max(Math.trunc(parsedLimit), 1), 50)
        : 20;
    const skip = Number.isFinite(parsedSkip)
        ? Math.max(Math.trunc(parsedSkip), 0)
        : 0;
    
    const [agg] = await Post.aggregate([
        { $match: { hashtags: { $exists: true, $ne: [] } } },
        { $unwind: "$hashtags" },
        { $group: { _id: "$hashtags", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        {
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limit },
                    { $project: { _id: 0, tag: "$_id", count: 1 } }
                ],
                total: [{ $count: "count" }]
            }
        }
    ]);

    const hashtags = agg?.data ?? [];
    const total = agg?.total?.[0]?.count ?? 0;
    res.json({ hashtags, hasMore: skip + limit < total });
});

router.delete('/delete/:id', async (req: any, res: any) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid Post Id" });
    }

    try {
        const post = await Post.findById(id);
        if (post && post.url) {
            try {
                const bucket = process.env.S3_BUCKET || 'snitch-dev';
                const s3Endpoint = process.env.S3_ENDPOINT; // may be undefined
                let key: string | null = null;

                try {
                    const urlObj = new URL(post.url);
                    // Case 1: custom S3 endpoint like https://s3.example.com/<bucket>/<key>
                    if (s3Endpoint) {
                        const base = `${s3Endpoint.replace(/\/$/, '')}/${bucket}`;
                        if (post.url.startsWith(base)) {
                            key = post.url.substring(base.length + 1);
                        }
                    } else {
                        // Case 2: aws-style https://<bucket>.s3.amazonaws.com/<key>
                        const host = urlObj.host; // e.g., bucket.s3.amazonaws.com
                        if (host.endsWith('.s3.amazonaws.com')) {
                            // pathname starts with /
                            key = urlObj.pathname.replace(/^\//, '');
                        }
                    }
                } catch (parseErr) {
                    // fallback: try to extract after bucket/ in the string
                    if (post.url.includes(`/${bucket}/`)) {
                        key = post.url.split(`/${bucket}/`)[1];
                    }
                }

                if (key) {
                    // attempt deletion from S3/Minio
                    const delCmd = new DeleteObjectCommand({ Bucket: bucket, Key: key });
                    await s3.send(delCmd);
                    console.log('Deleted media from S3', key);
                } else {
                    console.log('Could not derive S3 key from post.url, skipping media delete:', post.url);
                }
            } catch (s3Err) {
                console.log('Error deleting media from S3/Minio for post:', id, s3Err);
                // continue to delete the DB record even if media deletion failed
            }
        }

        await Post.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Post deleted successfully" });
    } catch (err: any) {
        console.log("error in deleting post:", err.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

router.put('/edit-post/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { text, mediaType , url, hashtags, mentions } = req.body;
        if (!text && !mediaType && !url) return res.status(400).json({ message: "You must update at least a field!" });
        const post = await Post.findById(id);
        const updatedPost = await Post.findByIdAndUpdate(
            // @ts-ignore
            post._id,
            { text, mediaType , url, hashtags, mentions },
            { new: true }
        );
        res.status(200).json(updatedPost);
    } catch (err: any) {
        console.error('Error in getUserProfile:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.get('/get-post/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findById(id);

        res.status(200).json(post)
    } catch (err: any) {
        console.error('Error in getUserProfile:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
})

router.post('/like/:id', async (req, res) => {
    try {
        if(!req.user) return res.status(400).json({ error:'unauthorized' });
        const userId = req.user._id;
        if (!userId) console.log("No userId");
        const currentUser = await User.findById(userId);
        if (!currentUser){
            return res.status(400).json({ error: "UserId is required", message: "UserId is required!"});
        }
        const { id: postId } = req.params;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(400).json({ error: "Post not found" });
        }

        const userLikedPost = post?.likes?.includes(userId);


        if (userLikedPost) {
            // Unlike post
            await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
            await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

            const updatedLikes = post.likes.filter((id) => id !== userId);
            res.status(200).json({updatedLikes, message: 'Successfully Unliked Post' });
        } else {
            // Like post
            post.likes.push(userId);
            await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
            await post.save();
            const notification = new Notification({
                from: userId,
                to: post.author,
                type: "like",
                fromAvatarUrl: currentUser.avatarUrl,
            });
            await notification.save();
            const updatedLikes = post.likes;
            res.status(200).json({ updatedLikes, message: 'Successfully Liked Post' });
        }
    } catch (error) {
        console.log("Error in likeUnlikePost controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/liked-posts/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: "User not found" });

        const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
            .populate({
                path: "author",
                select: "-passwordHash",
            })
            .populate({
                path: "likes.author",
                select: "-passwordHash",
            });

        res.status(200).json(likedPosts);
    } catch (error) {
        console.log("Error in getLikedPosts controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/get-user-posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: "User not found", message: "User not found" });

        const posts = await Post.find({ author: user._id })
            .sort({ createdAt: -1 })
            .populate({
                path: "author",
                select: "-passwordHash",
            })
            .populate({
                path: "likes.author",
                select: "-passwordHash",
            });

        res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getUserPosts controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/get-truncated-posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: "User not found", message: "User not found" });

        const posts = await Post.find({ author: user._id })
            .sort({ createdAt: -1 })
            .populate({
                path: "author",
                select: "-passwordHash",
            })
            .populate({
                path: "likes.author",
                select: "-passwordHash",
            }).limit(6);

        res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getUserPosts controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/get-following-posts', async (req, res) => {
    const userId = req.userId;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const followingPosts = await Post.find({ author: { $in: user.following } })
            .sort({ createdAt: -1 })
            .populate({
                path: "author",
                select: "-passwordHash",
            })
            .populate({
                path: "comments.user",
                select: "-passwordHash",
            });

        res.status(200).json(followingPosts);
    } catch (error) {
        console.log("Error in getFollowingPosts controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
})

router.post('/react', async (req, res) => {
    try {
        // @ts-ignore
        const { id } = req.body;
        const userId = req.user._id;
        const currentUser = await User.findById(userId);
        if (!currentUser){
            return res.status(400).json({ error: "UserId is required", message: "UserId is required!"});
        }
        const { reaction } = req.body;
        if (!reaction) return res.status(400).json({ message: "Reaction is required" });
        const post = await Post.findById(id);
        if (!post) return res.status(400).json({ message: "Post not found!" });
        await Post.findByIdAndUpdate(
            // @ts-ignore
            post._id,
            { $push: { reaction: reaction } },
            { new: true }
        );
        post.reaction.push(reaction);
        const notification = new Notification({
            from: userId,
            to: post.author,
            type: "react",
            fromAvatarUrl: currentUser.avatarUrl,
        });
        await notification.save();
        res.status(200).json({success: true,message: `You have successfully reacted to the post: ${id}`});
    } catch (err: any) {
        console.error('Error in reaction:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }});

router.post('/comment', async (req, res) => {
    try {
        const { text,postId } = req.body;
        const userId = req.userId;



        if (!text) {
            return res.status(400).json({ error: "Text field is required" });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const person = await User.findById(userId).select("-passwordHash");

        if (!person) {
            return res.status(404).json({error: "Commenter not found!"})
        }

        const comment = { user: userId, text, userAvatar: person.avatarUrl, userDisplayName: person.displayName, userUsername: person.username };

        // @ts-ignore
        post.comments.push(comment);
        await post.save();

        const commentedPost = await Post.findById(postId);

        res.status(200).json(commentedPost);
    } catch (error) {
        console.log("Error in commentOnPost controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;