# Firebase Configuration Instructions

## Frontend Setup

1. **Get Firebase Config:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project (or create one)
   - Go to Project Settings → General
   - Scroll to "Your apps" and click the Web icon (</>)
   - Copy the `firebaseConfig` object

2. **Update firebase.js:**
   - Open `frontend/src/firebase.js`
   - Replace the placeholder values with your actual Firebase config:
     ```javascript
     const firebaseConfig = {
       apiKey: "YOUR_ACTUAL_API_KEY",
       authDomain: "YOUR_PROJECT.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT.appspot.com",
       messagingSenderId: "YOUR_SENDER_ID",
       appId: "YOUR_APP_ID"
     };
     ```

3. **Enable Firestore:**
   - In Firebase Console, go to Firestore Database
   - Click "Create database"
   - Start in **Test mode** (for development)
   - Choose a location close to you

## Firestore Security Rules

To allow users to save their settings, you must update the security rules:

1. Go to **Firebase Console** → **Firestore Database**
2. Click on the **Rules** tab
3. Replace the existing code with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow users to read and write their OWN profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow reading health data (example structure)
    // match /health_data/{docId} {
    //   allow read: if request.auth != null;
    // }
    
    // Default: Deny everything else
    match /{document=**} {
      allow read, write: if false; 
    }
  }
}
```

4. Click **Publish**.

## Firebase Storage Setup

To store uploaded PDFs/Images:

1. Go to **Firebase Console** → **Storage** (left sidebar)
2. Click **Get Started**
3. Start in **Production Mode**
4. Click **Done**

### Storage Security Rules

1. Go to **Storage** → **Rules** tab
2. Replace the code with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/uploads/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
3. Click **Publish**.

## Backend Setup (Optional)

1. **Download Service Account Key:**
   - Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `backend/serviceAccountKey.json`

2. **Install Python Firebase Admin:**
   ```bash
   cd backend
   pip install firebase-admin
   ```

## Security Notes

- Never commit `serviceAccountKey.json` to git (already in .gitignore)
- For production, use environment variables for Firebase config
- Update Firestore security rules before deploying
