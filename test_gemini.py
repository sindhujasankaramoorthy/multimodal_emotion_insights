import os
import google.generativeai as genai
from dotenv import load_dotenv

print("--- Testing Environment Loading ---")
load_dotenv()
key = os.getenv("GEMINI_API_KEY")
if not key:
    print("ERROR: GEMINI_API_KEY not found in environment.")
else:
    print(f"SUCCESS: GEMINI_API_KEY found (Length: {len(key)})")
    print(f"Starts with: {key[:5]}...")

print("\n--- Testing Gemini API Connection ---")
try:
    genai.configure(api_key=key)
    model = genai.GenerativeModel('gemini-2.0-flash')
    response = model.generate_content("Say hello in one word.")
    print(f"SUCCESS: Gemini responded: {response.text.strip()}")
except Exception as e:
    print(f"ERROR: Gemini API call failed: {e}")
