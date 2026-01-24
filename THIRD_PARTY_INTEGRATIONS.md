# Third-Party Integrations & Licensing

Bio-Twin uses the following third-party SDKs, APIs, and services. We are authorized to use each in accordance with their respective terms and conditions.

---

## 1. **Google Gemini 3 API (Core AI)**
- **Provider:** Google
- **Purpose:** Multimodal AI analysis of medical documents (PDF, images)
- **License:** Google API Terms of Service
- **Authorization:** Used via official Google Generative AI SDK (`google-generativeai`)
- **Features Used:**
  - Vision capabilities for medical document analysis
  - Text generation for health insights
  - Function calling for appointment scheduling
- **Compliance:** Free tier used; no commercial usage restrictions for hackathon

---

## 2. **Firebase** (Authentication & Database)
- **Provider:** Google/Firebase
- **Components Used:**
  - Firebase Authentication (user login/signup)
  - Firebase Firestore (health data storage)
- **License:** Firebase Free Tier Terms
- **Authorization:** Official Firebase SDK (`firebase-admin`)
- **Compliance:** Using free tier with standard Terms of Service

---

## 3. **Supabase Storage** (File Upload & Storage)
- **Provider:** Supabase
- **Purpose:** Secure storage of medical document uploads
- **License:** Supabase Open Source License (MIT-based)
- **Authorization:** Official Supabase client SDK
- **Compliance:** Using free tier; open-source compliant

---

## 4. **Google Calendar API** (Appointment Management)
- **Provider:** Google
- **Purpose:** Book and manage medical appointments
- **License:** Google API Terms of Service
- **Authorization:** Official Google API client (`google-api-python-client`)
- **Compliance:** User-authorized via OAuth 2.0; optional feature

---

## 5. **React** (Frontend Framework)
- **Provider:** Meta (Facebook)
- **License:** MIT License
- **Authorization:** Open source - MIT compliant
- **Usage:** Core frontend framework

---

## 6. **Vite** (Frontend Build Tool)
- **Provider:** Evan You & contributors
- **License:** MIT License
- **Authorization:** Open source - MIT compliant
- **Usage:** Fast build tool and dev server

---

## 7. **Three.js & React Three Fiber** (3D Visualization)
- **Provider:** Three.js community & Poimandres
- **License:** MIT License
- **Authorization:** Open source - MIT compliant
- **Purpose:** Render interactive 3D Digital Twin sphere
- **Usage:** Real-time health state visualization

---

## 8. **FastAPI** (Backend Framework)
- **Provider:** Sebastián Ramírez
- **License:** MIT License
- **Authorization:** Open source - MIT compliant
- **Usage:** Python async web framework for API endpoints

---

## 9. **Uvicorn** (ASGI Server)
- **Provider:** Starlette & Uvicorn team
- **License:** BSD License
- **Authorization:** Open source - BSD compliant
- **Usage:** Production-grade ASGI server for FastAPI

---

## 10. **Python Dependencies** (Backend)
All dependencies listed in `requirements.txt`:
- `google-generativeai` - MIT (Google)
- `firebase-admin` - Apache 2.0 (Google)
- `google-auth`, `google-auth-oauthlib`, `google-auth-httplib2` - Apache 2.0 (Google)
- `google-api-python-client` - Apache 2.0 (Google)
- `requests` - Apache 2.0 (kennethreitz)
- `python-multipart` - Apache 2.0

---

## Authorization Summary

✅ **All integrations are authorized for use under:**
- Official SDK/library usage
- Respective license compliance (MIT, Apache 2.0, BSD)
- Free tier terms of service (Google APIs, Firebase, Supabase)
- No commercial restrictions for hackathon/contest purposes

✅ **No unauthorized data usage or IP violations**
- All medical data is user-owned
- No third-party data is embedded or used
- User has full control over their health information

---

## Data Privacy & Security
- Medical documents are stored securely in Supabase
- User authentication via Firebase ensures privacy
- No data is shared with third parties beyond API calls
- Compliant with standard API usage policies

---

*Last Updated: January 24, 2026*
