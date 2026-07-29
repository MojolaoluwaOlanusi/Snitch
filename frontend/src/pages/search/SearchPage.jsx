import Sidebar from "../../components/common/Sidebar.jsx";
import {Search, Users, FileText, MessageCircle, AtSign, Hash, TrendingUp, MessageSquare, Users as UsersIcon} from "lucide-react";
import {Input} from "../../components/common/input.tsx"
import {useUserStore} from "../../store/useUserStore.js";
import {useChatStore} from "../../store/useChatStore.js";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import {useState, useEffect} from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {formatPostDate} from "../../utils/date/index.js";
import axiosInstance from "../../lib/axios.js";
import { toast } from "sonner";

const SearchPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { conversations, selectConversation, getConversation } = useChatStore();

    const [searchType, setSearchType] = useState("all");
    const [showSearchType, setShowSearchType] = useState(false);
    const [userSkip, setUserSkip] = useState(0);
    const [postSkip, setPostSkip] = useState(0);
    const [chatSkip, setChatSkip] = useState(0);
    const [mentionSkip, setMentionSkip] = useState(0);
    const [hashtagSkip, setHashtagSkip] = useState(0);
    const [trendingPostsSkip, setTrendingPostsSkip] = useState(0);
    const [trendingHashtagsSkip, setTrendingHashtagsSkip] = useState(0);
    const [currentSearchWord, setCurrentSearchWord] = useState("");
    const [selectedHashtag, setSelectedHashtag] = useState(null);
    const [hashtagPosts, setHashtagPosts] = useState([]);
    const [loadingHashtagPosts, setLoadingHashtagPosts] = useState(false);
    const [loadingMoreUsers, setLoadingMoreUsers] = useState(false);
    const [loadingMorePosts, setLoadingMorePosts] = useState(false);
    const [loadingMoreChats, setLoadingMoreChats] = useState(false);
    const [loadingMoreMentions, setLoadingMoreMentions] = useState(false);
    const [loadingMoreHashtags, setLoadingMoreHashtags] = useState(false);
    const {
        searchItem,
        searchResults,
        isSearching,
        searchHasMore,
        getTrending,
        trendingPosts,
        trendingHashtags,
        isGettingTrending,
        trendingHasMore,
    } = useUserStore();

    useEffect(() => {
        if (location.state?.conversationId && location.state?.messageId) {
            const { conversationId, messageId } = location.state;
            const conv = conversations.find(c => c._id === conversationId);
            if (conv) {
                selectConversation(conv);
                setTimeout(() => {
                    scrollToMessage(messageId);
                }, 500);
            } else {
                getConversation(conversationId).then(conv => {
                    if (conv) {
                        selectConversation(conv);
                        setTimeout(() => scrollToMessage(messageId), 500);
                    }
                });
            }
            navigate('/chat', { replace: true, state: {} });
        }
    }, [location.state]);

    useEffect(() => {
        getTrending();
    }, [getTrending]);

    useEffect(() => {
        if (location.state?.searchWord) {
            setCurrentSearchWord(location.state.searchWord);
            setSearchType(location.state.searchType || 'hashtag');
            setShowSearchType(true);
            searchItem({
                searchWord: location.state.searchWord,
                searchType: location.state.searchType || 'hashtag',
                limit: 10,
                skip: 0
            });
        }
    }, [location.state]);

    useEffect(() => {
        setUserSkip(0);
        setPostSkip(0);
        setChatSkip(0);
        setMentionSkip(0);
        setHashtagSkip(0);

        if (currentSearchWord) {
            searchItem({
                searchWord: currentSearchWord,
                searchType,
                limit: 10,
                skip: 0,
            });
        }
    }, [searchType]);

    const searchTabs = [
        { id: "all", label: "All", icon: Search },
        { id: "user", label: "Users", icon: Users },
        { id: "post", label: "Posts", icon: FileText },
        { id: "chat", label: "Chats", icon: MessageCircle },
        { id: "mention", label: "Mentions", icon: AtSign },
        { id: "hashtag", label: "Hashtags", icon: Hash },
    ];

    const handleHashtagClick = async (tag) => {
        setCurrentSearchWord(tag);
        setSearchType('hashtag');
        setShowSearchType(true);
        searchItem({searchWord: tag, searchType: 'hashtag', limit: 10, skip: 0});

        try {
            setSelectedHashtag(tag);
            setLoadingHashtagPosts(true);

            const res = await axiosInstance.get(
                `/search/hashtags/${tag}/posts`
            );
            setHashtagPosts(res.data.posts);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingHashtagPosts(false);
        }
    };

    const handleLoadMoreTrendingPosts = () => {
        const next = trendingPostsSkip + 20;
        setTrendingPostsSkip(next);
        getTrending(next);
    };

    const handleLoadMoreTrendingHashtags = () => {
        const next = trendingHashtagsSkip + 20;
        setTrendingHashtagsSkip(next);
        getTrending(next);
    };

    const loadMoreUsers = async (e) => {
        e?.preventDefault();
        setLoadingMoreUsers(true);
        const next = userSkip + 10;
        setUserSkip(next);
        await searchItem({
            searchWord: currentSearchWord,
            searchType: "user",
            limit: 10,
            skip: next
        });
        setLoadingMoreUsers(false);
    };

    const loadMorePosts = async (e) => {
        e?.preventDefault();
        setLoadingMorePosts(true);
        const next = postSkip + 10;
        setPostSkip(next);
        await searchItem({
            searchWord: currentSearchWord,
            searchType: "post",
            limit: 10,
            skip: next
        });
        setLoadingMorePosts(false);
    };

    const loadMoreChats = async (e) => {
        e?.preventDefault();
        setLoadingMoreChats(true);
        const next = chatSkip + 10;
        setChatSkip(next);
        await searchItem({
            searchWord: currentSearchWord,
            searchType: "chat",
            limit: 10,
            skip: next
        });
        setLoadingMoreChats(false);
    };

    const loadMoreMentions = async (e) => {
        e?.preventDefault();
        setLoadingMoreMentions(true);
        const next = mentionSkip + 10;
        setMentionSkip(next);
        await searchItem({
            searchWord: currentSearchWord,
            searchType: "mention",
            limit: 10,
            skip: next
        });
        setLoadingMoreMentions(false);
    };

    const loadMoreHashtags = async (e) => {
        e?.preventDefault();
        setLoadingMoreHashtags(true);
        const next = hashtagSkip + 10;
        setHashtagSkip(next);
        await searchItem({
            searchWord: currentSearchWord,
            searchType: "hashtag",
            limit: 10,
            skip: next
        });
        setLoadingMoreHashtags(false);
    };

    const handleChatClick = async (chat) => {
        try {
            // The conversation is already populated in the search results
            const conversation = chat.conversationId;
            
            if (!conversation) {
                toast.error('Conversation not found');
                return;
            }
            
            // Check if conversation exists in local conversations
            let conv = conversations.find(c => c._id === conversation._id);
            
            // If not found locally, add it to the store
            if (!conv) {
                useChatStore.setState(state => ({
                    conversations: [...state.conversations, conversation]
                }));
                conv = conversation;
            }
            
            // Select the conversation
            selectConversation(conv);
            
            // Navigate to chat with the conversation and message info
            navigate('/chat', {
                state: {
                    conversationId: conversation._id,
                    messageId: chat._id,
                    scrollToMessage: true
                }
            });
        } catch (error) {
            console.error('Error handling chat click:', error);
            toast.error('Could not open conversation');
        }
    };

    const renderSearchResult = (item, index, type) => {
        if (type === "user") {
            return (
                <Link to={`/profile/${item.username}`} key={index} className="block">
                    <div className="flex items-center gap-4 p-4 bg-base-100 rounded-xl border border-base-300 hover:border-primary/20 hover:shadow-md transition-all duration-200">
                        <div className="avatar">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/20">
                                <img src={item.avatarUrl || "/avatar-placeholder.png"} alt={item.displayName} className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-base-content">{item.displayName}</h3>
                            <p className="text-sm text-base-content/60">@{item.username}</p>
                        </div>
                    </div>
                </Link>
            );
        }

        if (type === "post") {
            return (
                <Link to={`/post/${item._id}`} key={index} className="block">
                    <div className="p-4 bg-base-100 rounded-xl border border-base-300 hover:border-primary/20 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="avatar">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/20">
                                    <img src={item.author?.avatarUrl || "/avatar-placeholder.png"} alt={item.author?.displayName} className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-base-content">{item.author?.displayName}</h3>
                                <p className="text-sm text-base-content/60">@{item.author?.username} · {formatPostDate(item.createdAt)}</p>
                            </div>
                        </div>
                        <p className="text-base-content/80 line-clamp-2">{item.text}</p>
                    </div>
                </Link>
            );
        }

        if (type === "mention") {
            return (
                <Link to={`/profile/${item.author?.username}`} key={index} className="block">
                    <div className="flex items-center gap-4 p-4 bg-base-100 rounded-xl border border-base-300 hover:border-primary/20 hover:shadow-md transition-all duration-200">
                        <div className="avatar">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/20">
                                <img src={item.author?.avatarUrl || "/avatar-placeholder.png"} alt={item.author?.displayName} className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-base-content">{item.author?.displayName}</h3>
                            <p className="text-sm text-base-content/60">@{item.author?.username}</p>
                            <p className="text-xs text-base-content/50 mt-1">Mentioned in post</p>
                        </div>
                    </div>
                </Link>
            );
        }

        if (type === "chat") {
            const isGroup = item.conversationId?.isGroup || false;
            const sender = item.senderId;
            const conversation = item.conversationId;
            
            // For one-on-one chats, find the other participant (not the sender)
            const otherUser = !isGroup && conversation?.participants?.find(p => p._id !== sender?._id);
            
            return (
                <div key={index} onClick={() => handleChatClick(item)} className="cursor-pointer">
                    <div className="flex items-center gap-4 p-4 bg-base-100 rounded-xl border border-base-300 hover:border-primary/20 hover:shadow-md transition-all duration-200">
                        <div className="avatar">
                            {isGroup ? (
                                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: conversation?.avatarColor || '#6366f1' }}>
                                    {conversation?.groupAvatar ? (
                                        <img src={conversation.groupAvatar} alt={conversation.groupName || 'Group'} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{conversation.groupName?.charAt(0) || 'G'}</span>
                                    )}
                                </div>
                            ) : (
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/20">
                                    <img 
                                        src={otherUser?.avatarUrl || sender?.avatarUrl || "/avatar-placeholder.png"} 
                                        alt={otherUser?.displayName || sender?.displayName || 'User'} 
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-base-content">
                                {isGroup ? (conversation?.groupName || 'Group Chat') : (otherUser?.displayName || sender?.displayName || 'User')}
                            </h3>
                            <p className="text-sm text-base-content/60 line-clamp-1">{item.text}</p>
                            <p className="text-xs text-base-content/50 mt-1">{formatPostDate(item.createdAt)}</p>
                        </div>
                    </div>
                </div>
            );
        }

        if (type === "hashtag") {
            return (
                <div key={index} onClick={() => handleHashtagClick(item.tag)} className="cursor-pointer">
                    <div className="p-4 bg-base-100 rounded-xl border border-base-300 hover:border-primary/20 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3">
                            <Hash className="w-6 h-6 text-primary" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-base-content">#{item.tag}</h3>
                                <p className="text-sm text-base-content/60">{item.count || 0} posts</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    const hasNoResults = () => {
        if (!searchResults) return true;

        if (Array.isArray(searchResults)) {
            return searchResults.length === 0;
        }

        if (
            searchType === "all" &&
            typeof searchResults === "object" &&
            searchResults.all
        ) {
            return (
                (!searchResults.all.users ||
                    searchResults.all.users.length === 0) &&
                (!searchResults.all.posts ||
                    searchResults.all.posts.length === 0) &&
                (!searchResults.all.chats ||
                    searchResults.all.chats.length === 0)
            );
        }

        if (
            searchType === "hashtag" &&
            typeof searchResults === "object"
        ) {
            return (
                (!searchResults.hashtags ||
                    searchResults.hashtags.length === 0) &&
                (!searchResults.suggestedHashtags ||
                    searchResults.suggestedHashtags.length === 0)
            );
        }

        return false;
    };

    return (
        <div className="w-full flex flex-col md:flex-row h-screen bg-base-200">
            <Sidebar/>
            <main className="flex-1 flex flex-col h-screen overflow-hidden">

                <div className="sticky top-0 z-10 bg-base-200 p-4 md:p-6 border-b border-base-300">
                    <div className="w-full">
                        <div className="bg-base-100 rounded-2xl shadow-sm p-4 sm:p-6">
                            <div className="relative mb-4">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50" />
                                <Input
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        const cleaned = value
                                            .replace(/[#@]/g, "")
                                            .trim();

                                        if (!cleaned) {
                                            setShowSearchType(false);
                                            setCurrentSearchWord("");
                                            setUserSkip(0);
                                            setPostSkip(0);
                                            setChatSkip(0);
                                            setMentionSkip(0);
                                            setHashtagSkip(0);

                                            useUserStore.setState({
                                                searchResults: {
                                                    users: [],
                                                    posts: [],
                                                    chats: [],
                                                    mentions: [],
                                                    hashtags: [],
                                                    suggestedHashtags: [],
                                                    all: {
                                                        users: [],
                                                        posts: [],
                                                        chats: []
                                                    }
                                                }
                                            });

                                            return;
                                        }

                                        setShowSearchType(true);
                                        setUserSkip(0);
                                        setPostSkip(0);
                                        setChatSkip(0);
                                        setMentionSkip(0);
                                        setHashtagSkip(0);
                                        setCurrentSearchWord(cleaned);

                                        searchItem({
                                            searchWord: cleaned,
                                            searchType,
                                            limit: 10,
                                            skip: 0
                                        });
                                    }}
                                    placeholder="Search for people, hashtags, mentions, chats, or posts..."
                                    className="pl-12 h-12 bg-base-200 border-base-300 focus:border-primary/20 focus:ring-2 focus:ring-primary/20/20 rounded-xl text-base-content placeholder-gray-400"
                                />
                            </div>

                            {showSearchType && (
                                <div className="flex flex-wrap gap-2">
                                    {searchTabs.map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setSearchType(tab.id)}
                                                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full transition-all duration-200 text-sm ${
                                                    searchType === tab.id
                                                        ? "bg-primary/20 text-base-content font-medium"
                                                        : "bg-base-200 text-base-content/70 hover:bg-base-300"
                                                }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className="hidden sm:inline">{tab.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="w-full">
                        <div className="space-y-4">
                            {isSearching && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <LoadingSpinner size="lg" />
                                    <p className="mt-4 text-base-content/60">Searching...</p>
                                </div>
                            )}

                            {!isSearching && !showSearchType && (
                                <div className="space-y-6">
                                    <div className="bg-base-100 rounded-2xl shadow-sm p-8 sm:p-12 text-center">
                                        <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                        <h2 className="text-xl font-semibold text-base-content mb-2">Discover what's happening</h2>
                                        <p className="text-base-content/60">Search for people, posts, hashtags, and more</p>
                                    </div>

                                    {isGettingTrending ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <LoadingSpinner size="lg" />
                                            <p className="mt-4 text-base-content/60">Loading trending content...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {trendingPosts && trendingPosts.length > 0 && (
                                                <div className="bg-base-100 rounded-2xl shadow-sm p-4 sm:p-6">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <TrendingUp className="w-5 h-5 text-primary" />
                                                        <h3 className="text-lg font-semibold text-base-content">Trending Posts</h3>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {trendingPosts.map((post) => (
                                                            <Link to={`/post/${post._id}`} key={post._id} className="block">
                                                                <div className="p-4 rounded-xl border border-base-300 hover:border-primary/20 hover:shadow-md transition-all duration-200">
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <div className="avatar">
                                                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/20">
                                                                                <img src={post.author?.avatarUrl || "/avatar-placeholder.png"} alt={post.author?.displayName} className="w-full h-full object-cover" />
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-semibold text-base-content text-sm">{post.author?.displayName}</h4>
                                                                            <p className="text-xs text-base-content/60">@{post.author?.username}</p>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-base-content/80 text-sm line-clamp-2">{post.text}</p>
                                                                    <div className="flex items-center gap-4 mt-2 text-xs text-base-content/60">
                                                                        <span>{post.likes?.length || 0} likes</span>
                                                                        <span>{post.comments?.length || 0} comments</span>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                    {trendingHasMore.posts && (
                                                        <button
                                                            disabled={isSearching}
                                                            onClick={handleLoadMoreTrendingPosts}
                                                            className={`w-full mt-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                                                isSearching
                                                                    ? "bg-base-300 cursor-not-allowed"
                                                                    : "bg-primary/10 hover:bg-primary/20 text-primary"
                                                            }`}
                                                        >
                                                            Load More
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {trendingHashtags && trendingHashtags.length > 0 && (
                                                <div className="bg-base-100 rounded-2xl shadow-sm p-4 sm:p-6">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Hash className="w-5 h-5 text-primary" />
                                                        <h3 className="text-lg font-semibold text-base-content">Trending Hashtags</h3>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {trendingHashtags.map((hashtag, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => handleHashtagClick(hashtag.tag)}
                                                                className="px-4 py-2 bg-base-200 hover:bg-primary/20 rounded-full text-sm text-base-content/80 hover:text-base-content transition-all duration-200"
                                                            >
                                                                #{hashtag.tag}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {trendingHasMore.hashtags && (
                                                        <button
                                                            onClick={handleLoadMoreTrendingHashtags}
                                                            disabled={isSearching}
                                                            className={`w-full mt-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                                                isSearching
                                                                    ? "bg-base-300 cursor-not-allowed"
                                                                    : "bg-primary/10 hover:bg-primary/20 text-primary"
                                                            }`}
                                                        >
                                                            Load More
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {!isSearching &&
                                showSearchType &&
                                hasNoResults() && (
                                    <div className="bg-base-100 rounded-2xl shadow-sm p-8 sm:p-12 text-center">
                                        <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                        <h2 className="text-xl font-semibold text-base-content mb-2">No results found</h2>
                                        <p className="text-base-content/60">Try different keywords or search filters</p>
                                    </div>
                                )}

                            {!isSearching && searchResults && (
                                <div className="space-y-3">
                                    {searchType === "all" && typeof searchResults === 'object' && !Array.isArray(searchResults) ? (
                                        <>
                                            {searchResults.all.users && searchResults.all.users.length > 0 && (
                                                <div className="mb-6">
                                                    <h3 className="text-lg font-semibold text-base-content mb-3">Users</h3>
                                                    <div className="space-y-3">
                                                        {searchResults.all.users.map((item, index) => renderSearchResult(item, index, 'user'))}
                                                    </div>
                                                    {searchHasMore.users && (
                                                        <button
                                                            onClick={loadMoreUsers}
                                                            disabled={loadingMoreUsers}
                                                            className={`w-full mt-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                                                loadingMoreUsers
                                                                    ? "bg-base-300 cursor-not-allowed"
                                                                    : "bg-primary/10 hover:bg-primary/20 text-primary"
                                                            }`}
                                                        >
                                                            {loadingMoreUsers ? 'Loading...' : 'Load More'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {searchResults.all.posts && searchResults.all.posts.length > 0 && (
                                                <div className="mb-6">
                                                    <h3 className="text-lg font-semibold text-base-content mb-3">Posts</h3>
                                                    <div className="space-y-3">
                                                        {searchResults.all.posts.map((item, index) => renderSearchResult(item, index, 'post'))}
                                                    </div>
                                                    {searchHasMore.posts && (
                                                        <button
                                                            onClick={loadMorePosts}
                                                            disabled={loadingMorePosts}
                                                            className={`w-full mt-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                                                loadingMorePosts
                                                                    ? "bg-base-300 cursor-not-allowed"
                                                                    : "bg-primary/10 hover:bg-primary/20 text-primary"
                                                            }`}
                                                        >
                                                            {loadingMorePosts ? 'Loading...' : 'Load More'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {searchResults.all.chats && searchResults.all.chats.length > 0 && (
                                                <div className="mb-6">
                                                    <h3 className="text-lg font-semibold text-base-content mb-3">Messages</h3>
                                                    <div className="space-y-3">
                                                        {searchResults.all.chats.map((item, index) => renderSearchResult(item, index, 'chat'))}
                                                    </div>
                                                    {searchHasMore.chats && (
                                                        <button
                                                            onClick={loadMoreChats}
                                                            disabled={loadingMoreChats}
                                                            className={`w-full mt-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                                                loadingMoreChats
                                                                    ? "bg-base-300 cursor-not-allowed"
                                                                    : "bg-primary/10 hover:bg-primary/20 text-primary"
                                                            }`}
                                                        >
                                                            {loadingMoreChats ? 'Loading...' : 'Load More'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : searchType === "hashtag" && typeof searchResults === 'object' && !Array.isArray(searchResults) ? (
                                        <>
                                            {searchResults.hashtags && searchResults.hashtags.length > 0 && (
                                                <div className="mb-6">
                                                    <h3 className="text-lg font-semibold text-base-content mb-3">Posts with #{currentSearchWord || 'hashtag'}</h3>
                                                    <div className="space-y-3">
                                                        {searchResults.hashtags.map((item, index) => renderSearchResult(item, index, 'post'))}
                                                    </div>
                                                    {searchHasMore.hashtags && (
                                                        <button
                                                            onClick={loadMoreHashtags}
                                                            disabled={loadingMoreHashtags}
                                                            className={`w-full mt-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                                                loadingMoreHashtags
                                                                    ? "bg-base-300 cursor-not-allowed"
                                                                    : "bg-primary/10 hover:bg-primary/20 text-primary"
                                                            }`}
                                                        >
                                                            {loadingMoreHashtags ? 'Loading...' : 'Load More'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {searchResults.suggestedHashtags && searchResults.suggestedHashtags.length > 0 && (
                                                <div className="mb-6">
                                                    <h3 className="text-lg font-semibold text-base-content mb-3">Suggested Hashtags</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {searchResults.suggestedHashtags.map((item, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => handleHashtagClick(item._id)}
                                                                className="px-4 py-2 bg-base-200 hover:bg-primary/20 rounded-full text-sm text-base-content/80 hover:text-base-content transition-all duration-200"
                                                            >
                                                                #{item._id}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedHashtag && (
                                                <div className="mt-6">
                                                    <h3 className="text-lg font-semibold text-base-content mb-3">
                                                        Posts with #{selectedHashtag}
                                                    </h3>

                                                    <div className="space-y-3">
                                                        {hashtagPosts?.map((post) =>
                                                            renderSearchResult(post, post._id, "post")
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : Array.isArray(searchResults) && searchResults.length > 0 ? (
                                        <>
                                            {searchResults.map((item, index) => renderSearchResult(item, index, searchType))}
                                        </>
                                    ) : searchType === "user" &&
                                    searchResults.users &&
                                    searchResults.users.length > 0 ? (
                                        <>
                                            {searchResults.users.map((item, index) =>
                                                renderSearchResult(item, index, "user")
                                            )}

                                            {searchHasMore.users && (
                                                <button
                                                    onClick={loadMoreUsers}
                                                    disabled={loadingMoreUsers}
                                                    className={`w-full mt-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                                        loadingMoreUsers
                                                            ? "bg-base-300 cursor-not-allowed"
                                                            : "bg-primary/10 hover:bg-primary/20 text-primary"
                                                    }`}
                                                >
                                                    {loadingMoreUsers ? 'Loading...' : 'Load More'}
                                                </button>
                                            )}
                                        </>
                                    ) : searchType === "post" && searchResults.posts && searchResults.posts.length > 0 ? (
                                        <>
                                            {searchResults.posts.map((item, index) => renderSearchResult(item, index, 'post'))}
                                            {searchHasMore.posts && (
                                                <button onClick={loadMorePosts} disabled={loadingMorePosts}
                                                        className={`w-full mt-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                                            loadingMorePosts ? "bg-base-300 cursor-not-allowed" : "bg-primary/10 hover:bg-primary/20 text-primary"
                                                        }`}>
                                                    {loadingMorePosts ? 'Loading...' : 'Load More'}
                                                </button>
                                            )}
                                        </>
                                    ) : searchType === "chat" && searchResults.chats && searchResults.chats.length > 0 ? (
                                        <>
                                            {searchResults.chats.map((item, index) => renderSearchResult(item, index, 'chat'))}
                                            {searchHasMore.chats && (
                                                <button onClick={loadMoreChats} disabled={loadingMoreChats}
                                                        className={`w-full mt-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                                            loadingMoreChats ? "bg-base-300 cursor-not-allowed" : "bg-primary/10 hover:bg-primary/20 text-primary"
                                                        }`}>
                                                    {loadingMoreChats ? 'Loading...' : 'Load More'}
                                                </button>
                                            )}
                                        </>
                                    ) : searchType === "mention" && searchResults.mentions && searchResults.mentions.length > 0 ? (
                                        <>
                                            {searchResults.mentions.map((item, index) => renderSearchResult(item, index, 'mention'))}
                                            {searchHasMore.mentions && (
                                                <button onClick={loadMoreMentions} disabled={loadingMoreMentions}
                                                        className={`w-full mt-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                                            loadingMoreMentions ? "bg-base-300 cursor-not-allowed" : "bg-primary/10 hover:bg-primary/20 text-primary"
                                                        }`}>
                                                    {loadingMoreMentions ? 'Loading...' : 'Load More'}
                                                </button>
                                            )}
                                        </>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
export default SearchPage
