import streamlit as st
import pandas as pd
from datetime import datetime, timedelta
from pymongo import MongoClient
import plotly.express as px
import plotly.graph_objects as go
import calendar
from fpdf import FPDF
import base64
import time

# ======================================
# PAGE CONFIG & SESSION SETUP
# ======================================
st.set_page_config(
    page_title="Clinical Mood System",
    layout="wide",
    page_icon="🧠",
    initial_sidebar_state="expanded"
)

# Custom Styling (Glassmorphism & Clean Modern Look)
st.markdown("""
    <style>
        .stApp { background-color: #F8FAFC; font-family: 'Inter', sans-serif; }
        .stSidebar { background-color: #FFFFFF; border-right: 1px solid #E2E8F0; }
        /* Beautiful Buttons */
        div.stButton > button {
            width: 100%; border-radius: 8px; font-weight: 600; padding: 0.6rem;
            transition: all 0.3s; background: #2563EB; color: white; border: none; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
        }
        div.stButton > button:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(37, 99, 235, 0.3); background: #1D4ED8; color: white; }
        /* Cards */
        .glass-card {
            background: white; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); margin-bottom: 20px;
        }
        .metric-value { font-size: 2.5rem; font-weight: 700; color: #0F172A; margin: 0; line-height: 1; }
        .metric-label { font-size: 0.9rem; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        /* Headers */
        h1, h2, h3 { color: #0F172A; }
    </style>
""", unsafe_allow_html=True)

# Session state initialization
if "logged_in" not in st.session_state:
    st.session_state.logged_in = False
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

# ======================================
# MONGODB CONNECTION
# ======================================
client = MongoClient("mongodb://localhost:27017/")
db = client["clinical_mood"]
users_col = db["users"]
history_col = db["history"]

# ======================================
# AUTHENTICATION
# ======================================
def show_auth_page():
    st.markdown("<h1 style='text-align:center; color:#1e40af; margin-bottom:0.5rem;'>🧠 Clinical Mood Monitor</h1>", unsafe_allow_html=True)
    st.markdown("<p style='text-align:center; color:#64748B; margin-bottom:3rem;'>AI-Powered Patient Analytics & Support</p>", unsafe_allow_html=True)

    col1, col2, col3 = st.columns([1, 1.5, 1])
    with col2:
        tab1, tab2 = st.tabs(["🔒 Sign In", "📝 Register"])
        with tab1:
            st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
            username = st.text_input("Username", key="login_user")
            password = st.text_input("Password", type="password", key="login_pass")
            if st.button("Access Dashboard"):
                user = users_col.find_one({"_id": username})
                if user and user.get("password") == password:
                    st.session_state.logged_in = True
                    st.session_state.current_user = username
                    st.rerun()
                else:
                    st.error("Invalid credentials.")
            st.markdown("</div>", unsafe_allow_html=True)
        with tab2:
            st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
            new_user = st.text_input("Choose Username")
            new_pass = st.text_input("Choose Password", type="password")
            pat_name = st.text_input("Patient Full Name")
            pat_age = st.number_input("Age", 1, 120, 30)
            doc_name = st.text_input("Primary Doctor's Name")
            if st.button("Create Account"):
                if not new_user:
                    st.warning("Username is required")
                else:
                    profile = {
                        "patient_name": pat_name, "patient_age": pat_age, "doctor_name": doc_name,
                        "specialization": "", "hospital": "", "doctor_phone": "", "doctor_email": "",
                        "emergency_name": "", "relationship": "", "emergency_phone": ""
                    }
                    try:
                        users_col.insert_one({"_id": new_user, "password": new_pass, "profile": profile})
                        st.success("Registration successful! Please sign in.")
                    except:
                        st.error("Username already taken.")
            st.markdown("</div>", unsafe_allow_html=True)

if not st.session_state.logged_in:
    show_auth_page()
    st.stop()

# ======================================
# SIDEBAR NAVIGATION
# ======================================
with st.sidebar:
    # Profile Summary
    profile_data = users_col.find_one({"_id": st.session_state.current_user})["profile"]
    st.markdown(f"""
        <div style='text-align:center; margin-bottom:2rem;'>
            <div style='width:80px;height:80px;border-radius:40px;background:#2563EB;color:white;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:bold;margin:0 auto 10px auto;'>
                {profile_data.get('patient_name', 'U')[:2].upper()}
            </div>
            <h3 style='margin:0;font-size:1.1rem;'>{profile_data.get('patient_name')}</h3>
            <p style='color:#64748B;margin:0;font-size:0.9rem;'>Patient Dashboard</p>
        </div>
    """, unsafe_allow_html=True)

    menu = st.radio("Navigation", ["📊 Dashboard", "📅 Mood Calendar", "🤖 AI Chatbot", "📄 Reports & Exports", "👤 Profile", "🚪 Logout"])

    if menu == "🚪 Logout":
        st.session_state.clear()
        st.rerun()

# ======================================
# MODEL SETUP
# ======================================
@st.cache_resource
def load_emotion_model():
    from transformers import pipeline
    return pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", top_k=None)

try:
    with st.spinner("Initializing Clinical AI Engine..."):
        emotion_model = load_emotion_model()
except Exception as e:
    st.error(f"Error loading AI model: {e}")
    st.stop()

weights = {"sadness": 0.9, "fear": 0.85, "anger": 0.7, "joy": 0.1, "love": 0.1, "surprise": 0.3}

def calculate_distress(text):
    result = emotion_model(text)[0]
    scores = {r["label"]: r["score"] for r in result}
    score = sum(scores.get(e, 0) * w for e, w in weights.items())
    return min(round(score, 2), 1.0), scores

def get_advice(score):
    if score > 0.7: return "High distress detected. I strongly recommend reaching out to a loved one or your medical provider."
    elif score > 0.4: return "Moderate stress. Consider a mindfulness exercise or stepping away for a short break."
    return "Stable emotional state recorded. Keep up your positive routines!"

def get_color(score):
    if score > 0.7: return "#EF4444"
    if score > 0.4: return "#F59E0B"
    return "#10B981"

# Load current user entries
entries = list(history_col.find({"username": st.session_state.current_user}))
entries.sort(key=lambda x: x["time"])
df_history = pd.DataFrame(entries) if entries else pd.DataFrame()

# ======================================
# ROUTING CONTROLLER
# ======================================

if menu == "📊 Dashboard":
    st.title("Patient Dashboard")
    
    total = len(entries)
    high_risk = len([x for x in entries if x.get("score", 0) > 0.7])
    avg_score = round(df_history["score"].mean(), 2) if not df_history.empty else 0

    col1, col2, col3 = st.columns(3)
    col1.markdown(f"<div class='glass-card' style='border-top:4px solid #3B82F6;'><div class='metric-label'>Total Entries</div><div class='metric-value'>{total}</div></div>", unsafe_allow_html=True)
    col2.markdown(f"<div class='glass-card' style='border-top:4px solid #EF4444;'><div class='metric-label'>High Risk Logs</div><div class='metric-value'>{high_risk}</div></div>", unsafe_allow_html=True)
    col3.markdown(f"<div class='glass-card' style='border-top:4px solid #10B981;'><div class='metric-label'>Avg Distress</div><div class='metric-value'>{avg_score}</div></div>", unsafe_allow_html=True)

    st.markdown("### 📝 New Journal Entry")
    with st.container(border=True):
        journal_text = st.text_area("How are you feeling right now? (Your entry will be securely analyzed by our AI)", height=150)
        if st.button("Analyze & Save Entry"):
            if journal_text.strip():
                score, breakdown = calculate_distress(journal_text)
                advice = get_advice(score)
                status = "High Risk" if score > 0.7 else "Moderate" if score > 0.4 else "Stable"
                
                # Save
                history_col.insert_one({
                    "username": st.session_state.current_user,
                    "time": datetime.now(),
                    "entry": journal_text,
                    "score": score,
                    "status": status,
                    "ai_advice": advice
                })
                
                st.success("Entry analyzed effectively!")
                # Show Result
                c_color = get_color(score)
                st.markdown(f"""
                <div style='background: {c_color}15; border-left: 5px solid {c_color}; padding: 1rem; border-radius: 8px; margin-top: 1rem;'>
                    <h4>Distress Score: <span style='color:{c_color}'>{score} / 1.0</span></h4>
                    <p><strong>AI Advice:</strong> {advice}</p>
                </div>
                """, unsafe_allow_html=True)
                time.sleep(2)
                st.rerun()

    if not df_history.empty:
        st.markdown("### 📈 Recent Progress")
        fig = px.area(df_history.tail(14), x="time", y="score", title="Last 14 Entries Trend",
                      color_discrete_sequence=["#3B82F6"], markers=True)
        fig.update_layout(plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)", margin=dict(l=0, r=0, t=40, b=0))
        st.plotly_chart(fig, use_container_width=True)

elif menu == "📅 Mood Calendar":
    st.title("Mood Calendar Heatmap")
    st.markdown("Visualize your distress patterns over time to identify emotional trends or specific triggers.")
    
    if not df_history.empty:
        df_history['date'] = pd.to_datetime(df_history['time']).dt.date
        # Average score per day
        daily_scores = df_history.groupby('date')['score'].mean().reset_index()
        
        # Prepare calendar grid
        start_date = daily_scores['date'].min()
        end_date = datetime.now().date()
        date_range = pd.date_range(start_date, end_date)
        cal_df = pd.DataFrame({'date': date_range})
        cal_df['date'] = cal_df['date'].dt.date
        cal_df = cal_df.merge(daily_scores, on='date', how='left')
        cal_df['score'].fillna(-0.1, inplace=True) # -0.1 for empty days (white)
        
        cal_df['week'] = pd.to_datetime(cal_df['date']).dt.isocalendar().week
        cal_df['day_of_week'] = pd.to_datetime(cal_df['date']).dt.day_name()
        
        # Plotly categorical heatmap
        days_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        pivot = cal_df.pivot(index='day_of_week', columns='week', values='score').reindex(days_order)
        
        custom_colorscale = [
            [0.0, '#FFFFFF'],   # No data
            [0.1, '#D1FAE5'],   # Stable (0 - 0.4)
            [0.4, '#FDE68A'],   # Moderate (0.4 - 0.7)
            [0.7, '#FCA5A5'],   # High Risk (0.7+)
            [1.0, '#991B1B']    # Max Risk
        ]
        
        fig = px.imshow(
            pivot, 
            labels=dict(x="Week of Year", y="Day", color="Distress Score"),
            color_continuous_scale="RdYlGn_r",
            aspect="auto",
            title="Daily Average Mental Distress (Green = Stable, Red = High Risk)"
        )
        # Update styling to remove grid lines and axis ticks for cleaner look
        fig.update_xaxes(showgrid=False, zeroline=False, visible=False)
        fig.update_yaxes(showgrid=False, zeroline=False)
        fig.update_layout(plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)")
        
        st.plotly_chart(fig, use_container_width=True)
        
        st.markdown("### Daily Breakdown")
        st.dataframe(daily_scores.sort_values(by="date", ascending=False).style.background_gradient(cmap="RdYlGn_r", subset=["score"]))
    else:
        st.info("No logs available yet to construct the calendar.")

elif menu == "🤖 AI Chatbot":
    st.title("Clinical AI Assistant")
    st.markdown("Feel free to chat securely. I analyze your messages for underlying emotional distress to provide tailored support.")
    
    # Render Chat History
    for msg in st.session_state.chat_history:
        with st.chat_message(msg["role"], avatar="🧠" if msg["role"] == "assistant" else "👤"):
            st.write(msg["content"])
            if msg.get("score") is not None:
                c = get_color(msg["score"])
                mood_fmt = f" | Primary Emotion: <b>{msg.get('primary_emotion', 'N/A').capitalize()}</b>" if msg.get("primary_emotion") else ""
                st.markdown(f"<div style='font-size:0.8rem; color:#475569; margin-top:5px; padding:4px 8px; border-radius:6px; max-width:fit-content; border: 1px solid {c}; background-color:{c}15'>Distress: {msg['score']:.2f}{mood_fmt}</div>", unsafe_allow_html=True)
    
    # Input
    if prompt := st.chat_input("How can I support you today?"):
        # Add User msg
        score, breakdown = calculate_distress(prompt)
        primary_emotion = max(breakdown, key=breakdown.get) if breakdown else "neutral"
        st.session_state.chat_history.append({"role": "user", "content": prompt, "score": score, "primary_emotion": primary_emotion})
        
        with st.chat_message("user", avatar="👤"):
            st.write(prompt)
            c = get_color(score)
            st.markdown(f"<div style='font-size:0.8rem; color:#475569; margin-top:5px; padding:4px 8px; border-radius:6px; max-width:fit-content; border: 1px solid {c}; background-color:{c}15'>Distress: {score:.2f} | Primary Emotion: <b>{primary_emotion.capitalize()}</b></div>", unsafe_allow_html=True)
            
        # Add Assistant Response
        with st.chat_message("assistant", avatar="🧠"):
            if score > 0.7:
                base_reply = f"I'm hearing a lot of {primary_emotion} and distress in what you're saying. This sounds really challenging. Please remember that you don't have to face this alone. Have you considered contacting your doctor or a trusted friend? I am here to listen if you want to keep sharing."
            elif score > 0.4:
                if primary_emotion in ["anger", "fear"]:
                    base_reply = f"It sounds like you're experiencing some {primary_emotion} right now. Take a deep breath. Try stepping away for a few minutes to clear your head. Does writing this out help at all?"
                else:
                    base_reply = f"I'm sensing some moderate stress. It is completely valid to feel {primary_emotion}. Consider a short mindfulness exercise or a small stretch to help ground yourself."
            else:
                if primary_emotion in ["joy", "love"]:
                    base_reply = "I'm so glad to hear you're feeling positive! Maintaining good habits like acknowledging your joy can really help keep this momentum going."
                else:
                    base_reply = "You seem to be in a relatively stable state right now. Journaling your thoughts regularly is a great way to maintain this balance!"
            
            def stream_data(text):
                for word in text.split(" "):
                    yield word + " "
                    time.sleep(0.04)
            
            st.write_stream(stream_data(base_reply))
                
        st.session_state.chat_history.append({"role": "assistant", "content": base_reply})
        # Optional: Save chat interactions to database if desired.

elif menu == "📄 Reports & Exports":
    st.title("Clinical Reports")
    st.markdown("Generate compliant PDF and CSV logs to share with your healthcare provider.")
    
    if df_history.empty:
        st.warning("No journal entries available to export.")
    else:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        colA, colB = st.columns(2)
        
        # CSV EXPORT
        with colA:
            st.subheader("Raw Data (CSV)")
            st.write("Export your complete timeline format for deep analysis.")
            csv = df_history.drop(columns=["_id"], errors="ignore").to_csv(index=False).encode('utf-8')
            st.download_button(
                label="📥 Download CSV",
                data=csv,
                file_name=f"mood_logs_{st.session_state.current_user}.csv",
                mime="text/csv",
                use_container_width=True
            )
            
        # PDF EXPORT
        with colB:
            st.subheader("Clinical Summary (PDF)")
            st.write("A formatted report containing your patient details and recent entries.")
            
            # Generate PDF Function
            def generate_pdf(entries, profile):
                pdf = FPDF()
                pdf.add_page()
                pdf.set_font("Arial", 'B', 16)
                pdf.cell(0, 10, "Clinical Mood Monitoring Report", ln=True, align="C")
                pdf.ln(5)
                
                pdf.set_font("Arial", 'B', 12)
                pdf.cell(0, 10, f"Patient: {profile.get('patient_name', 'Unknown')}", ln=True)
                pdf.set_font("Arial", '', 10)
                pdf.cell(0, 8, f"Report Date: {datetime.now().strftime('%Y-%m-%d')}", ln=True)
                pdf.cell(0, 8, f"Doctor: {profile.get('doctor_name', 'N/A')}", ln=True)
                pdf.ln(10)
                
                pdf.set_font("Arial", 'B', 12)
                pdf.cell(0, 10, "Recent Journal Entries & Distress Scores", ln=True)
                pdf.line(10, pdf.get_y(), 200, pdf.get_y())
                pdf.ln(5)
                
                for x in entries[-20:]: # Last 20 entries
                    pdf.set_font("Arial", 'B', 10)
                    dt = x["time"].strftime("%Y-%m-%d %H:%M")
                    pdf.cell(0, 8, f"Date: {dt} | Score: {x['score']} | Status: {x['status']}", ln=True)
                    pdf.set_font("Arial", '', 10)
                    pdf.multi_cell(0, 6, f"Log: {x['entry']}")
                    pdf.set_font("Arial", 'I', 9)
                    pdf.multi_cell(0, 6, f"AI Note: {x['ai_advice']}")
                    pdf.ln(5)
                
                return bytes(pdf.output())
            
            pdf_bytes = generate_pdf(entries, profile_data)
            st.download_button(
                label="🖨️ Download PDF",
                data=pdf_bytes,
                file_name=f"clinical_report_{st.session_state.current_user}.pdf",
                mime="application/pdf",
                use_container_width=True
            )
        st.markdown("</div>", unsafe_allow_html=True)

        st.markdown("### Preview Log Data")
        st.dataframe(df_history[["time", "score", "status", "entry"]].tail(10))

elif menu == "👤 Profile":
    st.title("Patient Profile")
    st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
    c1, c2 = st.columns(2)
    with c1:
        st.markdown("### 👤 Demographics")
        st.write(f"**Name:** {profile_data.get('patient_name')}")
        st.write(f"**Age:** {profile_data.get('patient_age')} years old")
    with c2:
        st.markdown("### 🏥 Primary Care Provider")
        st.write(f"**Physician:** {profile_data.get('doctor_name', 'N/A')}")
        st.write(f"**Specialization:** {profile_data.get('specialization', 'N/A')}")
        st.write(f"**Hospital:** {profile_data.get('hospital', 'N/A')}")
        st.write(f"**Phone:** {profile_data.get('doctor_phone', 'N/A')}")
        st.write(f"**Email:** {profile_data.get('doctor_email', 'N/A')}")
    st.divider()
    st.markdown("### 🚨 Emergency Contact")
    st.write(f"**Name:** {profile_data.get('emergency_name', 'N/A')} ({profile_data.get('relationship', 'N/A')})")
    st.write(f"**Phone:** {profile_data.get('emergency_phone', 'N/A')}")
    st.markdown("</div>", unsafe_allow_html=True)