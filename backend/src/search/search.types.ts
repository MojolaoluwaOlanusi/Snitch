export enum SearchType {
    POST = "post",
    USER = "user",
    CHAT = "chat",
    MENTION = "mention",
    HASHTAG = "hashtag",
    ALL = "all",
}

export interface SearchQuery {
    searchWord: string;
    searchType: SearchType;
    limit?: number;
}
