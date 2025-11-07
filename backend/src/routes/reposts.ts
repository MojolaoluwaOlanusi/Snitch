import express from 'express';
import Post from '../models/Post.ts';
import jwt from 'jsonwebtoken';
const router = express.Router();
async function auth(req:any,res:any,next:any){ const h=req.headers.authorization; if(!h) return res.status(401).json({ error:'unauth' }); try{ const token = h.split(' ')[1]; const decoded:any = jwt.verify(token, process.env.JWT_SECRET || 'devsecret'); req.userId = decoded.id; next(); }catch(e){ return res.status(401).json({ error:'invalid' }); } }

// POST /api/reposts { postId }
router.post('/', auth, async (req,res)=>{
  const { postId } = req.body;
  if(!postId) return res.status(400).json({ error:'missing' });
  const original = await Post.findById(postId);
  if(!original) return res.status(404).json({ error:'not found' });
  const repost = await Post.create({ author: req.userId, text: original.text, media: original.media, repostOf: original._id, createdAt: new Date() });
  try{ const io = (globalThis as any).io; if(io) io.emit('post:repost', { repost }); }catch(e){}
  res.status(201).json(repost);
});

export default router;
