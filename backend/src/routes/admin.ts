import express from 'express';
import User from '../models/User';
import Warning from '../models/Warning';
import jwt from 'jsonwebtoken';
const router = express.Router();

async function auth(req:any,res:any,next:any){ const h=req.headers.authorization; if(!h) return res.status(401).json({ error:'unauth' }); try{ const token = h.split(' ')[1]; const decoded:any = jwt.verify(token, process.env.JWT_SECRET || 'devsecret'); req.userId = decoded.id; const u = await User.findById(req.userId); if(!u) return res.status(401).json({ error:'unauth' }); req.user = u; next(); }catch(e){ return res.status(401).json({ error:'invalid' }); } }

// Require admin middleware
function requireAdmin(req:any,res:any,next:any){ if(!req.user || !req.user.isAdmin) return res.status(403).json({ error:'forbidden' }); next(); }

// Issue a warning to a user: POST /api/admin/warn/:userId { reason }
router.post('/warn/:userId', auth, requireAdmin, async (req,res)=>{
  const { userId } = req.params; const { reason } = req.body;
  const w = await Warning.create({ userId, issuedBy: req.userId, reason, createdAt: new Date() });
  const u = await User.findByIdAndUpdate(userId, { $inc: { warningsCount: 1 } }, { new: true });
  if(u && u.warningsCount >= 3 && !u.isBanned){ u.isBanned = true; await u.save(); }
  try{ const io = (globalThis as any).io; if(io) io.emit('user:warned', { userId, warnings: u ? u.warningsCount : 0 }); }catch(e){}
  res.json({ ok: true, warning: w });
});

export default router;
