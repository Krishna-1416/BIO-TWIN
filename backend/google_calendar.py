import os.path
import datetime
import json
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Firebase Admin SDK for token storage
import firebase_admin
from firebase_admin import firestore

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/calendar']

class GoogleCalendarService:
    def __init__(self, user_id: str = "guest_user"):
        self.user_id = user_id
        self.creds = None
        self.current_user_timezone = 'UTC'  # Default timezone, will be set by context
        
        # Get Firestore client for token storage
        self.db = firestore.client()
        
        # Try to load tokens from Firestore first, fallback to local file for dev
        self._load_credentials()
    
    def _load_credentials(self):
        """Load credentials from Firestore (production) or local file (development)"""
        # Try Firestore first (works on Render)
        try:
            token_doc = self.db.collection('oauth_tokens').document(self.user_id).get()
            if token_doc.exists:
                token_data = token_doc.to_dict()
                if token_data and 'token' in token_data:
                    self.creds = Credentials.from_authorized_user_info(token_data['token'], SCOPES)
                    print(f"[CALENDAR] Loaded credentials from Firestore for user: {self.user_id}")
                    return
        except Exception as e:
            print(f"[CALENDAR] Could not load from Firestore: {e}")
        
        # Fallback to local file for development
        if os.path.exists('token.json'):
            self.creds = Credentials.from_authorized_user_file('token.json', SCOPES)
            print(f"[CALENDAR] Loaded credentials from local token.json")
    
    def _save_credentials(self):
        """Save credentials to both Firestore (for production) and local file (for dev)"""
        if not self.creds:
            return
            
        token_info = json.loads(self.creds.to_json())
        
        # Save to Firestore (primary - works on Render)
        try:
            self.db.collection('oauth_tokens').document(self.user_id).set({
                'token': token_info,
                'updated_at': datetime.datetime.now(),
                'user_id': self.user_id
            })
            print(f"[CALENDAR] Saved credentials to Firestore for user: {self.user_id}")
        except Exception as e:
            print(f"[CALENDAR] Error saving to Firestore: {e}")
        
        # Also save locally for development convenience
        try:
            with open('token.json', 'w') as token:
                token.write(self.creds.to_json())
        except Exception as e:
            print(f"[CALENDAR] Could not save local token file: {e}")

    def is_authorized(self):
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                try:
                    self.creds.refresh(Request())
                    # Save refreshed token
                    self._save_credentials()
                    return True
                except Exception as e:
                    print(f"[CALENDAR] Token refresh failed: {e}")
                    return False
            return False
        return True

    def get_client_config(self):
        # Return client config from env var or file
        if os.getenv('GOOGLE_CLIENT_SECRET'):
            import json
            try:
                return json.loads(os.getenv('GOOGLE_CLIENT_SECRET'))
            except Exception as e:
                print(f"Error parsing GOOGLE_CLIENT_SECRET: {e}")
        
        # Fallback to file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        secret_path = os.path.join(current_dir, 'client_secret.json')
        
        if os.path.exists(secret_path):
            return secret_path
        return None

    def get_auth_url(self):
        from google_auth_oauthlib.flow import Flow
        
        client_config = self.get_client_config()
        if not client_config:
            raise FileNotFoundError("Client secret not found via env var or file")

        # Determine redirect URI based on environment
        # Use FRONTEND_URL if set, otherwise localhost
        redirect_uri = 'http://localhost:8000/auth/callback'
        if os.getenv('FRONTEND_URL'):
            # In production, backend URL + /auth/callback
            # We need the backend URL here, user might need to set BACKEND_PUBLIC_URL 
            # Or we infer from FRONTEND_URL if they are on same domain (unlikely)
            # For Render, use the public backend URL
            backend_url = os.getenv('RENDER_EXTERNAL_URL') or "https://bio-twin.onrender.com"
            redirect_uri = f"{backend_url}/auth/callback"

        if isinstance(client_config, dict):
             flow = Flow.from_client_config(
                client_config,
                scopes=SCOPES,
                redirect_uri=redirect_uri
            )
        else:
            flow = Flow.from_client_secrets_file(
                client_config, 
                scopes=SCOPES,
                redirect_uri=redirect_uri
            )
            
        auth_url, _ = flow.authorization_url(prompt='consent', access_type='offline')
        return auth_url

    def save_token_from_code(self, code):
        from google_auth_oauthlib.flow import Flow
        
        client_config = self.get_client_config()
        if not client_config:
             raise FileNotFoundError("Client secret not found")

        # Determine redirect URI (MUST match what was sent in get_auth_url)
        redirect_uri = 'http://localhost:8000/auth/callback'
        if os.getenv('FRONTEND_URL'):
            backend_url = os.getenv('RENDER_EXTERNAL_URL') or "https://bio-twin.onrender.com"
            redirect_uri = f"{backend_url}/auth/callback"

        if isinstance(client_config, dict):
            flow = Flow.from_client_config(
                client_config,
                scopes=SCOPES,
                redirect_uri=redirect_uri
            )
        else:
            flow = Flow.from_client_secrets_file(
                client_config, 
                scopes=SCOPES,
                redirect_uri=redirect_uri
            )
        flow.fetch_token(code=code)
        self.creds = flow.credentials
        
        # Save to Firestore and local file
        self._save_credentials()

    def create_event(self, summary, description, start_time_str, duration_mins=60, timezone='UTC'):
        if not self.is_authorized():
            return {"status": "error", "message": "Not authorized"}

        try:
            service = build('calendar', 'v3', credentials=self.creds)

            try:
                start_time = datetime.datetime.fromisoformat(start_time_str)
            except ValueError:
                return {"status": "error", "message": f"Invalid date format: '{start_time_str}'. Expected ISO format (YYYY-MM-DDTHH:MM:SS)"}

            end_time = start_time + datetime.timedelta(minutes=duration_mins)

            event = {
                'summary': summary,
                'description': description,
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': timezone,
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': timezone,
                },
            }

            event = service.events().insert(calendarId='primary', body=event).execute()
            return {"status": "success", "event_id": event.get('id'), "link": event.get('htmlLink')}

        except HttpError as error:
            return {"status": "error", "message": str(error)}

    def block_time(self, reason, duration_mins):
        # Use user's timezone instead of UTC
        try:
            from zoneinfo import ZoneInfo
        except ImportError:
            from backports.zoneinfo import ZoneInfo
        
        tz = ZoneInfo(self.current_user_timezone) if self.current_user_timezone else ZoneInfo('UTC')
        now = datetime.datetime.now(tz).replace(microsecond=0)
        
        # Block from next available 15-min slot
        minutes_until_next_slot = 15 - (now.minute % 15)
        start_time = now + datetime.timedelta(minutes=minutes_until_next_slot)
        
        return self.create_event(
            summary=f"Bio-Twin: {reason}",
            description="Automated health block generated by your Bio-Twin agent.",
            start_time_str=start_time.isoformat(),
            duration_mins=duration_mins,
            timezone=self.current_user_timezone
        )
