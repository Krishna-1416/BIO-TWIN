import google.generativeai as genai
from app_secrets import GEMINI_API_KEY
import PIL.Image

genai.configure(api_key=GEMINI_API_KEY)

# Use a dummy image (create a small one if needed, or use existing)
# We'll just try text generation first to validate the model name/access.

models_to_test = [
    "models/gemini-2.5-flash-native-audio",
    "models/gemini-2.5-computer-use-preview-10-2025",
    "models/nano-banana-pro-preview"
]

print("Testing model generation capabilities...")

for m_name in models_to_test:
    print(f"\n--- Testing {m_name} ---")
    try:
        model = genai.GenerativeModel(m_name)
        response = model.generate_content("Hello, can you see this?")
        print(f"SUCCESS (Text): {response.text}")
        
        # If text works, maybe we check image support?
        # We need an image.
        try:
             import os
             if os.path.exists("uploads/uploaded_image_1767687038721.png"):
                 img = PIL.Image.open("uploads/uploaded_image_1767687038721.png")
                 print("Attempting image...")
                 resp_vision = model.generate_content(["Describe this image", img])
                 print(f"SUCCESS (Vision): {resp_vision.text}")
             else:
                 print("No dummy image found for vision test.")
        except Exception as e:
            print(f"Vision failed: {e}")

    except Exception as e:
        print(f"FAILED: {e}")
