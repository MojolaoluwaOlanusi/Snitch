import express from 'express';
import {SearchService} from "../search/search.service.ts";
import jwt from "jsonwebtoken";
import {User} from "../models/User.ts";

const router = express.Router();

async function authMiddleware(req:any, _res:any,next:any){
    const h = req.headers.authorization; if(!h) return next(); const parts = h.split(' '); if(parts.length!==2) return next(); try{ const decoded:any = jwt.verify(parts[1], process.env.JWT_SECRET || 'DevelopmentSecret'); const user = await User.findById(decoded.id); req.userId = decoded.id ; if(user) req.user = user; }catch(e){} next();
}

router.use(authMiddleware);

router.get("/:searchType/:searchWord/:limit", async (req, res) => {

    if (!req.user) return res.status(401).json({ error:'unauthorized' });

    const { searchType } = req.params;
    const { searchWord } = req.params;
    const limitNum = Number(req.params.limit);
    const skipNum = Number(req.query.skip || 0);

    const response = await SearchService.search({
        searchWord,
        searchType,
        limit: limitNum,
        skip: skipNum
    });

    res.json(response);
});

export default router;