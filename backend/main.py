from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from pymongo import MongoClient
from datetime import datetime
from transformers import pipeline
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI(title="Clinical Mood Monitor API")

# Enable CORS for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================================
# MONGODB CONNECTION
# ======================================
client = MongoClient("mongodb://localhost:27017/")
db = client["clinical_mood"]
users_col = db["users"]
history_col = db["history"]
doctors_col = db["doctors"]

# ======================================
# ML MODEL SETUP (Lazy Loaded)
# ======================================
_emotion_model = None
weights = {"sadness": 0.9, "fear": 0.85, "anger": 0.7, "joy": 0.1, "love": 0.1, "surprise": 0.3}

def get_model():
    global _emotion_model
    if _emotion_model is None:
        print("Loading emotion model, this might take a moment...")
        _emotion_model = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", top_k=None)
    return _emotion_model

def calculate_distress(text):
    model = get_model()
    result = model(text)[0]
    scores = {r["label"]: r["score"] for r in result}
    score = sum(scores.get(e, 0) * w for e, w in weights.items())
    return round(score, 2), scores

def generate_advice(score):
    if score > 0.7:
        return "High distress 😢 — consider talking to someone you trust."
    elif score > 0.4:
        return "Moderate stress 😐 — take a short break or stretch."
    return "Good state 😊 — keep nurturing positive habits."

def extract_triggers(text: str) -> List[str]:
    try:
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        prompt = f"""
        Analyze the following patient journal entry for potential mental health 'triggers' (causes of distress).
        Extract 1-3 short keywords or phrases representing these triggers.
        If no clear triggers are found, return an empty list.
        Format your response as a comma-separated list.
        Entry: "{text}"
        """
        response = model.generate_content(prompt)
        triggers = [t.strip().title() for t in response.text.split(",") if t.strip()]
        return triggers[:3]
    except Exception as e:
        print(f"Trigger extraction failed: {e}")
        return []

def get_ai_reply(message: str, score: float, emotion: str) -> str:
    try:
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        
        # System instructions wrapped in the prompt
        prompt = f"""
        You are 'CareBot', a warm, empathetic, and interactive companion for a mental health support app.
        
        CORE GUIDELINES:
        1. Never call the user a 'patient'. Be a friend/companion.
        2. Answer questions naturally (e.g., about diet, hobbies, or general health).
        3. Do NOT lead with clinical assessments like "Your mood is stable."
        4. If the user asks for guidance (like a diet plan), provide helpful, general tips but always encourage consulting a professional for specific medical needs.
        5. Your tone should match the user's mood:
           - User is Distressed (Score: {score}, Emotion: {emotion}): Be extremely gentle, validating, and calming.
           - User is Stable (Score: {score}, Emotion: {emotion}): Be encouraging, interactive, and friendly.
        
        User Message: "{message}"
        """
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"AI Chat failed: {e}")
        # Fallback to a warm sympathetic message if API fails
        if score > 0.7:
            return "I can hear that you're going through a lot right now. I'm here to listen. You don't have to face this alone—have you thought about talking to someone close to you today?"
        return "I'm here for you. It sounds like you're navigating some thoughts right now. What's on your mind? I'd love to chat more about it."

# ======================================
# MODELS
# ======================================
class UserProfile(BaseModel):
    patient_name: str
    patient_age: int
    doctor_name: str
    specialization: str
    hospital: str
    doctor_phone: str
    doctor_email: str
    emergency_name: str
    relationship: str
    emergency_phone: str

class UserRegister(BaseModel):
    username: str
    password: str
    profile: UserProfile

class UserLogin(BaseModel):
    username: str
    password: str

class DoctorProfile(BaseModel):
    name: str
    specialization: str
    hospital: str
    phone: str

class DoctorRegister(BaseModel):
    username: str
    password: str
    profile: DoctorProfile

class DoctorLogin(BaseModel):
    username: str
    password: str

class JournalEntry(BaseModel):
    username: str
    entry: str
    sleep_hours: Optional[float] = None
    meds_taken: Optional[bool] = None

class ChatMessage(BaseModel):
    message: str

# ======================================
# ENDPOINTS
# ======================================
@app.get("/")
def read_root():
    return {"message": "Clinical Mood API is running", "docs": "/docs"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "time": datetime.now()}

@app.post("/api/register")
@app.post("/api/auth/register")
def register_user(data: UserRegister):
    if users_col.find_one({"_id": data.username}):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    users_col.insert_one({
        "_id": data.username,
        "password": data.password,
        "profile": data.profile.model_dump()
    })
    return {"message": "Account created successfully"}

@app.post("/api/login")
@app.post("/api/auth/login")
def login_user(data: UserLogin):
    user = users_col.find_one({"_id": data.username})
    if user and user["password"] == data.password:
        return {"message": "Login successful", "username": data.username}
    raise HTTPException(status_code=401, detail="Invalid username or password")

@app.get("/api/profile/{username}")
def get_profile(username: str):
    user = users_col.find_one({"_id": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user["profile"]

@app.get("/api/dashboard/{username}")
def get_dashboard(username: str):
    entries = list(history_col.find({"username": username}, {"_id": 0}))
    entries.sort(key=lambda x: x["time"])
    
    total_entries = len(entries)
    if total_entries == 0:
        return {
            "total_entries": 0,
            "high_risk_pct": 0.0,
            "avg_score": 0.0,
            "entries": []
        }
        
    high_risk_count = len([x for x in entries if x["score"] > 0.7])
    avg_score = round(pd.DataFrame(entries)["score"].mean(), 2)
    high_risk_pct = round((high_risk_count / total_entries) * 100, 1)

    # Aggregated Triggers (from high risk entries)
    all_triggers = []
    for e in entries:
        if e.get("triggers"):
            all_triggers.extend(e["triggers"])
    
    unique_triggers = list(set(all_triggers))[:5] # Top 5 unique ones

    return {
        "total_entries": total_entries,
        "high_risk_pct": high_risk_pct,
        "avg_score": avg_score,
        "top_triggers": unique_triggers,
        "entries": entries
    }

@app.post("/api/entries")
def add_entry(data: JournalEntry):
    if not data.entry.strip():
        raise HTTPException(status_code=400, detail="Entry cannot be empty")
        
    score, _ = calculate_distress(data.entry)
    advice = generate_advice(score)
    status = "High Risk" if score > 0.7 else "Moderate" if score > 0.4 else "Stable"
    triggers = extract_triggers(data.entry) if score > 0.4 else []
    
    doc = {
        "username": data.username,
        "time": datetime.now(),
        "entry": data.entry,
        "sleep_hours": data.sleep_hours,
        "meds_taken": data.meds_taken,
        "score": score,
        "status": status,
        "ai_advice": advice,
        "triggers": triggers
    }
    history_col.insert_one(doc)
    doc.pop("_id", None)
    return doc

@app.get("/api/entries/{username}")
def get_entries(username: str):
    entries = list(history_col.find({"username": username}, {"_id": 0}))
    entries.sort(key=lambda x: x["time"])
    return {"entries": entries}

@app.post("/api/auth/doctor/register")
def register_doctor(data: DoctorRegister):
    if doctors_col.find_one({"_id": data.username}):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    doctors_col.insert_one({
        "_id": data.username,
        "password": data.password,
        "profile": data.profile.model_dump()
    })
    return {"message": "Doctor account created successfully"}

@app.post("/api/auth/doctor/login")
def login_doctor(data: DoctorLogin):
    doctor = doctors_col.find_one({"_id": data.username})
    if doctor and doctor["password"] == data.password:
        return {"message": "Login successful", "username": data.username}
    raise HTTPException(status_code=401, detail="Invalid username or password")

@app.get("/api/doctor/patients")
def get_all_patients():
    # Fetch all patients
    patients = list(users_col.find({}))
    result = []
    
    for p in patients:
        username = p["_id"]
        # Fetch their latest entry
        latest_entry = history_col.find_one(
            {"username": username},
            sort=[("time", -1)] # Sort descending
        )
        
        status = "No Entries"
        score = 0.0
        time = None
        
        if latest_entry:
            status = latest_entry.get("status", "Unknown")
            score = latest_entry.get("score", 0.0)
            time = latest_entry.get("time")
            
        result.append({
            "username": username,
            "patient_name": p["profile"].get("patient_name", username),
            "age": p["profile"].get("patient_age", "N/A"),
            "latest_status": status,
            "latest_score": score,
            "latest_time": time
        })
        
    return {"patients": result}

@app.post("/api/chat")
def analyze_chat(data: ChatMessage):
    if not data.message.strip():
        raise HTTPException(status_code=400, detail="Message empty")
    
    # Still calculate metrics in the background for tracking
    score, breakdown = calculate_distress(data.message)
    primary_emotion = max(breakdown, key=breakdown.get) if breakdown else "neutral"
    
    # Get conversational reply from Gemini
    reply = get_ai_reply(data.message, score, primary_emotion)
            
    return {
        "reply": reply,
        "score": score,
        "primary_emotion": primary_emotion
    }

if __name__ == "__main__":
    import uvicorn
    print("\n--- Starting Clinical Mood API ---")
    print("Dashboard: http://localhost:8000/docs")
    try:
        uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
    except Exception as e:
        print(f"FAILED to start server: {e}")
