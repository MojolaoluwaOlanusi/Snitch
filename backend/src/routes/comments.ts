import express from 'express';
import Comment from '../models/Comment.ts';
import Post from '../models/Post.ts';
import jwt from 'jsonwebtoken';
const router = express.Router();

async function auth(req:any,res:any,next:any){
  const h = req.headers.authorization; if(!h) return res.status(401).json({ error:'unauth' });
  try{ const token = h.split(' ')[1]; const decoded:any = jwt.verify(token, process.env.JWT_SECRET || '8faf706b7031dec317d2b87357ab5bb179a11ed0e4ee1874d4f272be0f0c6f25bdd944d5024fa7546c5d9dbedd3c5e859ab06c6c54379095cb9e052e3b19f203'); req.userId = decoded.id; next(); }catch(e){ return res.status(401).json({ error:'invalid' }); }
}

// Create comment on a post or comment (supports text, media, sticker)
// POST /api/comments
router.post('/', auth, async (req,res)=>{
  const { targetType, targetId, text, media } = req.body; // media: [{url,type}]
  if(!targetType || !targetId) return res.status(400).json({ error:'missing target' });
  const c = await Comment.create({ author: req.userId, targetType, targetId, text, media, createdAt: new Date() });
  // increment commentCount on post if targetType==Post
  if(targetType === 'Post'){
    await Post.findByIdAndUpdate(targetId, { $inc: { commentCount: 1 } }).catch(()=>{});
  }
  try{ const io = (globalThis as any).io; if(io) io.emit('comment:new', { comment: c }); }catch(e){}
  res.status(201).json(c);
});

// Get comments for a target
router.get('/:targetType/:targetId', async (req,res)=>{
  const { targetType, targetId } = req.params;
  const comments = await Comment.find({ targetType, targetId }).sort({ createdAt: 1 });
  res.json(comments);
});

export default router;
