import os
import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool
try:
    from app_secrets import GEMINI_API_KEY
except ImportError:
    GEMINI_API_KEY = None
import datetime

# Prioritize environment variable (for Render), fallback to local file
api_key = os.getenv("GEMINI_API_KEY") or GEMINI_API_KEY

if not api_key:
    # Print warning but don't crash yet, let the agent fail gracefully if called
    print("WARNING: GEMINI_API_KEY not found in environment or app_secrets.py")

if api_key:
    genai.configure(api_key=api_key)

import google_calendar

class GeminiAgent:
    def __init__(self, user_id: str = "guest_user"):
        self.user_id = user_id
        self.user_timezone = "UTC"  # Default timezone, updated from context
        self.calendar_service = google_calendar.GoogleCalendarService(user_id=self.user_id)
        # System instruction to restrict chatbot to health-related topics only
        system_instruction = """
        You are Bio-Twin, a specialized health assistant. Your primary purpose is to help with health, wellness, medical, and fitness-related questions.
        
        STRICT RULES:
        1. You ARE allowed to respond to greetings (e.g., "Hello", "Hi", "Hey there") and basic social pleasantries (e.g., "How are you?", "Nice to meet you"). Be friendly and then pivot to health if appropriate.
        2. For knowledge-based questions, ONLY answer if they are related to: health, medicine, fitness, nutrition, mental wellness, biomarkers, symptoms, treatments, appointments, supplements, exercise, sleep, stress management, and general wellbeing.
        3. If a user asks a factual or advisory question about ANY topic outside of health (e.g., weather, sports, politics, entertainment, coding, etc.), politely decline and redirect them to health topics.
        4. Your response to non-health factual/knowledge questions should be: "I'm Bio-Twin, your health assistant. I can only help with health, wellness, and medical questions. Please ask me something related to your health!"
        5. Always maintain a friendly, supportive, and professional tone.
        """
        
        # Initialize Gemini model with tools and system instruction
        # Primary: gemini-3-flash, Fallback: gemini-2.5-flash, Final Backup: gemini-1.5-flash
        self.primary_model_name = 'models/gemini-3-flash-preview'
        self.fallback_model_name = 'models/gemini-2.5-flash'
        self.backup_model_name = 'models/gemini-1.5-flash'
        self.system_instruction = system_instruction
        self.tools_list = [self.book_appointment, self.block_calendar_for_nap, self.order_supplements]
        
        # Try primary model first
        try:
            self.model = genai.GenerativeModel(
                model_name=self.primary_model_name,
                tools=self.tools_list,
                system_instruction=system_instruction
            )
            self.current_model = self.primary_model_name
        except Exception as e:
            print(f"Primary model failed, using fallback: {e}")
            self.model = genai.GenerativeModel(
                model_name=self.fallback_model_name,
                tools=self.tools_list,
                system_instruction=system_instruction
            )
            self.current_model = self.fallback_model_name
            
        self.chat = self.model.start_chat(enable_automatic_function_calling=True)

    def book_appointment(self, reason: str, date: str):
        """Books a medical appointment for a specific reason and date. Date should be in ISO format (YYYY-MM-DDTHH:MM:SS)"""
        print(f"\n[TOOL EXECUTION] Booking appointment for '{reason}' on {date} (timezone: {self.user_timezone})...")
        print(f"[DEBUG] Agent user_id: {self.user_id}")
        print(f"[DEBUG] Calendar service user_id: {self.calendar_service.user_id}")
        print(f"[DEBUG] Calendar has creds: {self.calendar_service.creds is not None}")
        if self.calendar_service.creds:
            print(f"[DEBUG] Creds valid: {self.calendar_service.creds.valid}")
            print(f"[DEBUG] Creds expired: {self.calendar_service.creds.expired}")
        is_auth = self.calendar_service.is_authorized()
        print(f"[DEBUG] is_authorized result: {is_auth}")
        if is_auth:
            result = self.calendar_service.create_event(
                reason, 
                "Medical appointment booked by Bio-Twin", 
                date,
                timezone=self.user_timezone
            )
            # Remove link so agent doesn't spam it in chat
            if isinstance(result, dict) and "link" in result:
                del result["link"]
            return result
        else:
            # Fallback to mock for demo if not signed in
            print("[AGENT] Calendar not authorized. Returning detailed SIMULATION message.")
            return {
                "status": "simulated", 
                "message": "⚠️ [DEMO MODE] Google Calendar is NOT connected. I have verified the intent but CANNOT actually book this yet. Please connect your calendar in the dashboard.", 
                "details": f"Intended: {reason} on {date}"
            }

    def block_calendar_for_nap(self, duration_mins: int):
        """Blocks the user's calendar for a nap or rest period."""
        print(f"\n[TOOL EXECUTION] Blocking calendar for {duration_mins} mins nap (timezone: {self.user_timezone}).")
        if self.calendar_service.is_authorized():
            # Set timezone on calendar service before blocking
            self.calendar_service.current_user_timezone = self.user_timezone
            result = self.calendar_service.block_time("Rest/Nap Period", duration_mins)
            # Remove link so agent doesn't spam it in chat
            if isinstance(result, dict) and "link" in result:
                del result["link"]
            return result
        else:
            return {"status": "simulated", "message": "Google Calendar not connected. Simulated block success.", "duration": duration_mins}

    def order_supplements(self, item_name: str):
        """Orders health supplements."""
        print(f"\n[TOOL EXECUTION] Ordering supplement: {item_name}...")
        # Mock E-commerce API (remains mock as per plan)
        return {"status": "ordered", "item": item_name, "eta": "2 days"}

    def run(self, health_context: dict):
        """
        Runs the agent loop based on provided health context/data.
        """
        print("Agent thinking...")
        
        # Construct a prompt based on the context
        prompt = f"""
        You are Bio-Twin, an active health agent.
        Analyze the following health data:
        {health_context}
        
        If you detect any issues (like Low Vitamin D, High Stress, etc.), 
        you MUST use your available tools to take action immediately.
        
        For example:
        - If Vitamin D is low, book an appointment or suggest sunlight (block calendar).
        - If tired, block calendar for nap.
        
        Do not just give advice; ACT using the tools.
        """
        
        response = self.chat.send_message(prompt)
        return response.text

    def reply(self, user_message: str, context: dict = None):
        """
        Direct chat with the user, optionally context-aware.
        Enforces health-only topic restriction.
        Automatically falls back through multiple models on quota errors.
        """
        # Style instruction with health-only enforcement
        style_instruction = """
        
IMPORTANT: 
1. Reply in a friendly, short, and pointwise way.
2. Respond naturally to greetings or "How are you?".
3. If a question is clearly about a non-health topic (e.g., coding, sports, history), politely decline with: "I'm Bio-Twin, your health assistant. I can only help with health, wellness, and medical questions. Please ask me something related to your health!"
        """
        
        final_message = user_message + style_instruction
        if context:
            # Extract timezone from context if available
            if isinstance(context, dict):
                if "timezone" in context:
                    self.user_timezone = context["timezone"]
                    print(f"[TIMEZONE] Using timezone from context: {self.user_timezone}")
                
                # Extract current datetime for accurate scheduling
                current_datetime = context.get("currentDateTime", "")
                if current_datetime:
                    print(f"[DATETIME] Current time in user's timezone: {current_datetime}")
                    # Inject current datetime into the context for the AI
                    datetime_info = f"\n\nCURRENT DATE/TIME INFO:\n- Current time: {current_datetime}\n- Timezone: {self.user_timezone}\nUse this as reference when scheduling appointments. 'Tomorrow' means the day after this date.\n"
                    final_message = f"CONTEXT START\n{context}{datetime_info}\nCONTEXT END\n\nUser Question: {user_message}{style_instruction}"
                else:
                    final_message = f"CONTEXT START\n{context}\nCONTEXT END\n\nUser Question: {user_message}{style_instruction}"
            else:
                final_message = f"CONTEXT START\n{context}\nCONTEXT END\n\nUser Question: {user_message}{style_instruction}"
        
        try:
            response = self.chat.send_message(final_message)
            return response.text
        except Exception as e:
            # Check if it's a quota/rate limit error (429)
            if "429" in str(e) or "quota" in str(e).lower() or "ResourceExhausted" in str(e):
                print(f"[FALLBACK] Primary model quota exhausted. Switching to {self.fallback_model_name}...")
                
                # Switch to fallback model
                try:
                    self.model = genai.GenerativeModel(
                        model_name=self.fallback_model_name,
                        tools=self.tools_list,
                        system_instruction=self.system_instruction
                    )
                    self.current_model = self.fallback_model_name
                    self.chat = self.model.start_chat(enable_automatic_function_calling=True)
                    
                    # Retry with fallback
                    response = self.chat.send_message(final_message)
                    return response.text
                except Exception as e2:
                    # Check if fallback also hit rate limit
                    if "429" in str(e2) or "quota" in str(e2).lower() or "ResourceExhausted" in str(e2):
                        print(f"[FINAL BACKUP] Fallback model also exhausted. Switching to {self.backup_model_name}...")
                        
                        # Switch to backup model (gemini-1.5-flash)
                        self.model = genai.GenerativeModel(
                            model_name=self.backup_model_name,
                            tools=self.tools_list,
                            system_instruction=self.system_instruction
                        )
                        self.current_model = self.backup_model_name
                        self.chat = self.model.start_chat(enable_automatic_function_calling=True)
                        
                        # Retry with backup
                        response = self.chat.send_message(final_message)
                        return response.text
                    else:
                        # Re-raise non-quota errors from fallback
                        raise e2
            else:
                # Re-raise non-quota errors
                raise e

if __name__ == "__main__":
    # Test Scenario
    agent = GeminiAgent()
    
    # Simulate data from Scanner
    dummy_health_data = {
        "biomarkers": [
            {"name": "Vitamin D", "value": "15", "unit": "ng/mL", "status": "Low"},
            {"name": "Cortisol", "value": "High", "unit": "µg/dL", "status": "High"}
        ]
    }
    
    print(f"Input Data: {dummy_health_data}")
    result = agent.run(dummy_health_data)
    print("\nAgent Response:")
    print(result)
