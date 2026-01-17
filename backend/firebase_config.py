import firebase_admin
from firebase_admin import credentials, firestore
import os

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK with service account credentials"""
    try:
        # Check if already initialized
        firebase_admin.get_app()
        print("Firebase already initialized")
    except ValueError:
        # Path to service account key
        cred_path = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')
        
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully")
        else:
            print("WARNING: serviceAccountKey.json not found. Backend Firebase features disabled.")
            print("Download your service account key from Firebase Console and save it as backend/serviceAccountKey.json")
            return None
    
    return firestore.client()

# Initialize on import
db = initialize_firebase()
