import os.path
import datetime
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/calendar']

class GoogleCalendarService:
    def __init__(self, user_id: str = None):
        self.creds = None
        self.user_id = user_id
        self.current_user_timezone = 'UTC'
        
        # Load from Firestore if user_id is provided
        if self.user_id:
            from firebase_config import db
            if db:
                doc_ref = db.collection('users').document(self.user_id).collection('tokens').document('calendar')
                doc = doc_ref.get()
                if doc.exists:
                    token_data = doc.to_dict()
                    try:
                        self.creds = Credentials.from_authorized_user_info(token_data, SCOPES)
                    except Exception as e:
                        print(f"Error loading token for {self.user_id}: {e}")
        
        # Fallback to local file ONLY for development/testing if no user_id
        elif os.path.exists('token.json'):
            self.creds = Credentials.from_authorized_user_file('token.json', SCOPES)

    def is_authorized(self):
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                try:
                    self.creds.refresh(Request())
                    # Save refreshed token
                    if self.user_id:
                        self._save_token_to_db()
                    return True
                except:
                    return False
            return False
        return True

    def _save_token_to_db(self):
        from firebase_config import db
        if db and self.user_id and self.creds:
            doc_ref = db.collection('users').document(self.user_id).collection('tokens').document('calendar')
            # Convert credentials to dict
            creds_data = json.loads(self.creds.to_json())
            doc_ref.set(creds_data)

    # ... get_client_config and get_auth_url remain mostly the same ...

    def save_token_from_code(self, code):
        from google_auth_oauthlib.flow import Flow
        import json # Ensure json is imported
        
        client_config = self.get_client_config()
        if not client_config:
             raise FileNotFoundError("Client secret not found")

        # Determine redirect URI
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
        
        if self.user_id:
            self._save_token_to_db()
        else:
            # Fallback for dev
            with open('token.json', 'w') as token:
                token.write(self.creds.to_json())

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
