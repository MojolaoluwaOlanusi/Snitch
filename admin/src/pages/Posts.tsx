import { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { Trash2, Flag } from 'lucide-react';

export default function Posts() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/posts?limit=100')
            .then(({ data }) => setPosts(data))
            .catch(() => toast.error('Failed to load posts'))
            .finally(() => setLoading(false));
    }, []);

    const deletePost = async (id: string) => {
        if (!window.confirm('Delete this post?')) return;
        try {
            await api.delete(`/posts/delete/${id}`);
            toast.success('Post deleted');
            setPosts((prev) => prev.filter((p: any) => p._id !== id));
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-base-content">Posts</h1>
            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                    <tr>
                        <th className="text-base-content">Author</th>
                        <th className="text-base-content">Content</th>
                        <th className="text-base-content">Likes</th>
                        <th className="text-base-content">Comments</th>
                        <th className="text-base-content">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {posts.map((post: any) => (
                        <tr key={post._id}>
                            <td className="text-base-content">{post.author?.username}</td>
                            <td className="text-base-content">{post.text?.substring(0, 80)}</td>
                            <td className="text-base-content">{post.likes?.length}</td>
                            <td className="text-base-content">{post.comments?.length}</td>
                            <td>
                                <button
                                    onClick={() => deletePost(post._id)}
                                    className="btn btn-sm btn-outline btn-error"
                                    aria-label={`Delete post ${post._id}`}
                                    title="Delete post"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}