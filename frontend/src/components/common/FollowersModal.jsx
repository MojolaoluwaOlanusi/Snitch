import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import axiosInstance from '../../lib/axios.js';

const FollowersModal = ({ isOpen, onClose, userId, username }) => {
    const [activeTab, setActiveTab] = useState('followers');
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            fetchFollowersAndFollowing();
        }
    }, [isOpen, userId]);

    const fetchFollowersAndFollowing = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access-token');
            
            const [followersRes, followingRes] = await Promise.all([
                axiosInstance.get(`/auth/followers/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axiosInstance.get(`/auth/following/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setFollowers(followersRes.data || []);
            setFollowing(followingRes.data || []);
        } catch (error) {
            console.error('Error fetching followers/following:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-base-100 rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-base-200">
                    <h2 className="text-xl font-bold text-primary/90">
                        {username}'s {activeTab === 'followers' ? 'Followers' : 'Following'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-base-200 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-base-content/60" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-base-200">
                    <button
                        onClick={() => setActiveTab('followers')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                            activeTab === 'followers'
                                ? 'text-primary'
                                : 'text-base-content/60 hover:text-base-content'
                        }`}
                    >
                        Followers
                        {activeTab === 'followers' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('following')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                            activeTab === 'following'
                                ? 'text-primary'
                                : 'text-base-content/60 hover:text-base-content'
                        }`}
                    >
                        Following
                        {activeTab === 'following' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="loading loading-spinner loading-primary" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {activeTab === 'followers' ? (
                                followers.length > 0 ? (
                                    followers.map((user) => (
                                        <Link
                                            key={user._id}
                                            to={`/profile/${user.username}`}
                                            onClick={onClose}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 transition-colors"
                                        >
                                            <div className="avatar">
                                                <div className="w-10 rounded-full">
                                                    <img
                                                        src={user.avatarUrl || '/avatar.png'}
                                                        alt={user.username}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate text-base-content">
                                                    {user.displayName || user.username}
                                                </p>
                                                <p className="text-xs text-base-content/60 truncate">
                                                    @{user.username}
                                                </p>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <p className="text-center text-base-content/60 py-8 text-sm">
                                        No followers yet
                                    </p>
                                )
                            ) : (
                                following.length > 0 ? (
                                    following.map((user) => (
                                        <Link
                                            key={user._id}
                                            to={`/profile/${user.username}`}
                                            onClick={onClose}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 transition-colors"
                                        >
                                            <div className="avatar">
                                                <div className="w-10 rounded-full">
                                                    <img
                                                        src={user.avatarUrl || '/avatar.png'}
                                                        alt={user.username}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate text-base-content">
                                                    {user.displayName || user.username}
                                                </p>
                                                <p className="text-xs text-base-content/60 truncate">
                                                    @{user.username}
                                                </p>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <p className="text-center text-base-content/60 py-8 text-sm">
                                        Not following anyone yet
                                    </p>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FollowersModal;
