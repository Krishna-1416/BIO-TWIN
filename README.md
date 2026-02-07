# Bio-Twin: Your AI-Powered Digital Health Twin

**Bio-Twin** is an active Digital Twin that Sees, Remembers, and Acts on your health data. It transforms your passive medical records into an interactive, reasoning agent that helps you understand and improve your well-being.

---

## 🚩 The Problem
Modern healthcare data is **fragmented and passive**.
1.  **Scattered Records:** Your blood tests, prescriptions, and scans are stuck in PDFs, emails, or physical files.
2.  **No "Big Picture":** It's nearly impossible for a regular person to spot long-term trends (e.g., "Is my Vitamin D dropping over the last 3 years?").
3.  **Passive Data:** Your reports sit in a drawer. They don't jump out and say, "Hey, you need more sunlight!"

## 💡 The Solution: Bio-Twin
Bio-Twin acts as a **living digital replica** of your health.
*   It **ingests** your raw medical files (images/PDFs).
*   It **analyzes** them using advanced AI (Google Gemini) to extract meaning.
*   It **visualizes** your status through a 3D Digital Twin that changes appearance based on your health real-time.

---

## 🛠️ Hybrid Tech Stack
We use a "Best of Breed" approach to ensure security, speed, and reliability.

### **Frontend (The Interface)**
*   **React + Vite:** For a highly responsive, modern user interface.
*   **Three.js (Fiber):** Renders the 3D Digital Twin sphere that visually represents your health state.
*   **Supabase Storage:** Handles secure, fast file uploads for your medical reports.

### **Backend (The Brain)**
*   **Python (FastAPI):** Orchestrates the AI analysis and data flow.
*   **Google Gemini 1.5 Flash:** The multimodal AI prowess that "reads" your medical reports and understands complex health data.

### **Core Infrastructure (The Data)**
*   **Firebase Authentication:** Secure login and user identity management.
*   **Firebase Firestore:** The high-speed database that stores your User Profile, Health Scan History, and analysis results.

---

## 🔄 How It Works (The Workflow)
Here is the simple lifecycle of data in Bio-Twin:

1.  **Upload:** You upload a medical report (PDF/Image) on the Dashboard.
2.  **Store:** The file is securely saved to **Supabase Storage**.
3.  **Analyze:** The backend sends the file to **Gemini AI**, which extracts biomarkers and health insights.
4.  **Save:** The insights + file link are saved to **Firebase Firestore**.
5.  **Visualize:** The frontend updates your history and morphs your **3D Digital Twin** to reflect the new data (e.g., turning "Green" for healthy or "Red" for critical).

---

## 🚀 How to Run It

### Prerequisites
*   Node.js 16+ & npm 8+
*   Python 3.10+
*   Firebase & Supabase project keys
*   Google Gemini API key

### ⚡ Quick Start (5 minutes)

**Prerequisites:**
- Node.js 16+ & npm 8+
- Python 3.10+
- Firebase & Supabase project keys
- Google Gemini API key

### 1. Setup Backend
```bash
cd backend
# Create virtual environment
python -m venv venv
# Activate it (Windows)
.\venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
# Configure API keys in app_secrets.py
# Run the server
python main.py
```

### 2. Setup Frontend
```bash
cd frontend
# Install dependencies
npm install
# Configure Firebase credentials in src/firebase.js
# Start the app
npm run dev
```

### 3. Verify Installation
```bash
# Backend should be running on http://localhost:8000
# Frontend should be running on http://localhost:5173
# Both should show no errors in terminal
```

### 4. Usage
1.  Open `http://localhost:5173` in your browser.
2.  **Login/Signup** to create your secure account **OR** click **"Try Demo"** for instant access.
3.  Go to **Upload Report** and drag-and-drop a blood test or medical scan.
4.  Watch your **Digital Twin** update in real-time.
5.  Check the **History** tab for past trends and health insights.

---

## 🎯 Guest Demo Mode (For Hackathon Judges)

Bio-Twin includes a **frictionless demo mode** that allows judges to experience the full application **without creating an account**.

### How to Use Demo Mode:
1. Click **"Get Started"** on the landing page
2. Click the **"Try Demo"** button (purple gradient button with flask icon)
3. Instantly access the dashboard with **3 pre-loaded health scans** showing:
   - Health score progression: 68 → 75 → 82
   - Multiple biomarker correlations
   - Realistic health journey over 3 months

### What Demo Mode Showcases:
✅ **Gemini AI Analysis** - Pre-populated with realistic health insights  
✅ **Health History** - 3 scans spanning 90 days  
✅ **Trends Visualization** - Score improvement over time  
✅ **Correlations** - Vitamin D, hydration, cholesterol, stress markers  
✅ **3D Digital Twin** - Visual health status representation  
✅ **Chat Agent** - Ask health questions with pre-loaded context

### Firebase Setup for Demo Mode:
To enable Guest Demo Mode, you must enable **Anonymous Authentication** in Firebase:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Anonymous** provider
5. Save changes

**Note:** Demo users are created with Firebase Anonymous Auth and pre-populated with sample health data. No personal information is collected.

---

## 🧪 Functionality Verification

Bio-Twin demonstrates the following core functionalities:

✅ **User Authentication** - Secure login/signup via Firebase  
✅ **Guest Demo Mode** - Instant access with pre-loaded health data (no signup required)  
✅ **Medical Document Processing** - Upload PDF/images of health reports  
✅ **AI Analysis** - Gemini extracts health insights from documents  
✅ **Real-time Visualization** - 3D Digital Twin reflects health status  
✅ **Health History** - Persistent storage of all past scans and insights  
✅ **Trends Analysis** - Track health score progression over time  
✅ **Calendar Integration** - Google Calendar appointment booking  
✅ **Voice Agent** - Hands-free health queries with speech recognition  
✅ **Responsive UI** - Works on desktop and tablets
