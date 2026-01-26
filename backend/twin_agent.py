import os
import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool
try:
    from app_secrets import GEMINI_API_KEY
except ImportError:
    GEMINI_API_KEY = None
import datetime
import google_calendar

# Prioritize environment variable (for Render), fallback to local file
api_key = os.getenv("GEMINI_API_KEY") or GEMINI_API_KEY

if not api_key:
    print("WARNING: GEMINI_API_KEY not found in environment or app_secrets.py")

if api_key:
    genai.configure(api_key=api_key)

def order_supplements(item_name: str):
    """Orders health supplements."""
    print(f"\n[TOOL EXECUTION] Ordering supplement: {item_name}...")
    # Mock E-commerce API (remains mock as per plan)
    return {"status": "ordered", "item": item_name, "eta": "2 days"}

class GeminiAgent:
    def __init__(self, history=None, user_id=None):
        # System instruction to restrict chatbot to health-related topics only
        self.system_instruction = """
        You are Bio-Twin, an intelligent AI Health Agent designed to analyze health biomarkers, predict trends, and provide actionable wellness advice.
        
        CRITICAL INSTRUCTIONS:
        1. You ARE allowed to respond to greetings (e.g., "Hello", "Hi", "Hey there") and basic social pleasantries (e.g., "How are you?", "Nice to meet you"). Be friendly and then pivot to health if appropriate.
        2. For knowledge-based questions, ONLY answer if they are related to: health, medicine, fitness, nutrition, mental wellness, biomarkers, symptoms, treatments, appointments, supplements, exercise, sleep, stress management, and general wellbeing.
        3. If a user asks a factual or advisory question about ANY topic outside of health (e.g., weather, sports, politics, entertainment, coding, etc.), politely decline and redirect them to health topics.
        4. Your response to non-health factual/knowledge questions should be: "I'm Bio-Twin, your health assistant. I can only help with health, wellness, and medical questions. Please ask me something related to your health!"
        5. Always maintain a friendly, supportive, and professional tone.
        """
        
        self.user_id = user_id
        # Initialize User-Specific Calendar Service
        self.calendar_service = google_calendar.GoogleCalendarService(user_id=self.user_id)
        
        # Define Instance-Level Tools (bound to this user's calendar)
        self.tools_list = [self.book_appointment, self.block_calendar_for_nap, order_supplements]

        # Initialize Gemini model with tools and system instruction
        # Primary: gemini-2.0-flash, Fallback: gemini-1.5-flash
        self.primary_model_name = 'models/gemini-2.0-flash'
        self.fallback_model_name = 'models/gemini-1.5-flash'
        
        self._init_model(self.primary_model_name, history or [])

    def _init_model(self, model_name, history):
        try:
            self.model = genai.GenerativeModel(
                model_name=model_name,
                tools=self.tools_list,
                system_instruction=self.system_instruction
            )
            self.current_model = model_name
            self.chat = self.model.start_chat(history=history, enable_automatic_function_calling=True)
        except Exception as e:
            print(f"Error initializing model {model_name}: {e}")
            if model_name == self.primary_model_name:
                print(f"Falling back to {self.fallback_model_name}")
                self._init_model(self.fallback_model_name, history)

    def book_appointment(self, reason: str, date: str):
        """Books a medical appointment for a specific reason and date. Date should be in ISO format (YYYY-MM-DDTHH:MM:SS)"""
        print(f"\n[TOOL EXECUTION] Booking appointment for '{reason}' on {date}...")
        if self.calendar_service.is_authorized():
            result = self.calendar_service.create_event(reason, "Medical appointment booked by Bio-Twin", date)
            if isinstance(result, dict) and "link" in result:
                del result["link"]
            return result
        else:
            return {"status": "simulated", "message": "Google Calendar not connected. Simulated booking success.", "details": f"{reason} on {date}"}

    def block_calendar_for_nap(self, duration_mins: int):
        """Blocks the user's calendar for a nap or rest period."""
        print(f"\n[TOOL EXECUTION] Blocking calendar for {duration_mins} mins nap.")
        if self.calendar_service.is_authorized():
            result = self.calendar_service.block_time("Rest/Nap Period", duration_mins)
            if isinstance(result, dict) and "link" in result:
                del result["link"]
            return result
        else:
            return {"status": "simulated", "message": "Google Calendar not connected. Simulated block success.", "duration": duration_mins}

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
        final_message = user_message
        if context:
            final_message = f"Context: {context}\n\nUser Message: {user_message}"
            
        try:
            response = self.chat.send_message(final_message)
            return response.text
        except Exception as e:
            # Check if it's a quota/rate limit error (429) or persistent error
            if "429" in str(e) or "quota" in str(e).lower() or "ResourceExhausted" in str(e):
                print(f"[FALLBACK] Primary model quota exhausted. Switching to {self.fallback_model_name}...")
                
                # Switch to fallback model
                try:
                    self._init_model(self.fallback_model_name, self.chat.history)
                    
                    # Retry with fallback
                    response = self.chat.send_message(final_message)
                    return response.text
                except Exception as e2:
                    # Check if fallback also hit rate limit
                    if "429" in str(e2) or "quota" in str(e2).lower():
                        return "I'm currently overloaded with requests. Please try again in a few minutes."
                    else:
                        raise e2
            else:
                # Re-raise non-quota errors
                raise e

if __name__ == "__main__":
    # Test Scenario
    agent = GeminiAgent(user_id="test_user")
    
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
