import React, { useState } from 'react';
import { auth, db } from '../firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    signInAnonymously
} from 'firebase/auth';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import './AuthPage.css';

const AuthPage = ({ onAuthSuccess, theme, toggleTheme }) => {
    const [isSignUp, setIsSignUp] = useState(true); // Default to Sign Up as per image
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);

    // Demo mode login with anonymous auth
    const handleDemoLogin = async () => {
        setDemoLoading(true);
        setError('');
        try {
            // Sign in anonymously
            const userCredential = await signInAnonymously(auth);
            const user = userCredential.user;

            // Set display name for demo user
            await updateProfile(user, {
                displayName: 'Guest'
            });

            // Pre-populate multiple demo health scans to showcase history & trends
            const now = new Date();

            // Demo Scan 1 - Most Recent (Current)
            const demoScan1 = {
                status: 'Healthy',
                hydration: 'High',
                lastScan: 'Just Now',
                details: 'Recent comprehensive health panel shows good overall markers. Vitamin D slightly low but improving. Continue current lifestyle habits.',
                score: 82,
                velocity: 'Improving',
                riskFactor: 'Low Vitamin D',
                correlations: [
                    {
                        title: 'Vitamin D Improvement',
                        description: 'Vitamin D levels increased from 18 to 24 ng/mL. Keep up the sunlight exposure and supplementation.',
                        type: 'positive'
                    },
                    {
                        title: 'Excellent Hydration',
                        description: 'Hydration markers are optimal. Your water intake is supporting kidney function and cellular health.',
                        type: 'positive'
                    },
                    {
                        title: 'Cholesterol Balance',
                        description: 'HDL/LDL ratio improved to 1:2.8. Cardiovascular health trending positively.',
                        type: 'positive'
                    },
                    {
                        title: 'Blood Sugar Stability',
                        description: 'HbA1c at 5.2% - excellent glucose control. No diabetes risk detected.',
                        type: 'positive'
                    }
                ],
                timestamp: new Date(now.getTime() - 1000 * 60 * 5), // 5 minutes ago
                fileUrl: null,
                fileName: 'health_panel_jan_2026.pdf',
                fileType: 'application/pdf',
                userId: user.uid
            };

            // Demo Scan 2 - One Month Ago
            const demoScan2 = {
                status: 'Healthy',
                hydration: 'Medium',
                lastScan: '1 month ago',
                details: 'December health check shows stable markers. Vitamin D needs attention. Consider supplementation.',
                score: 75,
                velocity: 'Stable',
                riskFactor: 'Low Vitamin D',
                correlations: [
                    {
                        title: 'Vitamin D Deficiency',
                        description: 'Vitamin D at 18 ng/mL (low). Recommend 2000 IU daily supplement and 15 min morning sun.',
                        type: 'negative'
                    },
                    {
                        title: 'Moderate Hydration',
                        description: 'Hydration adequate but could be improved. Aim for 8 glasses of water daily.',
                        type: 'neutral'
                    },
                    {
                        title: 'Cholesterol Watch',
                        description: 'LDL slightly elevated at 125 mg/dL. Monitor diet and consider omega-3 supplementation.',
                        type: 'negative'
                    }
                ],
                timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
                fileUrl: null,
                fileName: 'health_panel_dec_2025.pdf',
                fileType: 'application/pdf',
                userId: user.uid
            };

            // Demo Scan 3 - Three Months Ago
            const demoScan3 = {
                status: 'Critical',
                hydration: 'Low',
                lastScan: '3 months ago',
                details: 'October baseline screening. Multiple markers need attention. Follow-up recommended.',
                score: 68,
                velocity: 'Declining',
                riskFactor: 'High Cortisol & Low Vitamin D',
                correlations: [
                    {
                        title: 'Stress Markers Elevated',
                        description: 'Cortisol at 28 µg/dL (high). Indicates chronic stress. Recommend stress management techniques.',
                        type: 'negative'
                    },
                    {
                        title: 'Vitamin D Critical',
                        description: 'Vitamin D at 12 ng/mL (deficient). Immediate supplementation required.',
                        type: 'negative'
                    },
                    {
                        title: 'Dehydration Signs',
                        description: 'Electrolyte imbalance suggests chronic dehydration. Increase water intake significantly.',
                        type: 'negative'
                    },
                    {
                        title: 'Thyroid Function',
                        description: 'TSH slightly elevated at 4.2 mIU/L. Monitor for hypothyroidism symptoms.',
                        type: 'negative'
                    }
                ],
                timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 90), // 90 days ago
                fileUrl: null,
                fileName: 'baseline_health_oct_2025.pdf',
                fileType: 'application/pdf',
                userId: user.uid
            };

            // Save all demo scans to Firestore
            await addDoc(collection(db, 'healthScans'), demoScan1);
            await addDoc(collection(db, 'healthScans'), demoScan2);
            await addDoc(collection(db, 'healthScans'), demoScan3);


            console.log('Demo user created with pre-populated data');
            onAuthSuccess();
        } catch (err) {
            console.error('Demo login error:', err);
            setError('Failed to start demo mode. Please try again.');
        } finally {
            setDemoLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            onAuthSuccess();
        } catch (err) {
            console.error('Google Auth Error:', err);
            setError('Failed to sign in with Google');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        if (isSignUp) {
            if (!fullName) {
                setError('Please enter your full name');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            if (isSignUp) {
                // Sign up
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // Update profile with full name
                await updateProfile(userCredential.user, {
                    displayName: fullName
                });
            } else {
                // Sign in
                await signInWithEmailAndPassword(auth, email, password);
            }
            onAuthSuccess();
        } catch (err) {
            console.error('Auth error:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Email already in use. Log in instead?');
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                setError('Invalid email or password');
            } else {
                setError(err.message || 'Authentication failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* Abstract 3D Shapes Background is handled in CSS */}
            <div className="auth-glass-card">

                {/* Capsule Toggle Centered at Top */}
                <div className="capsule-toggle-container">
                    <div className="capsule-toggle">
                        <div
                            className={`toggle-slider ${isSignUp ? 'left' : 'right'}`}
                        ></div>
                        <button
                            type="button"
                            className={`toggle-option ${isSignUp ? 'active' : ''}`}
                            onClick={() => setIsSignUp(true)}
                            disabled={loading}
                        >
                            Sign Up
                        </button>
                        <button
                            type="button"
                            className={`toggle-option ${!isSignUp ? 'active' : ''}`}
                            onClick={() => setIsSignUp(false)}
                            disabled={loading}
                        >
                            Log In
                        </button>
                    </div>
                </div>

                <div className="auth-content-grid">
                    {/* Left Column: Form Inputs */}
                    <div className="auth-column left-col">
                        {/* Title removed as per request */}

                        <form onSubmit={handleSubmit} className="auth-form">
                            {error && <div className="auth-error-banner">{error}</div>}

                            {isSignUp && (
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            )}

                            <div className="input-group">
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            <div className="input-group">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            {isSignUp && (
                                <div className="input-group">
                                    <input
                                        type="password"
                                        placeholder="Confirm Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            )}

                            {/* Primary Submit Button moved inside form for logical flow & visual placement */}
                            <button type="submit" className="auth-submit-btn" disabled={loading}>
                                {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
                            </button>
                        </form>
                    </div>

                    {/* Middle Column: Vertical Divider */}
                    <div className="auth-column divider-col">
                        <div className="vertical-line"></div>
                        <span className="divider-text">OR</span>
                        <div className="vertical-line"></div>
                    </div>

                    {/* Right Column: Actions */}
                    <div className="auth-column right-col">
                        <div className="social-login">
                            <button className="social-btn google" onClick={handleGoogleSignIn} disabled={loading || demoLoading}>
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                                <span>Sign up with Google</span>
                            </button>

                            {/* OR Separator */}
                            <div className="demo-or-divider">
                                <span>OR</span>
                            </div>

                            {/* Try Demo Button - Matches theme */}
                            <button
                                className="social-btn demo"
                                onClick={handleDemoLogin}
                                disabled={loading || demoLoading}
                            >
                                <span className="material-icons">science</span>
                                <span>{demoLoading ? 'Loading...' : 'Try Demo'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                className="auth-theme-toggle"
                title="Toggle Theme"
            >
                <span className="material-icons">
                    {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
            </button>
        </div>
    );
};

export default AuthPage;
