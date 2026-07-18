import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {User} from '../models/User.js';
const router = express.Router();
async function authMiddleware(req: Request, res: Response, next: any) {
    const h = req.headers.authorization;
    if (!h) return res.status(400).json({error: 'unauthorized'});
    try {
        const token = h.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'DevelopmentSecret');
        req.userId = decoded.id;
        next();
    } catch (e) {
        console.log(`An exception occurred: ${e}`)
        return res.status(401).json({error: 'unauthorized'})
    }
}

router.post('/toggle', authMiddleware, async (req: Request, res: Response)=>{
  const u = await User.findById(req.userId);
  if(!u) return res.status(404).json({ error:'not found' });
  u.incognito = !u.incognito;
  await u.save();
  res.json({ ok:true, incognito: u.incognito });
});

export default router;
