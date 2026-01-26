from fastapi import FastAPI, UploadFile, File, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os
import warnings
from firebase_admin import firestore

# Suppress the "google.generativeai" deprecation warning for clean logs
warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")

import scanner
import twin_agent
import memory
import firebase_config
import google_calendar

app = FastAPI(title="Bio-Twin Backend")

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
]

# Add specific production origin
if os.getenv("FRONTEND_URL"):
    origins.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads dir exists
os.makedirs("uploads", exist_ok=True)

# Helper to get user_id from request logic
def get_user_id(request_data: dict = None, query_param: str = None) -> str:
    # 1. Try context/dict
    if request_data and "user_id" in request_data:
        return request_data["user_id"]
    if request_data and "context" in request_data and isinstance(request_data["context"], dict):
        return request_data["context"].get("user_id")
    
    # 2. Try query param
    if query_param:
        return query_param

    # 3. Fallback to guest (Secure in prod requires auth middleware, but this keeps prototype working)
    return "guest_user"

# In-Memory Session Storage
# Maps user_id -> GeminiAgent instance
# This ensures conversation continuity WITHOUT permanent DB storage
user_sessions = {}

@app.get("/")
def home():
    return {"message": "Bio-Twin Agentic Health System is Running"}

@app.get("/health-data")
def get_health_data(user_id: str = "guest_user"):
    # Read from Firestore
    if firebase_config.db:
        try:
            # Query latest scan for this user
            docs = firebase_config.db.collection('users').document(user_id).collection('healthScans')\
                .order_by('timestamp', direction='DESCENDING').limit(1).stream()
            
            for doc in docs:
                return doc.to_dict()
        except Exception as e:
            print(f"Error fetching health data: {e}")
            return None
    return None

@app.post("/scan")
def scan_endpoint(file: UploadFile = File(...), user_id: str = "guest_user"):
    file_location = f"uploads/{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    
    result = scanner.scan_document(file_location)
    
    # Persist the result in DB
    if "error" not in result:
        health_data = {
            "status": result.get("overall_status") or "Neutral",
            "hydration": result.get("hydration_level") or "Medium",
            "lastScan": "Just Now",
            "details": result.get("summary") or "Analysis complete.",
            "score": result.get("health_score") or "--",
            "velocity": result.get("velocity") or "Unknown",
            "riskFactor": result.get("primary_risk") or "None",
            "correlations": result.get("correlations") or [],
            "user_id": user_id
        }
        
        # Save to Firestore
        if firebase_config.db:
            try:
                from datetime import datetime
                health_doc = {
                    **health_data,
                    "timestamp": datetime.now()
                }
                firebase_config.db.collection('users').document(user_id).collection('healthScans').add(health_doc)
                print(f"Health data saved to Firestore for {user_id}")
            except Exception as e:
                print(f"Error saving to Firestore: {e}")
    
    return result

@app.get("/auth/google")
def google_auth(user_id: str = "guest_user"):
    # Check credentials
    if not os.getenv('GOOGLE_CLIENT_SECRET') and not os.path.exists('client_secret.json'):
         return {"error": "Calendar feature not available", "message": "Missing credentials"}
    
    # Init service with user_id
    service = google_calendar.GoogleCalendarService(user_id=user_id)
    try:
        url = service.get_auth_url()
        # TODO: Ideally append state=user_id to URL to recover it in callback
        return {"url": url}
    except Exception as e:
        return {"error": str(e), "message": "Calendar authentication unavailable."}

@app.get("/auth/callback")
def google_callback(code: str, state: str = None):
    # Retrieve user_id from state if we implemented it, otherwise fallback
    # For now, we assume single-user behavior for the callback flow or need frontend to handle
    user_id = "guest_user" # Limitation: Simple callback can't infer user without state param
    
    service = google_calendar.GoogleCalendarService(user_id=user_id)
    try:
        service.save_token_from_code(code)
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/?auth=success")
    except Exception as e:
        return {"error": str(e)}

@app.get("/auth/status")
def google_status(user_id: str = "guest_user"):
    service = google_calendar.GoogleCalendarService(user_id=user_id)
    return {"connected": service.is_authorized()}

class AgentRequest(BaseModel):
    metrics: dict
    user_id: str = "guest_user"

@app.post("/agent-act")
def run_agent(request: AgentRequest):
    # stateless agent
    agent = twin_agent.GeminiAgent(user_id=request.user_id)
    response = agent.run(request.metrics)
    return {"agent_response": response}

class ChatRequest(BaseModel):
    message: str
    context: dict | None = None

@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    user_id = get_user_id(request.dict())
    
    # Initialize Agent from In-Memory Session Store
    if user_id in user_sessions:
        agent = user_sessions[user_id]
    else:
        # Create new agent and store in session
        agent = twin_agent.GeminiAgent(user_id=user_id)
        user_sessions[user_id] = agent
    
    # Get Reply
    response_text = agent.reply(request.message, context=request.context)
    
    # Note: We do NOT save history to DB anymore, as per user request.
    # History persists in memory within the `agent` instance in `user_sessions`.

    return {"response": response_text}

# Debug Endpoints remain same
@app.on_event("startup")
async def startup_event():
    key = os.getenv("GEMINI_API_KEY")
    if key:
        print(f"🔑 DEBUG: Loaded API Key. Length: {len(key)}")
    else:
        print("❌ DEBUG: No API Key found.")

@app.get("/debug/config")
def debug_config():
    key = os.getenv("GEMINI_API_KEY")
    if not key:
         return {"status": "error"}
    return {"status": "ok", "key_length": len(key), "key_end": key[-4:]}

@app.get("/debug/oauth-config")
def debug_oauth_config():
    import os
    return {
        "frontend_url": os.getenv("FRONTEND_URL"),
        "render_external_url": os.getenv("RENDER_EXTERNAL_URL"),
        "google_client_secret_set": bool(os.getenv("GOOGLE_CLIENT_SECRET"))
    }
