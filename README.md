# Bio-Twin: Gemini 3-Powered Agentic Health System

**Bio-Twin** is an active Digital Twin that Sees, Remembers, and Acts on health data. It leverages Google's Gemini 3 models for multimodal reasoning and agentic capabilities.

## Architecture

Bio-Twin is not just a dashboard; it is an agentic system composed of:

1.  **Vision Engine (`scanner.py`)**: Uses `gemini-3-pro-vision` to extract biomarkers from medical reports (images/PDFs) into structured JSON.
2.  **Long Context Memory (`memory.py`)**: Ingests entire medical histories (years of records) using Gemini 3's 1M+ token window to find long-term patterns.
3.  **Agentic Core (`twin_agent.py`)**: A reasoning agent that acts on data. For example, if "Low Vitamin D" is detected, it acts by booking appointments or blocking calendar slots for sunlight.
4.  **Frontend (React + Three.js)**: A visual representation of the Digital Twin (3D Sphere) that morphs based on health states (Green=Healthy, Red=Critical, Rough=Dehydrated).

## Tech Stack

*   **Backend**: Python (FastAPI), Google Gemini 3 SDK.
*   **Frontend**: React, Three.js (Fiber).
*   **Database**: JSON/SQLite (Portable for Hackathon).
*   **Integrations**: Google Calendar API (Real), Gmail API (Mock).

## 🔑 Calendar Auth Setup
To use the live Google Calendar integration:
1. Obtain `client_secret.json` from the Google Cloud Console.
2. Place it in the root directory.
3. Click **Connect Calendar** in the user profile menu within the app.

## Setup & Running

1.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Configure Secrets**:
    Rename `secrets_template.py` to `secrets.py` and add your `GEMINI_API_KEY`.

3.  **Run Backend**:
    ```bash
    uvicorn main:app --reload
    ```

4.  **Run Scenarios**:
    *   Run `python twin_agent.py` to test the agentic reasoning loop.
    *   Run `python scanner.py` to test document extraction.

## Directory Structure

*   `scanner.py` - Vision Engine.
*   `twin_agent.py` - Agentic Reasoning Core.
*   `memory.py` - Long Context Memory.
*   `main.py` - FastAPI App.
*   `uploads/` - Directory for medical reports.
