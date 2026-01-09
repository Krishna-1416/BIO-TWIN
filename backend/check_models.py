import google.generativeai as genai
from app_secrets import GEMINI_API_KEY
import sys

# Redirect stderr to avoid clutter in the file if possible, or just open a file to write to.
genai.configure(api_key=GEMINI_API_KEY)

output_file = "models_list.txt"

print(f"Writing models to {output_file}...")
try:
    with open(output_file, "w") as f:
        f.write("Available Models:\n")
        f.write("=================\n")
        for m in genai.list_models():
            f.write(f"- {m.name}\n")
    print("Done.")
except Exception as e:
    print(f"Error: {e}")
