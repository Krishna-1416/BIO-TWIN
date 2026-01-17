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
*   Node.js & npm
*   Python 3.10+
*   Firebase & Supabase project keys

### 1. Setup Backend
```bash
cd backend
# Create virtual environment
python -m venv venv
# Activate it (Windows)
.\venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
# Run the server
python main.py
```

### 2. Setup Frontend
```bash
cd frontend
# Install dependencies
npm install
# Start the app
npm run dev
```

### 3. Usage
1.  Open `http://localhost:5173` in your browser.
2.  **Login/Signup** to create your secure account.
3.  Go to **Upload Report** and drag-and-drop a blood test or medical scan.
4.  Watch your **Digital Twin** update and check the **History** tab for past trends!
