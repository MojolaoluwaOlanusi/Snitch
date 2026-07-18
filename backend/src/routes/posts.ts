import express, { Request, Response } from 'express';
import Post from '../models/Post.js';
import { sendPushNotification } from '../utils/pushNotifications.js';
import Notification from '../models/Notification.js'
import {User} from '../models/User.js';
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import s3 from '../config/s3Client.js';

const router = express.Router();

async function authMiddleware(req: Request, _res: Response, next: any){
  const h = req.headers.authorization; if(!h) return next(); const parts = h.split(' '); if(parts.length!==2) return next(); try{ const decoded:any = jwt.verify(parts[1], process.env.JWT_SECRET || 'DevelopmentSecret'); const user = await User.findById(decoded.id); req.userId = decoded.id ; if(user) req.user = user; }catch(e){} next();
}

router.use(authMiddleware);

router.post('/', async (req: Request, res: Response)=>{
    if(!req.user) return res.status(401).json({ error:'unauthorized' });
    const { text, url, isWarp, mediaType, mentions, hashtags } = req.body;
    if (!text) return  res.status(400).json({message: "Post Content is Required"});
    const p =
        await Post.create({ author: req.user._id, text, url, isWarp, mediaType: mediaType || "None", mentions, hashtags, createdAt: new Date() });
    res.status(201).json(p);
});

router.get('/', async (_req: Request, res: Response)=>{ const posts = await Post.find({ isPublished: true }).sort({ createdAt:-1 }).limit(50).populate('author','username displayName avatarUrl'); res.json(posts); });

router.get('/trending', async (req: Request, res: Response)=>{
    const parsedLimit = Number(req.query.limit);
    const parsedSkip = Number(req.query.skip);
    const limit = Number.isFinite(parsedLimit)
        ? Math.min(Math.max(Math.trunc(parsedLimit), 1), 50)
            : 20;
    const skip = Number.isFinite(parsedSkip)
        ? Math.max(Math.trunc(parsedSkip), 0)
            : 0;


    const trendingPosts = await Post.find({ isPublished: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author','username displayName avatarUrl');

    const total = await Post.countDocuments();

    res.json({ posts: trendingPosts, hasMore: skip + limit < total });
});

router.get('/trending/hashtags', async (req: Request, res: Response)=>{
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

router.delete('/delete/:id', async (req: Request, res: Response) => {
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

router.put('/edit-post/:id', async (req: Request, res: Response) => {
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

// Get user's bookmarked posts
router.get('/bookmarks', async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.userId).populate('bookmarkedPosts');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user.bookmarkedPosts || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle bookmark
router.post('/:postId/bookmark', async (req: Request, res: Response) => {
    try {
        const postId = new mongoose.Types.ObjectId(req.params.postId);
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        if (!req.userId) return res.status(401).json({ error: 'unauthorized' });
        const userId = req.user._id;

        const user = await User.findById(req.userId);

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Check if already bookmarked
        const alreadyBookmarked = user.bookmarkedPosts.some(
            (p: any) => p.toString() === postId.toString()
        );

        if (alreadyBookmarked) {
            // Remove bookmark
            user.bookmarkedPosts = user.bookmarkedPosts.filter(
                (p: any) => p.toString() !== postId.toString()
            );
            // Remove user from post's bookmarkedBy
            post.bookmarkedBy = (post.bookmarkedBy || []).filter(
                (uid: any) => uid.toString() !== req.userId
            );
        } else {
            // Add bookmark
            user.bookmarkedPosts.push(postId);
            // Add user to post's bookmarkedBy
            if (!post.bookmarkedBy) post.bookmarkedBy = [];
            post.bookmarkedBy.push(new mongoose.Types.ObjectId(req.userId));
            const notification = new Notification({
                from: userId,
                to: post.author,
                type: "bookmark",
                fromAvatarUrl: user.avatarUrl,
            });
            await notification.save();
            // @ts-ignore
            sendPushNotification(post.author.toString(), {
                title: 'New Bookmark',
                body: `${user.displayName} bookmarked your post`,
                url: `${process.env.CLIENT_URL}/post/${post._id}`,
            }).catch(err => console.error('Push bookmark error:', err));
        }

        post.bookmarksCount = post.bookmarkedBy.length;
        await user.save();
        await post.save();

        res.json({
            bookmarked: !alreadyBookmarked,
            bookmarksCount: post.bookmarksCount,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/get-post/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const post = await Post.findById(id);

        res.status(200).json(post)
    } catch (err: any) {
        console.error('Error in getUserProfile:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
})

router.post('/like/:id', async (req: Request, res: Response) => {
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
            // @ts-ignore
            sendPushNotification(post.author.toString(), {
                title: 'New Like',
                body: `${currentUser.displayName} liked your post`,
                url: `${process.env.CLIENT_URL}/post/${post._id}`,
            }).catch(err => console.error('Push like error:', err));
            const updatedLikes = post.likes;
            res.status(200).json({ updatedLikes, message: 'Successfully Liked Post' });
        }
    } catch (error) {
        console.log("Error in likeUnlikePost controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/liked-posts/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: "User not found" });

        const likedPosts = await Post.find({ _id: { $in: user.likedPosts }, isPublished: true })
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

router.get('/get-user-posts/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: "User not found", message: "User not found" });

        const posts = await Post.find({ author: user._id, isPublished: true })
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

router.get('/get-truncated-posts/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: "User not found", message: "User not found" });

        const posts = await Post.find({ author: user._id, isPublished: true })
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

router.get('/get-following-posts', async (req: Request, res: Response) => {
    const userId = req.userId;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const followingPosts = await Post.find({ author: { $in: user.following }, isPublished: true })
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

router.post('/react', async (req: Request, res: Response) => {
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
        // @ts-ignore
        sendPushNotification(post.author.toString(), {
            title: 'New Reaction',
            body: `${currentUser.displayName} reacted to your post`,
            url: `${process.env.CLIENT_URL}/post/${post._id}`,
        }).catch(err => console.error('Push react error:', err));
        res.status(200).json({success: true,message: `You have successfully reacted to the post: ${id}`});
    } catch (err: any) {
        console.error('Error in reaction:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }});

// POST /comment – add a comment (with optional media)
router.post('/comment', async (req: Request, res: Response) => {
    try {
        const { text, postId, media } = req.body;
        const userId = req.userId;

        if (!text && !media) {
            return res.status(400).json({ error: "Text or media is required" });
        }

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const person = await User.findById(userId).select("-passwordHash");
        if (!person) return res.status(404).json({ error: "User not found" });

        const comment = {
            user: userId,
            text: text || '',
            media: media || null,
            userAvatar: person.avatarUrl,
            userDisplayName: person.displayName,
            userUsername: person.username,
        };

        // @ts-ignore
        post.comments.push(comment);
        await post.save();

        const populated = await Post.findById(postId)
            .populate('author', 'username displayName avatarUrl')
            .populate('comments.user', 'username displayName avatarUrl');
        res.status(200).json(populated);
    } catch (error) {
        console.error("Error posting comment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /comment/:commentId/reply – reply to a comment
router.post('/comment/:commentId/reply', async (req: Request, res: Response) => {
    try {
        const { commentId } = req.params;
        const { text, media } = req.body;
        const userId = req.userId;

        if (!text && !media) {
            return res.status(400).json({ error: "Text or media is required" });
        }

        const post = await Post.findOne({ 'comments._id': commentId });
        if (!post) return res.status(404).json({ error: "Post not found" });

        const person = await User.findById(userId).select("-passwordHash");
        if (!person) return res.status(404).json({ error: "User not found" });

        // @ts-ignore
        const comment = post.comments.id(commentId);
        if (!comment) return res.status(404).json({ error: "Comment not found" });

        const reply = {
            user: userId,
            text: text || '',
            media: media || null,
            userAvatar: person.avatarUrl,
            userDisplayName: person.displayName,
            userUsername: person.username,
        };

        comment.replies.push(reply);
        await post.save();

        const populated = await Post.findById(post._id)
            .populate('author', 'username displayName avatarUrl')
            .populate('comments.user', 'username displayName avatarUrl');
        res.status(200).json(populated);
    } catch (error) {
        console.error("Error replying to comment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/posts/schedule
router.post('/schedule', async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const { text, url, isWarp, mediaType, mentions, hashtags, scheduledAt } = req.body;

    if (!text && !url) return res.status(400).json({ message: "Post content is required" });

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
        return res.status(400).json({ message: "Scheduled time must be in the future" });
    }

    const post = await Post.create({
        author: req.user._id,
        text,
        url,
        isWarp,
        mediaType: mediaType || "None",
        mentions,
        hashtags,
        scheduledAt: scheduledDate,   // ← Must be present
        isPublished: false,           // ← Must be present
        createdAt: new Date(),
    });

    res.status(201).json(post);
});

export default router;