import json
import os

def minify_file(filename, env_var_name):
    # Check both current directory and backend subdir
    paths = [
        filename,
        os.path.join('backend', filename),
        os.path.join('..', filename)
    ]
    
    found_path = None
    for p in paths:
        if os.path.exists(p):
            found_path = p
            break
            
    if not found_path:
        print(f"⚠️  {filename} not found.")
        print(f"   (Cannot generate {env_var_name})")
        return

    try:
        with open(found_path, 'r') as f:
            data = json.load(f)
        
        json_str = json.dumps(data)
        
        print(f"\n✅ {env_var_name} Ready!")
        print(f"   Source: {found_path}")
        print("-" * 50)
        print(json_str)
        print("-" * 50)
        
    except Exception as e:
        print(f"❌ Error reading {filename}: {e}")

def main():
    print("\n🚀 Generating Production Environment Variables...\n")
    
    # 1. Google Calendar
    minify_file('client_secret.json', 'GOOGLE_CLIENT_SECRET')
    
    # 2. Firebase
    minify_file('serviceAccountKey.json', 'FIREBASE_CREDENTIALS')
    
    print("\n👉 INSTRUCTIONS:")
    print("1. Copy the long strings between the lines")
    print("2. Go to Render Dashboard -> Environment")
    print("3. Add the corresponding keys (GOOGLE_CLIENT_SECRET, FIREBASE_CREDENTIALS)")
    print("4. Paste the strings as values")

if __name__ == "__main__":
    main()
