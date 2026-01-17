import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import './HistoryPage.css';

const HistoryPage = () => {
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!auth.currentUser) return;

            try {
                const q = query(
                    collection(db, 'healthScans'),
                    where('userId', '==', auth.currentUser.uid),
                    orderBy('timestamp', 'desc')
                );

                const querySnapshot = await getDocs(q);
                const scanData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setScans(scanData);
            } catch (err) {
                console.error("Error fetching history:", err);
                setError("Failed to load history.");
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    if (loading) return <div className="history-loading">Loading history...</div>;
    if (error) return <div className="history-error">{error}</div>;

    return (
        <div className="history-page">
            <header className="history-header">
                <h2>Scan History</h2>
                <p>View your past health analysis reports</p>
            </header>

            {scans.length === 0 ? (
                <div className="no-history">
                    <span className="material-icons">history_toggle_off</span>
                    <p>No scans found yet. Upload a report to get started!</p>
                </div>
            ) : (
                <div className="history-list">
                    {scans.map((scan) => (
                        <div key={scan.id} className="history-item">
                            <div className="history-info">
                                <span className="history-date">
                                    {scan.timestamp?.toDate().toLocaleDateString()}
                                    <small>{scan.timestamp?.toDate().toLocaleTimeString()}</small>
                                </span>
                                <div className="history-status">
                                    <span className={`status-badge ${scan.status?.toLowerCase() || 'unknown'}`}>
                                        {scan.status || 'Unknown'}
                                    </span>
                                    <span className="score">Score: {scan.score || '--'}</span>
                                </div>
                            </div>

                            <div className="history-actions">
                                {scan.fileUrl && (
                                    <a
                                        href={scan.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="view-report-btn"
                                    >
                                        <span className="material-icons">visibility</span>
                                        View Report
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
