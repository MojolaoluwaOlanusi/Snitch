import express from 'express';
import Post from '../models/Post.ts';
import jwt from 'jsonwebtoken';
import {User} from'../models/User.ts';
import { sendPushNotification } from '../utils/pushNotifications.ts';
import Notification from '../models/Notification.ts'
const router = express.Router();
async function auth(req:any,res:any,next:any){ const h=req.headers.authorization; if(!h) return res.status(401).json({ error:'unauth' }); try{ const token = h.split(' ')[1]; const decoded:any = jwt.verify(token, process.env.JWT_SECRET || 'devsecret'); req.userId = decoded.id; next(); }catch(e){ return res.status(401).json({ error:'invalid' }); } }

// POST /api/reposts { postId }
router.post('/:postId', auth, async (req,res)=>{
  const { postId } = req.params;
  const currentUser = await User.findById(req.userId);
  if (!currentUser){
      return res.status(400).json({ error: "UserId is required", message: "UserId is required!"});
  }
  if(!postId) return res.status(400).json({ error:'missing' });
  const original = await Post.findById(postId);
  const author = await Post.findById(postId).select("author");
  if(!original) return res.status(404).json({ error:'not found' });
  const repost = await Post.create({ author: req.userId, text: original.text, mediaType: original.mediaType, url: original.url, repostOf: original._id, createdAt: new Date() });

    const newNotification = new Notification({
      type: "repost",
      from: req.userId,
        // @ts-ignore
      to: author.author,
      fromAvatarUrl: currentUser.avatarUrl,
    });

    await Post.findByIdAndUpdate(
        postId,
        { $inc: { repostCount: 1 } },
        { new: true }
    );

    await newNotification.save();
    sendPushNotification(post.author.toString(), {
        title: 'New Repost',
        body: `${currentUser.displayName} reposted your post`,
        url: `${process.env.CLIENT_URL}/post/${post._id}`,
    }).catch(err => console.error('Push repost error:', err));
  try{ const io = (globalThis as any).io; if(io) io.emit('post:repost', { repost }); }catch(e){}
  res.status(201).json(repost);
});

export default router;
