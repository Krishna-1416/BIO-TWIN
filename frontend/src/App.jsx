import React, { useState, Suspense, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
// import BioAvatar from './components/BioAvatar'
import VoiceOrb from './components/VoiceOrb'
import LandingPage from './components/LandingPage'
import ScanPage from './components/ScanPage'
import ReactMarkdown from 'react-markdown'
import './App.css'

function App() {
  // Theme State (Global)
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // State
  const [view, setView] = useState('landing'); // 'landing' or 'app'
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' or 'dashboard'
  const [healthData, setHealthData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const fileInputRef = useRef(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // User State
  const [userName, setUserName] = useState('Guest User');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);

  // Fetch initial health data if available
  useEffect(() => {
    if (view === 'app') {
      fetch("http://localhost:8000/health-data")
        .then(res => res.json())
        .then(data => {
          if (data) {
            setHealthData(data);
            setActiveTab('dashboard');
          }
        })
        .catch(err => console.error("Error fetching health data:", err));
    }
  }, [view]);

  // Check Calendar Status
  useEffect(() => {
    const checkCalendarStatus = () => {
      fetch("http://localhost:8000/auth/status")
        .then(res => res.json())
        .then(data => setIsCalendarConnected(data.connected))
        .catch(err => console.error("Error checking calendar status:", err));
    };

    if (view === 'app') {
      checkCalendarStatus();
      const interval = setInterval(checkCalendarStatus, 5000); // Poll status during auth flow
      return () => clearInterval(interval);
    }
  }, [view]);

  const handleConnectCalendar = async () => {
    try {
      const response = await fetch("http://localhost:8000/auth/google");
      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank');
      } else if (data.error) {
        alert(data.message || data.error);
      }
    } catch (err) {
      console.error("Auth error:", err);
      alert("Failed to connect to authentication service.");
    }
  };

  // Helper function to get initials from name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [isChatThinking, setIsChatThinking] = useState(false)

  // Auto-scroll ref
  const messagesEndRef = useRef(null)

  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: "Hello! I am your Bio-Twin assistant. How can I help you today?" }
  ])

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages, isChatOpen, isChatThinking]);

  // --- Voice Logic ---
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn("Speech recognition not supported");
      return;
    }

    if (isVoiceActive) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false; // Stop after one sentence to process
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        console.log("Voice: Listening...");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("Voice heard:", transcript);
        setChatInput(transcript); // Set input for visual feedback
        handleSendMessage(transcript); // Auto-send
      };

      recognition.onend = () => {
        // If voice is still active, restart listening (after a brief pause or response)
        // We'll restart listening AFTER the bot speaks in the handleSendMessage flow to avoid picking up the bot's voice
      };

      try {
        recognition.start();
      } catch (e) { console.error(e) }
      recognitionRef.current = recognition;
    } else {
      // Stop recognition if active
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { }
      }
      window.speechSynthesis.cancel(); // Stop talking
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { }
      }
    }
  }, [isVoiceActive]);

  const speakResponse = (text) => {
    if (!isVoiceActive) return;

    // Strip markdown asterisks for cleaner speech
    const cleanText = text.replace(/\*/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      // Restart listening after speaking
      if (isVoiceActive && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) { }
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  /* Updated to accept optional direct message argument for voice */
  const handleSendMessage = async (directMessage = null) => {
    const msgToSend = directMessage || chatInput;
    if (!msgToSend || !msgToSend.trim()) return;

    if (!directMessage) {
      // If getting from state, clear it. If direct, state update might lag or conflict
      setChatInput("");
    }

    // UI Update
    setChatMessages(prev => [...prev, { sender: 'user', text: msgToSend }]);
    setIsChatThinking(true);

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msgToSend,
          context: healthData // Send current health scan stats
        })
      });
      const data = await response.json();

      setChatMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);

      // Speak the response if voice mode is on
      speakResponse(data.reply);

    } catch (e) {
      console.error(e);
      setChatMessages(prev => [...prev, { sender: 'bot', text: "Sorry, I couldn't connect to the server." }]);
      speakResponse("Sorry, I couldn't connect to the server.");
    } finally {
      setIsChatThinking(false);
    }
  };

  const processFile = async (file) => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/scan", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        if (data.error.includes("429")) {
          alert("Traffic Limit Reached. The system is auto-retrying, but you may need to wait 30-60s before the next scan.");
        } else {
          alert("Scan Error: " + data.error);
        }
      } else {
        setHealthData({
          status: data.overall_status || 'Critical',
          hydration: data.hydration_level || 'Medium',
          lastScan: 'Just Now',
          details: data.summary || 'Analysis complete.',
          score: data.health_score || '--',
          velocity: data.velocity || 'Unknown',
          riskFactor: data.primary_risk || 'None',
          correlations: data.correlations || []
        });

        // Redirect to dashboard on success
        setActiveTab('dashboard');
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to connect to scanner service.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkipScan = () => {
    setActiveTab('dashboard');
  };



  const handleFileUpload = (event) => processFile(event.target.files[0]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };
  const triggerUpload = () => fileInputRef.current.click();

  if (view === 'landing') {
    return <LandingPage onEnterApp={() => setView('app')} theme={theme} toggleTheme={toggleTheme} />;
  }


  return (
    <div className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <div className="logo-icon">
              <img src="/logo.png" alt="BioTwin Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            </div>
            {!isSidebarCollapsed && (
              <div className="brand-text">
                <span className="name">BioTwin</span>
              </div>
            )}
          </div>

          <button
            className="sidebar-toggle"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Maximize Menu" : "Minimize Menu"}
          >
            <span className="material-icons">
              {isSidebarCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        <nav className="nav-menu">
          <a
            href="#"
            className={`nav-item ${activeTab === 'scan' ? 'active' : ''}`}
            title="Upload Report"
            onClick={() => setActiveTab('scan')}
          >
            <span className="material-icons">cloud_upload</span>
            {!isSidebarCollapsed && <span>Upload Report</span>}
          </a>
          <a
            href="#"
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            title="Dashboard"
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="material-icons">dashboard</span>
            {!isSidebarCollapsed && <span>Dashboard</span>}
          </a>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {/* Theme Toggle */}
          <div className="sidebar-theme-toggle">
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span className="material-icons">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
              {!isSidebarCollapsed && (
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              )}
            </button>
          </div>

          <div className="user-profile-container">
            <div
              className="user-profile"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            >
              <div className="avatar-circle">{getInitials(userName)}</div>
              {!isSidebarCollapsed && (
                <>
                  <div className="user-info">
                    <span className="user-name">{userName}</span>
                  </div>
                  <span className="material-icons dropdown-icon">
                    {isUserDropdownOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </>
              )}
            </div>

            {/* User Dropdown Menu */}
            {isUserDropdownOpen && !isSidebarCollapsed && (
              <div className="user-dropdown">
                <button
                  className={`dropdown-item ${isCalendarConnected ? 'connected' : ''}`}
                  onClick={handleConnectCalendar}
                  disabled={isCalendarConnected}
                >
                  <span className="material-icons">
                    {isCalendarConnected ? 'calendar_today' : 'event'}
                  </span>
                  <span>{isCalendarConnected ? 'Calendar Connected' : 'Connect Calendar'}</span>
                </button>
                <a href="#" className="dropdown-item">
                  <span className="material-icons">settings</span>
                  <span>Settings</span>
                </a>
                <a href="#" className="dropdown-item">
                  <span className="material-icons">logout</span>
                  <span>Logout</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-bar">
          <div className="greeting">
            <h1>Good Morning, User</h1>
            <span className="date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>



          {/* Hidden Input for Upload logic */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            accept="image/*,.pdf"
          />
        </header>

        <div className="dashboard-grid">

          {activeTab === 'scan' ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <ScanPage
                onScanComplete={processFile}
                onSkip={handleSkipScan}
                embedded={true}
              />
            </div>
          ) : (
            <>
              {/* Card 1: Digital Twin 3D View */}
              <div
                className={`card digital-twin-card ${isDragOver ? 'drag-active' : ''} ${isUploading ? 'scanning' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* Scanning Overlay */}
                {isUploading && <div className="scan-overlay"></div>}

                {/* Drop Overlay */}
                {isDragOver && (
                  <div className="drop-overlay">
                    <div className="drop-content">
                      <span className="drop-icon">📂</span>
                      <h3>Release to Scan</h3>
                    </div>
                  </div>
                )}

                <div className="card-header">
                  <h3>Digital Twin Analysis</h3>
                  <span className="status-indicator">{healthData ? '● SYSTEM ONLINE' : '○ WAITING FOR DATA'}</span>
                  {healthData && <span className="timestamp">Last Sync: {healthData.lastScan}</span>}
                </div>

                <div className="canvas-wrapper">
                  <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} />
                    <Suspense fallback={null}>
                      <Environment preset="city" />
                      <VoiceOrb
                        isActive={isVoiceActive}
                        healthStatus={healthData ? healthData.status : 'Neutral'}
                      />
                    </Suspense>
                    <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
                  </Canvas>
                </div>

                <div className="twin-footer">
                  <span className="status-label">
                    {healthData ? (
                      <><i className="material-icons">check_circle</i> {healthData.status.toUpperCase()}</>
                    ) : (
                      <><i className="material-icons">info</i> NO DATA AVAILABLE</>
                    )}
                  </span>
                  <p className="summary-text">
                    {healthData ? healthData.details : 'Please upload a medical report to generate your digital twin analysis.'}
                  </p>
                  <div className="card-actions">
                    {healthData && <button className="btn-secondary">View Full Body Scan</button>}
                  </div>

                  {/* Mic Toggle Button */}
                  <button
                    className={`mic-toggle-btn ${isVoiceActive ? 'active' : ''}`}
                    onClick={() => setIsVoiceActive(!isVoiceActive)}
                    title={isVoiceActive ? "Mute Voice Agent" : "Activate Voice Agent"}
                  >
                    <span className="material-icons">{isVoiceActive ? 'mic' : 'mic_off'}</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Bio-Risk Assessment */}
              <div className="card risk-card">
                <div className="card-header">
                  <h3>Bio-Risk Assessment</h3>
                  <span className="menu-dots">•••</span>
                </div>

                <div className="score-circle-wrapper">
                  <div
                    className="score-circle"
                    style={{
                      background: healthData && !isNaN(parseFloat(healthData.score))
                        ? `conic-gradient(var(--accent-blue) 0% ${healthData.score}%, var(--bg-card-hover) ${healthData.score}% 100%)`
                        : 'var(--bg-card-hover)'
                    }}
                  >
                    <span className="score-value">{healthData ? healthData.score : '--'}</span>
                    <span className="score-label">SCORE</span>
                  </div>
                  <div className="score-meta">
                    <div className="meta-item">
                      <label>Velocity</label>
                      <span className="value safe">{healthData ? healthData.velocity : '--'}</span>
                    </div>
                    <div className="meta-item">
                      <label>Comparison</label>
                      <span className="value">{healthData ? 'Top 10% for age' : '--'}</span>
                    </div>
                  </div>
                </div>

                <div className="risk-factor">
                  <div className="risk-row">
                    <span>Primary Risk Factor</span>
                    <span className="risk-alert">{healthData ? healthData.riskFactor : '--'}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress" style={{ width: healthData ? `${healthData.score}%` : '0%', background: 'var(--accent-orange)' }}></div>
                  </div>
                </div>
              </div>

              {/* Card 3: AI Correlations */}
              <div className="card correlations-card">
                <h3>AI Correlations</h3>

                <div className="correlation-list">
                  {healthData && healthData.correlations && healthData.correlations.length > 0 ? (
                    healthData.correlations.map((item, idx) => (
                      <div className="correlation-item" key={idx}>
                        <div className={`icon-box ${item.type === 'positive' ? 'green' : 'blue'}`}>
                          {item.type === 'positive' ? '☀' : '⚡'}
                        </div>
                        <div className="text-content">
                          <h4>{item.title}</h4>
                          <p>{item.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="correlation-item" style={{ justifyContent: 'center', opacity: 0.6 }}>
                      <div className="text-content" style={{ textAlign: 'center' }}>
                        <p>{healthData ? 'No correlations found.' : 'No correlations found.'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      </main>

      {/* Chat Bot Interface */}
      <div className={`chat-widget ${isChatOpen ? 'open' : ''}`}>
        {/* Toggle Button */}
        {!isChatOpen && (
          <button className="chat-toggle-btn" onClick={() => setIsChatOpen(true)}>
            <span className="material-icons">chat</span>
          </button>
        )}

        {/* Chat Window */}
        {isChatOpen && (
          <div className="chat-window">
            <div className="chat-header">
              <div className="chat-title">
                <span className="material-icons">smart_toy</span>
                <span>Bio-Assistant</span>
              </div>
              <button className="close-btn" onClick={() => setIsChatOpen(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="chat-messages">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.sender}`}>
                  <div className="message-bubble">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {isChatThinking && (
                <div className="message bot">
                  <div className="message-bubble thinking">
                    <span>.</span><span>.</span><span>.</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <input
                type="text"
                placeholder="Ask about your health..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button onClick={handleSendMessage} disabled={!chatInput.trim() || isChatThinking}>
                <span className="material-icons">send</span>
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

export default App
