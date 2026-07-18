import {User} from "../models/User.js";
import Post from "../models/Post.js";
import Message from "../models/Message.js";
import { buildRegex } from "./search.utils.js";

export class SearchService {
    static async search(x: { searchWord: any; searchType: any; limit: any; skip?: any; }) {
        const parsedLimit = Number(x.limit);
        const parsedSkip = Number(x.skip);
        const limit = Number.isFinite(parsedLimit)
            ? Math.min(Math.max(Math.trunc(parsedLimit), 1), 50)
            : 10;
        const skip = Number.isFinite(parsedSkip)
            ? Math.max(Math.trunc(parsedSkip), 0)
            : 0;
        const regex = buildRegex(x.searchWord);

        switch (x.searchType) {
            case "user":
                return this.searchUsers(regex, limit, skip);

            case "post":
                return this.searchPosts(regex, limit, skip);

            case "chat":
                return this.searchChats(regex, limit, skip);

            case "mention":
                return this.searchMentions(x.searchWord, limit, skip);

            case "hashtag":
                return this.searchHashtags(x.searchWord, limit, skip);

            case "all":
            default:
                return this.searchAll(regex, limit, skip);
        }
    }

    private static async searchUsers(regex: RegExp, limit: number, skip: number) {
        const users = await User.find({
            username: { $regex: regex },
        })
            .sort({ followersCount: -1 }) // recommendation bias
            .skip(skip)
            .limit(limit)
            .select("avatarUrl isBanned isAdmin username displayName");
        
        const total = await User.countDocuments({ username: { $regex: regex } });
        
        return { users, hasMore: skip + limit < total };
    }

    private static async searchPosts(regex: RegExp, limit: number, skip: number) {
        const posts = await Post.find({
            text: regex,
            isPublished: true
        })
            .skip(skip)
            .limit(limit)
            .select("text author createdAt")
            .populate("author", "username avatarUrl");
        
        const total = await Post.countDocuments({ text: regex });
        
        return { posts, hasMore: skip + limit < total };
    }

    private static async searchChats(regex: RegExp, limit: number, skip: number) {
        const chats = await Message.find({
            text: regex,
        })
            .skip(skip)
            .limit(limit)
            .select("text read media createdAt updatedAt conversationId");   // <-- add conversationId

        const total = await Message.countDocuments({ text: regex });

        return { chats, hasMore: skip + limit < total };
    }

    private static async searchMentions(username: string, limit: number, skip: number) {
        const posts = await Post.find({
            mentions: username,
            isPublished: true
        })
            .skip(skip)
            .limit(limit)
            .select("text author createdAt")
            .populate("author", "username avatarUrl");
        
        const total = await Post.countDocuments({ mentions: username });
        
        return { posts, hasMore: skip + limit < total };
    }

    private static async searchHashtags(tag: string, limit: number, skip: number) {
        const Hashtags = await Post.find({
            hashtags: tag,
            isPublished: true
        })
            .skip(skip)
            .limit(limit)
            .select("text author createdAt")
            .populate("author", "username avatarUrl");

        const total = await Post.countDocuments({ hashtags: tag });
        
        const truncatedTag = tag.slice(0,1);

        const suggestedHashtags = await this.suggestHashtags(truncatedTag);

        return {
            Hashtags,
            suggestedHashtags,
            hasMore: skip + limit < total
        }
    }

    private static async searchAll(
        regex: RegExp,
        limit: number,
        skip: number
    ) {
        const [users, posts, chats] = await Promise.all([
            this.searchUsers(regex, limit, skip),
            this.searchPosts(regex, limit, skip),
            this.searchChats(regex, limit, skip)
        ]);

        return {
            users: users.users,
            posts: posts.posts,
            chats: chats.chats,
            hasMore: {
                users: users.hasMore,
                posts: posts.hasMore,
                chats: chats.hasMore
            }
        };
    }

    private static async suggestHashtags(prefix: string) {
        return Post.aggregate([
            { $unwind: "$hashtags" },
            {
                $match: {
                    hashtags: { $regex: `^${prefix}`, $options: "i" },
                },
            },
            {
                $group: {
                    _id: "$hashtags",
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);
    }
}