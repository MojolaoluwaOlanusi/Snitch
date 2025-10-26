import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
const router = express.Router();
function signAccess(id:string){ return jwt.sign({ id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '15m' }); }
function signRefresh(id:string){ return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'devrefresh', { expiresIn: '30d' }); }
router.post('/signup', async (req,res)=>{ const { email, username, password, accountType } = req.body; if(!email||!username||!password) return res.status(400).json({ error:'missing' }); const h = await bcrypt.hash(password, 10); try{ const u = await User.create({ email, username, passwordHash: h, displayName: username, accountType }); res.json({ id: u._id }); }catch(e:any){ res.status(400).json({ error: e.message }); } });
router.post('/login', async (req,res)=>{ const { email, password } = req.body; const u = await User.findOne({ email }); if(!u) return res.status(401).json({ error:'invalid' }); const ok = bcrypt.compareSync(password, u.passwordHash!); if(!ok) return res.status(401).json({ error:'invalid' }); if(u.isBanned) return res.status(403).json({ error:'banned' }); const access = signAccess(String(u._id)); const refresh = signRefresh(String(u._id)); res.json({ access, refresh, user: { id: u._id, username: u.username } }); });
export default router;
