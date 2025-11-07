import express from 'express';
import Message, {Thread} from '../models/Message';
import jwt from 'jsonwebtoken';

const router = express.Router();
async function auth(req: any, res: any, next: any) {
    const h = req.headers.authorization;
    if (!h) return res.status(401).json({error: 'unauth'});
    try {
        const token = h.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
        (req as any).userId = decoded.id;
        next();
    } catch (e) {
        return res.status(401).json({error: 'invalid'});
    }
}
router.post('/threads', auth, async (req,res)=>{ const { participants } = req.body; const uniq = Array.from(new Set([...(participants||[]).map(String), String((req as any).userId)])); let thread = await Thread.findOne({ participants: { $all: uniq, $size: uniq.length } }); if(!thread) thread = await Thread.create({ participants: uniq, lastMessageAt: new Date() }); res.json(thread); });
router.post('/threads/:id/messages', auth, async (req,res)=>{ const { body, attachments } = req.body; const thread = await Thread.findById(req.params.id); if(!thread) return res.status(404).json({ error:'thread not found' }); const msg = await Message.create({ threadId: thread._id, sender: (req as any).userId, body, attachments, readBy: [(req as any).userId] }); thread.lastMessageAt = msg.createdAt; await thread.save(); try{ const io = (globalThis as any).io; if(io) io.to('thread:'+String(thread._id)).emit('message:new', { threadId: thread._id, message: msg }); }catch(e){} res.status(201).json(msg); });
router.get('/threads', auth, async (req,res)=>{ const threads = await Thread.find({ participants: (req as any).userId }).sort({ lastMessageAt:-1 }); res.json(threads); });
router.get('/threads/:id/messages', auth, async (req,res)=>{ const msgs = await Message.find({ threadId: req.params.id }).sort({ createdAt:1 }).limit(200); res.json(msgs); });
export default router;
