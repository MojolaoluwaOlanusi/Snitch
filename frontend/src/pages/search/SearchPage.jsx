import Sidebar from "../../components/common/Sidebar";
import {Search, Users, FileText, MessageCircle, AtSign, Hash, TrendingUp, MessageSquare} from "lucide-react";
import {Input} from "../../components/common/input"
import {useUserStore} from "../../store/useUserStore";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {useState, useEffect} from "react";
import {Link} from "react-router-dom";
import {formatPostDate} from "../../utils/date";

const SearchPage = () => {

    const [searchType, setSearchType] = useState("all");
    const [showSearchType, setShowSearchType] = useState(false);
    const [searchSkip, setSearchSkip] = useState(0);
    const [trendingSkip, setTrendingSkip] = useState(0);
    const [currentSearchWord, setCurrentSearchWord] = useState("");
    const { searchItem, searchResult, isSearching, searchHasMore, getTrending, trendingPosts, trendingHashtags, isGettingTrending, trendingHasMore } = useUserStore();

    useEffect(() => {
        getTrending();
    }, [getTrending]);

    useEffect(() => {
        setSearchSkip(0);
    }, [searchType]);

    const searchTabs = [
        { id: "all", label: "All", icon: Search },
        { id: "user", label: "Users", icon: Users },
        { id: "post", label: "Posts", icon: FileText },
        { id: "chat", label: "Chats", icon: MessageCircle },
        { id: "mention", label: "Mentions", icon: AtSign },
        { id: "hashtag", label: "Hashtags", icon: Hash },
    ];

    const handleHashtagClick = (tag) => {
        setSearchSkip(0);
        searchItem({searchWord: tag, searchType: 'hashtag', limit: 10, skip: 0});
        setShowSearchType(true);
        setSearchType('hashtag');
    };

    const handleLoadMoreSearch = () => {
        const newSkip = searchSkip + 10;
        setSearchSkip(newSkip);
        if (currentSearchWord) {
            searchItem({searchWord: currentSearchWord, searchType: searchType, limit: 10, skip: newSkip});
        }
    };

    const handleLoadMoreTrendingPosts = () => {
        const newSkip = trendingSkip + 20;
        setTrendingSkip(newSkip);
        getTrending(newSkip);
    };

    const handleLoadMoreTrendingHashtags = () => {
        const newSkip = trendingSkip + 20;
        setTrendingSkip(newSkip);
        getTrending(newSkip);
    };

    const handleChatClick = (chatId) => {
        // Placeholder for chat page navigation when built
        console.log('Navigate to chat:', chatId);
        // TODO: Uncomment when chat page is built
        // navigate(`/chat/${chatId}`);
    };

    const renderSearchResult = (item, index, type) => {
        if (type === "user") {
            return (
                <Link to={`/profile/${item.username}`} key={index} className="block">
                    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-300 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                        <div className="avatar">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-200">
                                <img src={item.avatarUrl || "/avatar-placeholder.png"} alt={item.displayName} className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{item.displayName}</h3>
                            <p className="text-sm text-gray-500">@{item.username}</p>
                        </div>
                    </div>
                </Link>
            );
        }
        
        if (type === "post") {
            return (
                <Link to={`/post/${item._id}`} key={index} className="block">
                    <div className="p-4 bg-white rounded-xl border border-gray-300 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="avatar">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-200">
                                    <img src={item.author?.avatarUrl || "/avatar-placeholder.png"} alt={item.author?.displayName} className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">{item.author?.displayName}</h3>
                                <p className="text-sm text-gray-500">@{item.author?.username} · {formatPostDate(item.createdAt)}</p>
                            </div>
                        </div>
                        <p className="text-gray-700 line-clamp-2">{item.text}</p>
                        {item.mediaType === "Image" && item.url && (
                            <div className="mt-3 rounded-lg overflow-hidden">
                                <img src={item.url} alt="" className="w-full h-48 object-cover" />
                            </div>
                        )}
                    </div>
                </Link>
            );
        }

        if (type === "mention") {
            return (
                <Link to={`/profile/${item.author?.username}`} key={index} className="block">
                    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-300 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                        <div className="avatar">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-200">
                                <img src={item.author?.avatarUrl || "/avatar-placeholder.png"} alt={item.author?.displayName} className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{item.author?.displayName}</h3>
                            <p className="text-sm text-gray-500">@{item.author?.username}</p>
                            <p className="text-xs text-gray-400 mt-1">Mentioned in post</p>
                        </div>
                    </div>
                </Link>
            );
        }

        if (type === "chat") {
            return (
                <div key={index} onClick={() => handleChatClick(item._id)} className="cursor-pointer">
                    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-300 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                        <div className="avatar">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-200 flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-gray-600" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">Message</h3>
                            <p className="text-sm text-gray-500 line-clamp-1">{item.text}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatPostDate(item.createdAt)}</p>
                        </div>
                    </div>
                </div>
            );
        }

        if (type === "hashtag") {
            return (
                <div key={index} onClick={() => handleHashtagClick(item.tag)} className="cursor-pointer">
                    <div className="p-4 bg-white rounded-xl border border-gray-300 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3">
                            <Hash className="w-6 h-6 text-blue-400" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-800">#{item.tag}</h3>
                                <p className="text-sm text-gray-500">{item.count || 0} posts</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="w-full flex flex-col md:flex-row h-screen bg-gray-100">
            <Sidebar/>
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <div className="sticky top-0 z-10 bg-gray-100 p-4 md:p-6 border-b border-gray-300">
                    <div className="w-full">
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <div className="relative mb-4">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        const cleaned = value
                                            .replace(/[#@]/g, "")
                                            .trim();

                                        if (!cleaned) {
                                            setShowSearchType(false);
                                            return;
                                        }

                                        setShowSearchType(true);
                                        setSearchSkip(0);
                                        setCurrentSearchWord(cleaned);

                                        searchItem({
                                            searchWord: cleaned,
                                            searchType,
                                            limit: 10,
                                            skip: 0
                                        });
                                    }}
                                    placeholder="Search for people, hashtags, mentions, chats, or posts..."
                                    className="pl-12 h-12 bg-gray-50 border-gray-300 focus:border-blue-200 focus:ring-2 focus:ring-blue-200/20 rounded-xl text-gray-800 placeholder-gray-400"
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
                                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                                                    searchType === tab.id
                                                        ? "bg-blue-200 text-gray-800 font-medium"
                                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span>{tab.label}</span>
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
                                    <p className="mt-4 text-gray-500">Searching...</p>
                                </div>
                            )}

                            {!isSearching && !showSearchType && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                                        <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Discover what's happening</h2>
                                        <p className="text-gray-500">Search for people, posts, hashtags, and more</p>
                                    </div>

                                    {isGettingTrending ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <LoadingSpinner size="lg" />
                                            <p className="mt-4 text-gray-500">Loading trending content...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {trendingPosts && trendingPosts.length > 0 && (
                                                <div className="bg-white rounded-2xl shadow-sm p-6">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <TrendingUp className="w-5 h-5 text-blue-400" />
                                                        <h3 className="text-lg font-semibold text-gray-800">Trending Posts</h3>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {trendingPosts.map((post) => (
                                                            <Link to={`/post/${post._id}`} key={post._id} className="block">
                                                                <div className="p-4 rounded-xl border border-gray-300 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <div className="avatar">
                                                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-200">
                                                                                <img src={post.author?.avatarUrl || "/avatar-placeholder.png"} alt={post.author?.displayName} className="w-full h-full object-cover" />
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-semibold text-gray-800 text-sm">{post.author?.displayName}</h4>
                                                                            <p className="text-xs text-gray-500">@{post.author?.username}</p>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-gray-700 text-sm line-clamp-2">{post.text}</p>
                                                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                                        <span>{post.likes?.length || 0} likes</span>
                                                                        <span>{post.comments?.length || 0} comments</span>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                    {trendingHasMore.posts && (
                                                        <button
                                                            onClick={handleLoadMoreTrendingPosts}
                                                            className="w-full mt-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all duration-200 font-medium"
                                                        >
                                                            Load More
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {trendingHashtags && trendingHashtags.length > 0 && (
                                                <div className="bg-white rounded-2xl shadow-sm p-6">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Hash className="w-5 h-5 text-blue-400" />
                                                        <h3 className="text-lg font-semibold text-gray-800">Trending Hashtags</h3>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {trendingHashtags.map((hashtag, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => handleHashtagClick(hashtag.tag)}
                                                                className="px-4 py-2 bg-gray-100 hover:bg-blue-200 rounded-full text-sm text-gray-700 hover:text-gray-800 transition-all duration-200"
                                                            >
                                                                #{hashtag.tag}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {trendingHasMore.hashtags && (
                                                        <button
                                                            onClick={handleLoadMoreTrendingHashtags}
                                                            className="w-full mt-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all duration-200 font-medium"
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

                            {!isSearching && showSearchType && searchResult?.length === 0 && (
                                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                                    <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                    <h2 className="text-xl font-semibold text-gray-800 mb-2">No results found</h2>
                                    <p className="text-gray-500">Try different keywords or search filters</p>
                                </div>
                            )}

                            {!isSearching && searchResult && (
                                <div className="space-y-3">
                                    {searchType === "all" && typeof searchResult === 'object' && !Array.isArray(searchResult) ? (
                                        <>
                                            {searchResult.users && searchResult.users.length > 0 && (
                                                <div className="mb-6">
                                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Users</h3>
                                                    <div className="space-y-3">
                                                        {searchResult.users.map((item, index) => renderSearchResult(item, index, 'user'))}
                                                    </div>
                                                    {searchResult.hasMore?.users && (
                                                        <button
                                                            onClick={handleLoadMoreSearch}
                                                            className="w-full mt-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all duration-200 font-medium"
                                                        >
                                                            Load More
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {searchResult.posts && searchResult.posts.length > 0 && (
                                                <div className="mb-6">
                                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Posts</h3>
                                                    <div className="space-y-3">
                                                        {searchResult.posts.map((item, index) => renderSearchResult(item, index, 'post'))}
                                                    </div>
                                                    {searchResult.hasMore?.posts && (
                                                        <button
                                                            onClick={handleLoadMoreSearch}
                                                            className="w-full mt-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all duration-200 font-medium"
                                                        >
                                                            Load More
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {searchResult.chats && searchResult.chats.length > 0 && (
                                                <div className="mb-6">
                                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Messages</h3>
                                                    <div className="space-y-3">
                                                        {searchResult.chats.map((item, index) => renderSearchResult(item, index, 'chat'))}
                                                    </div>
                                                    {searchResult.hasMore?.chats && (
                                                        <button
                                                            onClick={handleLoadMoreSearch}
                                                            className="w-full mt-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all duration-200 font-medium"
                                                        >
                                                            Load More
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : searchType === "hashtag" && typeof searchResult === 'object' && !Array.isArray(searchResult) ? (
                                        <>
                                            {searchResult.Hashtags && searchResult.Hashtags.length > 0 && (
                                                <div className="mb-6">
                                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Posts with #{currentSearchWord || 'hashtag'}</h3>
                                                    <div className="space-y-3">
                                                        {searchResult.Hashtags.map((item, index) => renderSearchResult(item, index, 'post'))}
                                                    </div>
                                                    {searchResult.hasMore && (
                                                        <button
                                                            onClick={handleLoadMoreSearch}
                                                            className="w-full mt-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all duration-200 font-medium"
                                                        >
                                                            Load More
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {searchResult.suggestedHashtags && searchResult.suggestedHashtags.length > 0 && (
                                                <div className="mb-6">
                                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Suggested Hashtags</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {searchResult.suggestedHashtags.map((item, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => handleHashtagClick(item._id)}
                                                                className="px-4 py-2 bg-gray-100 hover:bg-blue-200 rounded-full text-sm text-gray-700 hover:text-gray-800 transition-all duration-200"
                                                            >
                                                                #{item._id}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : Array.isArray(searchResult) && searchResult.length > 0 ? (
                                        <>
                                            {searchResult.map((item, index) => renderSearchResult(item, index, searchType))}
                                            {searchHasMore && (
                                                <button
                                                    onClick={handleLoadMoreSearch}
                                                    className="w-full mt-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all duration-200 font-medium"
                                                >
                                                    Load More
                                                </button>
                                            )}
                                        </>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default SearchPage
