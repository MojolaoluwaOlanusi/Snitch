import express from 'express';
import Post from '../models/Post.ts';
import {User} from '../models/User.ts';
const router = express.Router();
// simple middleware to set req.user from Authorization header (bearer token)
import jwt from 'jsonwebtoken';
async function authMiddleware(req:any,res:any,next:any){
  const h = req.headers.authorization; if(!h) return next(); const parts = h.split(' '); if(parts.length!==2) return next(); try{ const decoded:any = jwt.verify(parts[1], process.env.JWT_SECRET || 'devsecret'); const user = await User.findById(decoded.id); if(user) req.user = user; }catch(e){} next();
}
router.use(authMiddleware);
router.post('/', async (req,res)=>{ if(!req.user) return res.status(401).json({ error:'unauth' }); const { text, media, isWarp } = req.body; const p = await Post.create({ author: req.user._id, text, media, isWarp, createdAt: new Date() }); res.status(201).json(p); });
router.get('/', async (req,res)=>{ const posts = await Post.find().sort({ createdAt:-1 }).limit(50).populate('author','username displayName avatarUrl'); res.json(posts); });
export default router;
