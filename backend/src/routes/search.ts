import express from 'express';
import {SearchService} from "../search/search.service.ts";
import jwt from "jsonwebtoken";
import {User} from "../models/User.ts";
import Post from "../models/Post.ts";

const router = express.Router();

async function authMiddleware(req:any, _res:any,next:any){
    const h = req.headers.authorization; if(!h) return next(); const parts = h.split(' '); if(parts.length!==2) return next(); try{ const decoded:any = jwt.verify(parts[1], process.env.JWT_SECRET || 'DevelopmentSecret'); const user = await User.findById(decoded.id); req.userId = decoded.id ; if(user) req.user = user; }catch(e){} next();
}

router.use(authMiddleware);

router.get("/hashtags/:tag/posts", async (req, res) => {
    try {
        const { tag } = req.params;

        const limit = Number(req.query.limit) || 10;
        const skip = Number(req.query.skip) || 0;

        const posts = await Post.find({
            hashtags: tag.toLowerCase()
        })
            .populate("author", "username displayName avatarUrl")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit + 1);

        const hasMore = posts.length > limit;

        if (hasMore) {
            posts.pop();
        }

        res.status(200).json({
            posts,
            hasMore
        });
    } catch (error) {
        console.error("Hashtag search error:", error);

        res.status(500).json({
            message: "Failed to fetch hashtag posts"
        });
    }
});

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