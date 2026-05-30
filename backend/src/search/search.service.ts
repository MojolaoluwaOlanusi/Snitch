import {User} from "../models/User.ts";
import Post from "../models/Post.ts";
import Message from "../models/Message.ts";
import { buildRegex } from "./search.utils.ts";

export class SearchService {
    static async search(x: { searchWord: any; searchType: any; limit: any; }) {
        const limit = x.limit === undefined ? 10 : x.limit;
        const regex = buildRegex(x.searchWord);

        switch (x.searchType) {
            case "user":
                return this.searchUsers(regex, limit);

            case "post":
                return this.searchPosts(regex, limit);

            case "chat":
                return this.searchChats(regex, limit);

            case "mention":
                return this.searchMentions(x.searchWord, limit);

            case "hashtag":
                return this.searchHashtags(x.searchWord, limit);

            case "all":
            default:
                return this.searchAll(regex, limit);
        }
    }

    private static async searchUsers(regex: RegExp, limit: number) {
        return User.find({
            username: { $regex: regex },
        })
            .sort({ followersCount: -1 }) // recommendation bias
            .limit(limit)
            .select("avatarUrl isBanned isAdmin username displayName");
    }

    private static async searchPosts(regex: RegExp, limit: number) {
        return Post.find({
            text: regex,
        })
            .limit(limit)
            .select("text author createdAt")
            .populate("author", "username avatarUrl");
    }

    private static async searchChats(regex: RegExp, limit: number) {
        return Message.find({
            text: regex,
        })
            .limit(limit)
            .select("text read media createdAt updatedAt");
    }

    private static async searchMentions(username: string, limit: number) {
        return Post.find({
            mentions: username.replace("@", ""),
        })
            .limit(limit)
            .select("text author createdAt")
            .populate("author", "username avatarUrl");
    }

    private static async searchHashtags(tag: string, limit: number) {
        const Hashtags = await Post.find({
            hashtags: tag,
        })
            .limit(limit)
            .select("text author createdAt")
            .populate("author", "username avatarUrl");

        const truncatedTag = tag.slice(0,1);

        const suggestedHashtags = await this.suggestHashtags(truncatedTag);

        return {
            Hashtags,
            suggestedHashtags,
        }
    }

    private static async searchAll(
        regex: RegExp,
        limit: number
    ) {
        const [users, posts, chats] = await Promise.all([
            this.searchUsers(regex, limit),
            this.searchPosts(regex, limit),
            this.searchChats(regex, limit),
        ]);

        return {
            users,
            posts,
            chats,
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