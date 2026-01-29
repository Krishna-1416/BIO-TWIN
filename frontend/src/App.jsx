import React, { useState, Suspense, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
// import BioAvatar from './components/BioAvatar'
import VoiceOrb from './components/VoiceOrb'
import LandingPage from './components/LandingPage'
import ScanPage from './components/ScanPage'
import AuthPage from './components/AuthPage'
import NameCollectionModal from './components/NameCollectionModal'
import SettingsPage from './components/SettingsPage'
import HistoryPage from './components/HistoryPage'
import TrendsPage from './components/TrendsPage'
import ReactMarkdown from 'react-markdown'
import { db, auth } from './firebase'
import { supabase } from './supabase'
import { collection, addDoc, query, orderBy, limit, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import './App.css'

// Backend URL configuration (supports both dev and production)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

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
  const [view, setView] = useState('landing'); // 'landing', 'auth', 'app', or 'settings'
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' or 'dashboard'
  const [healthData, setHealthData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const fileInputRef = useRef(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // User State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userName, setUserName] = useState('Guest User');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [userTimezone, setUserTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone); // Default to browser TZ

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Try to get first name from displayName, otherwise use email username
        if (currentUser.displayName) {
          // Extract first name from full name (e.g., "John Doe" -> "John")
          const firstName = currentUser.displayName.split(' ')[0];
          setUserName(firstName);
          setShowNameModal(false); // Has name, don't show modal
        } else {
          // No display name - show modal to collect name
          setUserName(currentUser.email.split('@')[0]);
          setShowNameModal(true);
        }
      } else {
        setShowNameModal(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch User Preferences (Timezone) - Real-time listener
  useEffect(() => {
    if (!user) return;

    // Set up real-time listener for user preferences
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.timezone) {
            setUserTimezone(data.timezone);
            console.log("✅ Timezone updated (real-time):", data.timezone);
          }
        }
      },
      (error) => {
        console.error("Error listening to user preferences:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);


  // Fetch initial health data from Firestore
  useEffect(() => {
    const loadHealthData = async () => {
      try {
        const q = query(
          collection(db, 'healthScans'),
          orderBy('timestamp', 'desc'),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const latestScan = querySnapshot.docs[0].data();
          setHealthData(latestScan);
        }
      } catch (error) {
        console.error("Error loading health data from Firestore:", error);
      }
    };
    if (view === 'app') {
      const loadHealthData = async () => {
        try {
          const q = query(
            collection(db, 'healthScans'),
            orderBy('timestamp', 'desc'),
            limit(1)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const latestScan = querySnapshot.docs[0].data();
            setHealthData(latestScan);
          }
        } catch (error) {
          console.error("Error loading health data from Firestore:", error);
        }
      };
      loadHealthData();
    }
  }, [view]);

  const hasCheckedCalendar = useRef(false);

  useEffect(() => {
    const checkAndConnectCalendar = async () => {
      if (hasCheckedCalendar.current) return;
      hasCheckedCalendar.current = true;

      try {
        const statusRes = await fetch(`${BACKEND_URL}/auth/status`);
        const statusData = await statusRes.json();

        if (statusData.connected) {
          setIsCalendarConnected(true);
        } else if (user && view === 'app') {
          // Auto-connect to Google Calendar if user is logged in but calendar isn't connected
          // console.log("Auto-connecting to Google Calendar..."); // Silence spam
          try {
            const authRes = await fetch(`${BACKEND_URL}/auth/google`);
            const authData = await authRes.json();

            // Check if calendar feature is unavailable (production)
            if (authData.error && authData.error.includes("Calendar feature not available")) {
              console.log("Calendar feature disabled in production");
              return; // Skip auto-connect
            }

            if (authData.url) {
              // Open auth window quietly
              const authWindow = window.open(authData.url, 'google_calendar_auth', 'width=500,height=600');

              // Check connection status after a few seconds
              setTimeout(() => {
                fetch(`${BACKEND_URL}/auth/status`)
                  .then(res => res.json())
                  .then(data => {
                    if (data.connected) {
                      setIsCalendarConnected(true);
                      if (authWindow) authWindow.close();
                    }
                  });
              }, 3000);
            }
          } catch (err) {
            console.error("Auto-connect failed:", err);
          }
        }
      } catch (err) {
        console.error("Error checking calendar status:", err);
      }
    };

    if (view === 'app' && user) {
      checkAndConnectCalendar();
    }
  }, [view, user]);

  const handleConnectCalendar = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/google`);
      const data = await response.json();

      if (data.error) {
        alert(data.message || "Calendar feature unavailable");
        return;
      }

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

  // Create an appointment in Google Calendar
  const createAppointment = async (summary, description, startTime, durationMins = 60) => {
    try {
      const response = await fetch(`${BACKEND_URL}/calendar/create-appointment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          description,
          start_time: startTime,
          duration_mins: durationMins,
          timezone: userTimezone,
          user_id: user?.uid || "guest_user"
        })
      });
      const data = await response.json();
      if (data.status === "success") {
        alert(`✅ Appointment created!\nEvent: ${summary}\nLink: ${data.link}`);
        return data;
      } else {
        alert(`❌ Error: ${data.message}`);
        return null;
      }
    } catch (err) {
      console.error("Appointment creation error:", err);
      alert("Failed to create appointment");
      return null;
    }
  };

  // Block time on calendar (for health-related blocks)
  const blockCalendarTime = async (reason, durationMins = 60) => {
    try {
      const response = await fetch(`${BACKEND_URL}/calendar/block-time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          duration_mins: durationMins,
          timezone: userTimezone,
          user_id: user?.uid || "guest_user"
        })
      });
      const data = await response.json();
      if (data.status === "success") {
        alert(`⏱️ Time blocked on calendar!\nReason: ${reason}\nDuration: ${durationMins} mins`);
        return data;
      } else {
        alert(`❌ Error: ${data.message}`);
        return null;
      }
    } catch (err) {
      console.error("Block time error:", err);
      alert("Failed to block time on calendar");
      return null;
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
  const restartTimeoutRef = useRef(null);
  const networkErrorCountRef = useRef(0);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn("Speech recognition not supported");
      alert("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isVoiceActive) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false; // Stop after one phrase, then manually restart
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log("Voice: Listening...");
        networkErrorCountRef.current = 0; // Reset error count on successful start
      };

      recognition.onresult = (event) => {
        if (event.results.length > 0) {
          const result = event.results[event.results.length - 1];
          const transcript = result[0].transcript.trim();
          const confidence = result[0].confidence;

          console.log("Voice heard:", transcript, "| Confidence:", confidence);

          // Only process if:
          // 1. It's a final result (not interim)
          // 2. Confidence is above threshold (0.7 = 70%)
          // 3. Has at least 2 words (filters out noise/single syllables)
          const wordCount = transcript.split(/\s+/).filter(w => w.length > 0).length;

          if (result.isFinal && confidence >= 0.7 && wordCount >= 2) {
            setChatInput(transcript); // Set input for visual feedback
            handleSendMessage(transcript); // Auto-send
          } else if (result.isFinal) {
            console.log(`Ignored: confidence=${confidence.toFixed(2)}, words=${wordCount}`);
          }
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        networkErrorCountRef.current++;

        if (event.error === 'network') {
          console.warn("Network error - Check internet connection or microphone access");
          if (networkErrorCountRef.current > 3) {
            console.error("Multiple network errors. Disabling voice mode.");
            setIsVoiceActive(false);
            setChatMessages(prev => [...prev, {
              sender: 'bot',
              text: "❌ Voice agent disconnected due to network issues. Please check your internet connection and microphone permissions, then try again."
            }]);
          }
        } else if (event.error === 'no-speech') {
          console.log("No speech detected, will retry...");
        } else if (event.error === 'permission-denied') {
          console.error("Microphone permission denied");
          setIsVoiceActive(false);
          setChatMessages(prev => [...prev, {
            sender: 'bot',
            text: "❌ Microphone access denied. Please allow microphone access in browser settings."
          }]);
        }
      };

      recognition.onend = () => {
        console.log("Recognition ended");
        // Restart listening if voice is still active and error count is reasonable
        if (isVoiceActive && networkErrorCountRef.current < 3) {
          // Add a small delay before restarting to avoid rapid-fire restarts on network errors
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
          }
          restartTimeoutRef.current = setTimeout(() => {
            if (isVoiceActive && recognitionRef.current) {
              try {
                console.log("Restarting voice recognition...");
                recognitionRef.current.start();
              } catch (e) {
                console.error("Error restarting recognition:", e);
              }
            }
          }, 2000); // 2 second delay before restart (less sensitive)
        }
      };

      try {
        recognition.start();
      } catch (e) {
        console.error("Error starting recognition:", e);
      }
      recognitionRef.current = recognition;
    } else {
      // Stop recognition if active
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) { }
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      window.speechSynthesis.cancel(); // Stop talking
      networkErrorCountRef.current = 0;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) { }
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
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
      // Recognition will continue automatically since continuous: true
      console.log("Bot finished speaking, voice agent still listening...");
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
      // Get current date/time in user's timezone for accurate scheduling
      const now = new Date();
      const currentDateTime = now.toLocaleString('en-US', {
        timeZone: userTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msgToSend,
          context: {
            ...healthData,
            timezone: userTimezone,
            currentDateTime: currentDateTime,
            currentDateISO: now.toISOString()
          }
        })
      });
      const data = await response.json();

      setChatMessages(prev => [...prev, { sender: 'bot', text: data.response }]);

      // Speak the response if voice mode is on
      speakResponse(data.response);
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout for large files

      console.log("Starting scan...");
      const response = await fetch(`${BACKEND_URL}/scan`, {
        method: "POST",
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      console.log("Scan response received");

      const data = await response.json();

      if (data.error) {
        if (data.error.includes("429")) {
          alert("Traffic Limit Reached. The system is auto-retrying, but you may need to wait 30-60s before the next scan.");
        } else {
          alert("Scan Error: " + data.error);
        }
      } else {
        // Upload to Supabase Storage
        let fileUrl = null;
        if (auth.currentUser) {
          try {
            // Create unique filename to prevent overwrites
            const fileName = `${Date.now()}-${file.name}`;
            const filePath = `${auth.currentUser.uid}/uploads/${fileName}`;

            console.log("Uploading to Supabase Storage...");
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('health-reports')
              .upload(filePath, file);

            if (uploadError) {
              console.error("Storage upload error:", uploadError);
            } else {
              // Get public URL
              const { data: { publicUrl } } = supabase.storage
                .from('health-reports')
                .getPublicUrl(filePath);

              fileUrl = publicUrl;
              console.log("File uploaded to:", fileUrl);
            }
          } catch (storageErr) {
            console.error("Storage upload failed", storageErr);
          }
        }

        const healthDataToSave = {
          status: data.overall_status || 'Critical',
          hydration: data.hydration_level || 'Medium',
          lastScan: 'Just Now',
          details: data.summary || 'Analysis complete.',
          score: data.health_score || '--',
          velocity: data.velocity || 'Unknown',
          riskFactor: data.primary_risk || 'None',
          correlations: data.correlations || [],
          timestamp: new Date(),
          fileUrl: fileUrl,
          fileName: file.name,
          fileType: file.type,
          userId: auth.currentUser.uid
        };

        // Save to Firestore
        try {
          await addDoc(collection(db, 'healthScans'), healthDataToSave);
          console.log('Health data saved to Firestore');
        } catch (firestoreError) {
          console.error('Error saving to Firestore:', firestoreError);
        }

        setHealthData(healthDataToSave);

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('landing');
      setHealthData(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Name modal handlers
  const handleNameComplete = (firstName) => {
    setUserName(firstName);
    setShowNameModal(false);
  };

  const handleNameSkip = () => {
    setShowNameModal(false);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  // Landing page
  if (view === 'landing') {
    return <LandingPage onEnterApp={() => setView(user ? 'app' : 'auth')} theme={theme} toggleTheme={toggleTheme} />;
  }

  // Auth page (if not logged in)
  if (view === 'auth' || (!user && view === 'app')) {
    return <AuthPage onAuthSuccess={() => setView('app')} theme={theme} toggleTheme={toggleTheme} />;
  }





  return (
    <div className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Top Left Brand Header */}
      <div className="brand app-brand-header">
        <div className="logo-icon">
          <img src="/logo.png" alt="BioTwin Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
        </div>
        <div className="brand-text">
          <span className="name">BioTwin</span>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="mobile-header">
        <button
          className="hamburger-btn"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <span className="material-icons">menu</span>
        </button>
        <div className="brand-text">
          <span className="name">BioTwin</span>
        </div>
        <div style={{ width: '44px' }}></div> {/* Spacer for centering */}
      </div>

      {/* Mobile Overlay */}
      <div
        className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button
            className="sidebar-toggle"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Maximize Menu" : "Minimize Menu"}
          >
            <span className="material-icons">menu</span>
          </button>
        </div>

        <nav className="nav-menu">
          <a
            href="#"
            className={`nav-item ${view === 'app' && activeTab === 'scan' ? 'active' : ''}`}
            title="Upload Report"
            onClick={() => { setView('app'); setActiveTab('scan'); setIsMobileMenuOpen(false); }}
          >
            <span className="material-icons">cloud_upload</span>
            {!isSidebarCollapsed && <span>Upload Report</span>}
          </a>
          <a
            href="#"
            className={`nav-item ${view === 'app' && activeTab === 'dashboard' ? 'active' : ''}`}
            title="Dashboard"
            onClick={() => { setView('app'); setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
          >
            <span className="material-icons">dashboard</span>
            {!isSidebarCollapsed && <span>Dashboard</span>}
          </a>
          <a
            href="#"
            className={`nav-item ${view === 'trends' ? 'active' : ''}`}
            title="Trends"
            onClick={() => { setView('trends'); setIsMobileMenuOpen(false); }}
          >
            <span className="material-icons">show_chart</span>
            {!isSidebarCollapsed && <span>Trends</span>}
          </a>
          <a
            href="#"
            className={`nav-item ${view === 'history' ? 'active' : ''}`}
            title="History"
            onClick={() => { setView('history'); setIsMobileMenuOpen(false); }}
          >
            <span className="material-icons">history</span>
            {!isSidebarCollapsed && <span>History</span>}
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
                <button className="dropdown-item" onClick={() => { setView('settings'); setIsUserDropdownOpen(false); }}>
                  <span className="material-icons">settings</span>
                  <span>Settings</span>
                </button>
                <button className="dropdown-item" onClick={handleLogout}>
                  <span className="material-icons">logout</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content" style={{ overflowY: 'auto' }}>
        {view === 'settings' ? (
          <SettingsPage />
        ) : view === 'trends' ? (
          <TrendsPage />
        ) : view === 'history' ? (
          <HistoryPage />
        ) : (
          <>
            <header className="top-bar">
              <div className="greeting">
                <h1>Good Morning, {userName}</h1>
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
                        {healthData && healthData.fileUrl && (
                          <button
                            className="btn-secondary"
                            onClick={() => window.open(healthData.fileUrl, '_blank')}
                          >
                            View Original Report
                          </button>
                        )}
                      </div>

                      {/* Mic Toggle Button */}
                      <button
                        className={`mic-toggle-btn ${isVoiceActive ? 'active' : ''}`}
                        onClick={() => {
                          const newState = !isVoiceActive;
                          setIsVoiceActive(newState);
                          if (newState) {
                            setChatMessages(prev => [...prev, {
                              sender: 'bot',
                              text: "🎤 Voice agent activated. Make sure your microphone is enabled and you have internet connection. Speak your questions and I'll respond!"
                            }]);
                          }
                        }}
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
          </>
        )}
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

      {/* Name Collection Modal */}
      {showNameModal && user && (
        <NameCollectionModal
          onComplete={handleNameComplete}
          onSkip={handleNameSkip}
        />
      )}

    </div>
  )
}

export default App
