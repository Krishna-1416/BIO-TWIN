from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os
import warnings

# Suppress the "google.generativeai" deprecation warning for clean logs
warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")

import scanner
import twin_agent
import memory
import firebase_config

app = FastAPI(title="Bio-Twin Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for hackathon prototype
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads dir exists
os.makedirs("uploads", exist_ok=True)

import google_calendar

# Simple global state for health persistence (simulating a DB)
latest_health_data = None

@app.get("/")
def home():
    return {"message": "Bio-Twin Agentic Health System is Running"}

@app.get("/health-data")
def get_health_data():
    return latest_health_data

@app.post("/scan")
def scan_endpoint(file: UploadFile = File(...)):
    global latest_health_data
    file_location = f"uploads/{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    
    result = scanner.scan_document(file_location)
    
    # Persist the result in backend state for true connectivity
    if "error" not in result:
        latest_health_data = {
            "status": result.get("overall_status") or "Neutral",
            "hydration": result.get("hydration_level") or "Medium",
            "lastScan": "Just Now",
            "details": result.get("summary") or "Analysis complete.",
            "score": result.get("health_score") or "--",
            "velocity": result.get("velocity") or "Unknown",
            "riskFactor": result.get("primary_risk") or "None",
            "correlations": result.get("correlations") or []
        }
        
        # Also save to Firestore if available
        if firebase_config.db:
            try:
                from datetime import datetime
                health_doc = {
                    **latest_health_data,
                    "timestamp": datetime.now()
                }
                firebase_config.db.collection('healthScans').add(health_doc)
                print("Health data saved to Firestore")
            except Exception as e:
                print(f"Error saving to Firestore: {e}")
    
    return result

@app.get("/auth/google")
def google_auth():
    service = google_calendar.GoogleCalendarService()
    try:
        url = service.get_auth_url()
        return {"url": url}
    except Exception as e:
        return {"error": str(e), "message": "Ensure client_secret.json is present in the root directory."}

@app.get("/auth/callback")
def google_callback(code: str):
    service = google_calendar.GoogleCalendarService()
    try:
        service.save_token_from_code(code)
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url="http://localhost:5173/?auth=success")
    except Exception as e:
        return {"error": str(e)}

@app.get("/auth/status")
def google_status():
    service = google_calendar.GoogleCalendarService()
    return {"connected": service.is_authorized()}

class AgentRequest(BaseModel):
    # Flexible dict input for prototype
    metrics: dict

# Global Agent Instance for Persistence (Single-User Prototype)
global_agent = twin_agent.GeminiAgent()

@app.post("/agent-act")
def run_agent(request: AgentRequest):
    # Reuse global agent to maintain context
    response = global_agent.run(request.metrics)
    return {"agent_response": response}

class ChatRequest(BaseModel):
    message: str
    context: dict | None = None

@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    # Reuse global agent to maintain conversation history
    
    # Inject current system time and timezone context
    from datetime import datetime
    try:
        from zoneinfo import ZoneInfo
    except ImportError:
        # Fallback for Python < 3.9
        from backports.zoneinfo import ZoneInfo

    # Determine user timezone from context, default to UTC
    user_tz_str = "UTC"
    if request.context and "timezone" in request.context:
        user_tz_str = request.context["timezone"]
    
    try:
        # Get time in user's timezone
        current_time = datetime.now(ZoneInfo(user_tz_str))
    except Exception:
        # Fallback to server time if timezone invalid
        current_time = datetime.now()
        
    current_time_str = current_time.strftime("%A, %B %d, %Y %I:%M %p")
    
    # Merge existing context with time info
    initial_context = request.context or {}
    # Ensure it's a dict (Pydantic might pass None)
    if not isinstance(initial_context, dict):
        initial_context = {}
        
    initial_context["system_time"] = current_time_str
    # Explicitly Note the timezone for the agent
    initial_context["note"] = f"Current Date & Time is {current_time_str} ({user_tz_str}). Use this for all scheduling."

    if request.context:
        # Update user provided context with time
        request.context.update(initial_context)
        response = global_agent.reply(request.message, context=request.context)
    else:
        # Create new context with just time
        response = global_agent.reply(request.message, context=initial_context)
    return {"reply": response}

@app.get("/memory/analyze")
def analyze_history():
    insight = memory.load_history()
    return {"analysis": insight}

class AppointmentRequest(BaseModel):
    summary: str
    description: str
    start_time: str  # ISO format: "2026-01-20T14:00:00"
    duration_mins: int = 60

@app.post("/calendar/create-appointment")
def create_appointment(request: AppointmentRequest):
    service = google_calendar.GoogleCalendarService()
    result = service.create_event(
        summary=request.summary,
        description=request.description,
        start_time_str=request.start_time,
        duration_mins=request.duration_mins
    )
    return result

@app.post("/calendar/block-time")
def block_time(reason: str, duration_mins: int = 60):
    service = google_calendar.GoogleCalendarService()
    result = service.block_time(reason, duration_mins)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
