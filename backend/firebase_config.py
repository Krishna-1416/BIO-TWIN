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
        # Check for environment variable (for Render/Production)
        firebase_creds = os.getenv('FIREBASE_CREDENTIALS')
        
        if firebase_creds:
            import json
            try:
                # Parse the JSON string from environment variable
                cred_dict = json.loads(firebase_creds)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                print("Firebase Admin SDK initialized from environment variable")
                return firestore.client()
            except Exception as e:
                print(f"Error parsing FIREBASE_CREDENTIALS: {e}")

        # Fallback: Check for local file (Development)
        cred_path = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')
        
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized from local file")
        else:
            print("WARNING: serviceAccountKey.json not found and FIREBASE_CREDENTIALS env var missing.")
            print("Backend Firebase features disabled.")
            return None
    
    return firestore.client()

# Initialize on import
db = initialize_firebase()
