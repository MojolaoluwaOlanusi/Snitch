import express from 'express';
import jwt from 'jsonwebtoken';
import {User} from '../models/User.ts';
const router = express.Router();
async function auth(req:any,res:any,next:any){ const h=req.headers.authorization; if(!h) return res.status(401).json({ error:'unauth' }); try{ const token = h.split(' ')[1]; const decoded:any = jwt.verify(token, process.env.JWT_SECRET || 'devsecret'); req.userId = decoded.id; next(); }catch(e){ return res.status(401).json({ error:'invalid' }); } }

router.post('/toggle', auth, async (req,res)=>{
  const u = await User.findById(req.userId);
  if(!u) return res.status(404).json({ error:'not found' });
  u.incognito = !u.incognito;
  await u.save();
  res.json({ ok:true, incognito: u.incognito });
});

export default router;
