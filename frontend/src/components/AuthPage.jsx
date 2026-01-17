import React, { useState } from 'react';
import { auth } from '../firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
} from 'firebase/auth';
import './AuthPage.css';

const AuthPage = ({ onAuthSuccess, theme, toggleTheme }) => {
    const [isSignUp, setIsSignUp] = useState(true); // Default to Sign Up as per image
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
                            <button className="social-btn google" onClick={handleGoogleSignIn} disabled={loading}>
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                                <span>Sign up with Google</span>
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
