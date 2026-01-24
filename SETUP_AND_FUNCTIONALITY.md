# Bio-Twin: Complete Setup & Functionality Guide

This document provides step-by-step instructions to install, configure, and run Bio-Twin on Windows, macOS, or Linux.

---

## **System Requirements**

- **Node.js** 16.x or higher (for frontend)
- **Python** 3.10 or higher (for backend)
- **npm** 8.x or higher
- **Git** (for cloning repository)
- Active internet connection (for API keys)

---

## **Pre-Setup: Obtain Required API Keys**

### 1. **Google Gemini API Key**
- Go to [Google AI Studio](https://aistudio.google.com/apikey)
- Click "Create API Key"
- Copy the key and save it (you'll need it for backend setup)

### 2. **Firebase Project Setup**
- Go to [Firebase Console](https://console.firebase.google.com/)
- Click "Create Project"
- Choose a project name (e.g., "Bio-Twin")
- Accept the terms and create the project
- Wait for provisioning to complete

### 3. **Supabase Project Setup**
- Go to [Supabase](https://supabase.com/)
- Click "Start your project"
- Create a new project
- Copy your API Key and Project URL

### 4. **Google OAuth (Optional - for Calendar integration)**
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project
- Enable Google Calendar API
- Create OAuth 2.0 credentials (Desktop app)
- Download as JSON

---

## **Backend Setup (Python)**

### **Step 1: Navigate to Backend**
```bash
cd backend
```

### **Step 2: Create Virtual Environment**

**Windows:**
```bash
python -m venv venv
.\venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### **Step 3: Install Dependencies**
```bash
pip install -r requirements.txt
```

### **Step 4: Configure API Keys**

Create or update `backend/app_secrets.py`:
```python
# Google Gemini API
GEMINI_API_KEY = "your_gemini_api_key_here"

# Firebase Admin SDK (optional)
FIREBASE_CREDENTIALS = "path/to/serviceAccountKey.json"  # If available

# Google Calendar (optional)
GOOGLE_OAUTH_CLIENT_SECRET = "path/to/client_secret.json"  # If available
```

### **Step 5: Verify Backend Installation**

```bash
# Test imports
python -c "import google.generativeai; import fastapi; print('✅ All imports successful')"
```

### **Step 6: Start Backend Server**

```bash
python main.py
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

**Verify backend is running:**
- Open browser: `http://localhost:8000/`
- Should see: `{"message": "Bio-Twin Agentic Health System is Running"}`

---

## **Frontend Setup (React + Vite)**

### **Step 1: Navigate to Frontend** (in new terminal)
```bash
cd frontend
```

### **Step 2: Install Dependencies**
```bash
npm install
```

### **Step 3: Configure Firebase**

1. Open `frontend/src/firebase.js`
2. Replace the firebaseConfig object with your Firebase credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**To get these values:**
- Firebase Console → Project Settings → General
- Scroll to "Your apps" → Click Web icon
- Copy the configuration

### **Step 4: Configure Supabase** (if using storage)

1. Open `frontend/src/supabase.js`
2. Add your Supabase credentials:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### **Step 5: Start Frontend Dev Server**

```bash
npm run dev
```

**Expected Output:**
```
Local:   http://localhost:5173/
```

---

## **Full System Verification Checklist**

### **✅ Backend Running:**
- [ ] Backend server listening on `http://localhost:8000`
- [ ] No error messages in backend terminal
- [ ] Can access `http://localhost:8000/` and see health message

### **✅ Frontend Running:**
- [ ] Frontend server listening on `http://localhost:5173`
- [ ] No compilation errors in frontend terminal
- [ ] React app loads in browser without blank page

### **✅ Firebase Connection:**
- [ ] Can login/signup on the app
- [ ] User data persists after refresh

### **✅ File Upload (Requires Supabase or Firebase Storage):**
- [ ] Can upload a PDF or image
- [ ] File appears in storage backend

### **✅ Gemini AI Analysis:**
- [ ] Uploaded file is processed
- [ ] Health insights are displayed
- [ ] 3D Digital Twin updates

---

## **Testing Workflow**

### **1. User Authentication Test**
```
1. Open http://localhost:5173 in browser
2. Click "Sign Up"
3. Enter email and password
4. Verify you're logged in
5. Check Firebase Console → Authentication to see user
```

### **2. File Upload Test**
```
1. Go to "Upload Report" section
2. Upload a test PDF or medical image
3. Verify file upload completes
4. Check Supabase/Firebase Storage for file
```

### **3. AI Analysis Test**
```
1. After file upload, backend calls Gemini API
2. Health insights should display
3. Check backend logs for Gemini responses
```

### **4. Digital Twin Visualization Test**
```
1. 3D avatar should render on Dashboard
2. Avatar color should change based on health status
3. Try rotating/zooming the 3D model
```

### **5. History Tracking Test**
```
1. Go to "History" tab
2. Should show all previous uploads with timestamps
3. Click on past reports to view details
```

---

## **Troubleshooting**

### **Backend Issues**

**Problem:** `ModuleNotFoundError: No module named 'google'`
```bash
# Solution: Reinstall dependencies
pip install --upgrade -r requirements.txt
```

**Problem:** `GEMINI_API_KEY not found`
```bash
# Solution: Check app_secrets.py exists and has your API key
# Verify: python -c "from app_secrets import GEMINI_API_KEY; print('✅ Key loaded')"
```

**Problem:** Port 8000 already in use
```bash
# Solution: Kill existing process or use different port
# Edit main.py: uvicorn.run(app, host="127.0.0.1", port=8001)
```

### **Frontend Issues**

**Problem:** `Cannot find module 'firebase'`
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Problem:** Firebase config values are invalid
```
# Solution: Double-check values in firebase.js match Firebase Console
# Make sure no extra quotes or spaces in config object
```

**Problem:** 3D model not rendering
```
# Solution: Check browser console (F12) for Three.js errors
# Ensure WebGL is supported: http://get.webgl.org/
```

### **Connection Issues**

**Problem:** Frontend can't reach backend (CORS error)
```
# Solution: Backend already has CORS middleware enabled
# If still failing, restart both servers
```

**Problem:** Can't login to Firebase
```
# Solution: 
# 1. Verify Firebase config in frontend/src/firebase.js
# 2. Check Firebase Console → Authentication is enabled
# 3. Ensure Firestore is created (not just Authentication)
```

---

## **Performance Metrics**

Expected performance on typical hardware:

| Operation | Time |
|---|---|
| App startup | < 5 seconds |
| Login/Signup | 2-3 seconds |
| File upload (2MB) | 3-5 seconds |
| Gemini analysis | 5-15 seconds (depends on file size) |
| 3D Avatar render | < 1 second |
| History load | < 2 seconds |

---

## **Development Mode Features**

### **Hot Reload (Frontend)**
- Frontend automatically reloads on file changes
- No manual refresh needed during development

### **Debug Mode (Backend)**
- Verbose logging enabled
- Gemini API responses logged
- File paths logged for troubleshooting

### **Browser DevTools**
- Open DevTools (F12) to inspect network calls
- Check Console for JavaScript errors
- Check Application tab for stored Firebase auth tokens

---

## **Security Notes for Testing**

⚠️ **IMPORTANT:** This setup uses:
- Firebase Test Mode (for testing only)
- CORS: Allow All (for development convenience)
- Unencrypted API keys in `app_secrets.py` (for testing only)

**Before Production Deployment:**
- [ ] Use Firebase Production Mode with proper security rules
- [ ] Restrict CORS to your domain only
- [ ] Store API keys in environment variables or secrets manager
- [ ] Enable HTTPS
- [ ] Set up proper authentication and authorization

---

## **Building for Deployment**

### **Build Frontend**
```bash
cd frontend
npm run build
```
Output: `frontend/dist/` folder (ready for hosting)

### **Backend Deployment**
```bash
# Using Gunicorn for production
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 main:app
```

---

## **Support & Debugging**

If you encounter issues:
1. Check all API keys are correctly configured
2. Verify all ports are available (8000, 5173)
3. Check terminal output for specific error messages
4. Ensure internet connection for API calls
5. Try restarting both backend and frontend

---

*Last Updated: January 24, 2026*
