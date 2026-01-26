import json
import os

def minify_credentials():
    file_path = 'backend/client_secret.json'
    # Fallback path if run from root
    if not os.path.exists(file_path):
        file_path = 'client_secret.json'
        
    if not os.path.exists(file_path):
        print(f"❌ Error: {file_path} not found!")
        print("Please make sure you have your 'client_secret.json' file in the root or backend folder.")
        return

    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        # Convert to minified JSON string
        json_str = json.dumps(data)
        
        print("\n✅ Success! Copy the string below strictly (no extra spaces):")
        print("-" * 50)
        print(json_str)
        print("-" * 50)
        print("\n👉 Add this as a new Environment Variable in Render:")
        print("Key:   GOOGLE_CLIENT_SECRET")
        print("Value: (Paste the string above)")
        
    except Exception as e:
        print(f"❌ Error reading file: {e}")

if __name__ == "__main__":
    minify_credentials()
