import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const SuggestionCard = ({ user, onFollow }) => {
    const [isFollowing, setIsFollowing] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    const handleFollow = async () => {
        try {
            await axios.post(`/api/users/follow/${user._id}`);
            setIsFollowing(true);
            onFollow?.();
            toast.success(`You followed ${user.displayName}`);
        } catch (error) {
            toast.error('Failed to follow');
        }
    };

    if (isDismissed) return null;

    return (
        <div className="bg-base-100 rounded-xl border border-base-300 p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to={`/profile/${user.username}`} className="avatar">
                        <div className="w-12 h-12 rounded-full overflow-hidden">
                            <img src={user.avatarUrl || '/avatar-placeholder.png'} alt={user.username} />
                        </div>
                    </Link>
                    <div>
                        <Link to={`/profile/${user.username}`} className="font-semibold text-base-content hover:underline">
                            {user.displayName}
                        </Link>
                        <p className="text-sm text-base-content/60">@{user.username}</p>
                    </div>
                </div>
                {isFollowing ? (
                    <button className="btn btn-success btn-sm" disabled>Following</button>
                ) : (
                    <button onClick={handleFollow} className="btn btn-primary btn-sm">Follow</button>
                )}
            </div>
            <div className="flex justify-end mt-2">
                <button
                    onClick={() => setIsDismissed(true)}
                    className="text-xs text-base-content/40 hover:text-base-content"
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
};

export default SuggestionCard;