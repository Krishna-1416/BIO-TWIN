import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import './TrendsPage.css';

const TrendsPage = () => {
    const [trendsData, setTrendsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('7'); // days

    useEffect(() => {
        const fetchTrendsData = async () => {
            if (!auth.currentUser) {
                setLoading(false);
                return;
            }

            try {
                const q = query(
                    collection(db, 'healthScans'),
                    where('userId', '==', auth.currentUser.uid),
                    orderBy('timestamp', 'desc'),
                    limit(parseInt(timeRange))
                );

                const querySnapshot = await getDocs(q);
                const data = [];

                querySnapshot.forEach((doc) => {
                    const scanData = doc.data();
                    const timestamp = scanData.timestamp?.toDate?.() || new Date(scanData.timestamp);

                    data.push({
                        date: timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        score: parseInt(scanData.score) || 0,
                        fullDate: timestamp.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }),
                        status: scanData.status || 'Unknown',
                        hydration: scanData.hydration || 'Unknown'
                    });
                });

                // Reverse to show oldest first (left to right)
                setTrendsData(data.reverse());
            } catch (error) {
                console.error('Error fetching trends data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrendsData();
    }, [timeRange]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="trends-tooltip">
                    <p className="tooltip-date">{data.fullDate}</p>
                    <p className="tooltip-score">
                        <span className="score-label">Health Score:</span>
                        <span className="score-value">{data.score}</span>
                    </p>
                    <p className="tooltip-status">Status: {data.status}</p>
                    <p className="tooltip-hydration">Hydration: {data.hydration}</p>
                </div>
            );
        }
        return null;
    };

    const getAverageScore = () => {
        if (trendsData.length === 0) return '--';
        const sum = trendsData.reduce((acc, item) => acc + item.score, 0);
        return Math.round(sum / trendsData.length);
    };

    const getScoreTrend = () => {
        if (trendsData.length < 2) return { text: 'Insufficient data', color: 'var(--text-secondary)' };
        const first = trendsData[0].score;
        const last = trendsData[trendsData.length - 1].score;
        const diff = last - first;

        if (diff > 0) return { text: `↑ +${diff} points`, color: 'var(--accent-green)' };
        if (diff < 0) return { text: `↓ ${diff} points`, color: 'var(--accent-red)' };
        return { text: '→ No change', color: 'var(--text-secondary)' };
    };

    const trend = getScoreTrend();

    return (
        <div className="trends-page">
            <motion.div
                className="trends-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="header-content">
                    <h1>Health Trends</h1>
                    <p className="subtitle">Track your health score progress over time</p>
                </div>

                <div className="time-range-selector">
                    {['7', '14', '30'].map((range) => (
                        <button
                            key={range}
                            className={`range-btn ${timeRange === range ? 'active' : ''}`}
                            onClick={() => setTimeRange(range)}
                        >
                            {timeRange === range && (
                                <motion.div
                                    className="range-indicator"
                                    layoutId="activeRange"
                                    transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 35
                                    }}
                                />
                            )}
                            <span className="range-text">{range} Days</span>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                className="stats-grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <div className="stat-card">
                    <span className="stat-icon material-icons">analytics</span>
                    <div className="stat-content">
                        <span className="stat-value">{getAverageScore()}</span>
                        <span className="stat-label">Average Score</span>
                    </div>
                </div>

                <div className="stat-card">
                    <span className="stat-icon material-icons">trending_up</span>
                    <div className="stat-content">
                        <span className="stat-value" style={{ color: trend.color }}>{trend.text}</span>
                        <span className="stat-label">Score Trend</span>
                    </div>
                </div>

                <div className="stat-card">
                    <span className="stat-icon material-icons">insert_chart</span>
                    <div className="stat-content">
                        <span className="stat-value">{trendsData.length}</span>
                        <span className="stat-label">Total Scans</span>
                    </div>
                </div>
            </motion.div>

            {/* Chart Card */}
            <motion.div
                className="trends-chart-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <div className="chart-header">
                    <h3>Health Score History</h3>
                    <span className="chart-subtitle">Based on your uploaded medical reports</span>
                </div>

                {loading ? (
                    <div className="chart-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading your health data...</p>
                    </div>
                ) : trendsData.length === 0 ? (
                    <div className="chart-empty">
                        <span className="material-icons empty-icon">insert_chart_outlined</span>
                        <h3>No Health Data Yet</h3>
                        <p>Upload your first medical report to start tracking your health trends.</p>
                    </div>
                ) : (
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={trendsData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="rgba(255,255,255,0.08)"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="date"
                                    stroke="var(--text-secondary)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    stroke="var(--text-secondary)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#0A84FF"
                                    strokeWidth={2.5}
                                    dot={{
                                        fill: '#0A84FF',
                                        strokeWidth: 2,
                                        stroke: '#fff',
                                        r: 4
                                    }}
                                    activeDot={{
                                        r: 7,
                                        fill: '#0A84FF',
                                        stroke: '#fff',
                                        strokeWidth: 2
                                    }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default TrendsPage;
