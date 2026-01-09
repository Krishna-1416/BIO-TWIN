
import React from 'react';

const LandingPage = ({ onEnterApp, theme, toggleTheme }) => {
    return (
        <div className="landing-container">
            {/* Navbar */}
            <nav className="landing-nav">
                <div className="nav-brand">
                    <img src="/logo.png" alt="BioTwin" className="nav-logo" />
                    <span>BioTwin</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={toggleTheme}
                        className="theme-toggle-btn"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <span className="material-icons">
                            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>
                    <button className="btn-primary" onClick={onEnterApp}>Launch App</button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Your Health.<br />Decoded.</h1>
                    <p className="hero-subtitle">
                        The world's first AI-powered Digital Twin. Analyze medical data, predict risks, and optimize your biology.
                    </p>
                    <div className="hero-actions">
                        <button className="btn-primary big-btn" onClick={onEnterApp}>
                            Get Started <span className="material-icons">arrow_forward</span>
                        </button>
                    </div>
                </div>

                {/* Abstract 3D Visual Placeholder */}
                <div className="hero-visual">
                    <div className="glow-sphere"></div>
                    <div className="glass-card-mockup">
                        <div className="mockup-content centered">
                            <div className="heart-container">
                                <span className="material-icons heart-icon">favorite</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bento Grid Features */}
            <section className="features-section">
                <h2 className="section-title">Pro-Grade Health Intelligence.</h2>

                <div className="bento-grid-landing">
                    <div className="bento-item large">
                        <h3>Gemini 3 Vision</h3>
                        <p>Upload a PDF or photo. Our AI reads every pixel to extract biomarkers with clinical precision.</p>
                    </div>

                    <div className="bento-item medium">
                        <h3>Digital Twin</h3>
                        <p>A living 3D model that reacts to your hydration, stress, and sleep.</p>
                    </div>

                    <div className="bento-item medium">
                        <h3>Privacy First.</h3>
                        <p>Your genomic data stays encrypted. You hold the encryption keys.</p>
                    </div>

                    <div className="bento-item large">
                        <h3>Agentic Action</h3>
                        <p>Book me a doctor. Bio-Twin handles the logistics.</p>
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <p>Designed by DeepMind. Powered by Google Gemini.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
