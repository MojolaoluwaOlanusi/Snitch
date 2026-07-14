import { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export default function Reports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/reports')
            .then(({ data }) => setReports(data))
            .catch(() => toast.error('Failed to load reports'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-base-content">Reports</h1>
            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                    <tr>
                        <th className="text-base-content">Post</th>
                        <th className="text-base-content">Reported by</th>
                        <th className="text-base-content">Reason</th>
                        <th className="text-base-content">Date</th>
                    </tr>
                    </thead>
                    <tbody>
                    {reports.map((report: any) => (
                        <tr key={report._id}>
                            <td className="text-base-content">{report.postId?.text?.substring(0, 50) || 'N/A'}</td>
                            <td className="text-base-content">{report.reportedBy?.username}</td>
                            <td className="text-base-content">{report.reason?.reason || report.reason}</td>
                            <td className="text-base-content">{new Date(report.createdAt).toLocaleDateString()}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}