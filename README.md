# Procruit — Recruitment Platform

An integrated technical recruitment platform for Candidates, Recruiters, and Freelance Interviewers. Procruit features advanced AI-powered CV parsing, candidate ranking, and a robust AI Proctoring microservice to ensure interview integrity.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, TailwindCSS |
| **Backend** | Node.js, Express 5, MongoDB Atlas |
| **AI Service** | Python, FastAPI, spaCy, SentenceTransformers, pdfplumber, scikit-learn |
| **Proctoring Service** | Python, FastAPI, WebSockets, OpenCV, MediaPipe, NumPy |

## Prerequisites

- **Node.js**: v18+
- **Python**: 3.10+
- **npm**: (ships with Node.js)

## Local Setup Instructions

### 1. Install Root & Frontend Dependencies

```bash
npm install
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

### 3. Set Up the AI Service (Python & Ollama)

The AI Evaluation service uses an LLM. You must install **Ollama** locally to run the model.
1. Download and install Ollama from [ollama.com](https://ollama.com)
2. Pull the required model: `ollama pull llama3` (or `phi3` if your RAM is limited to 8GB)
3. Ensure the Ollama server is running (usually automatic on startup).

Create and activate a virtual environment, then install the Python dependencies:

```bash
cd ai-service
python -m venv venv

# Windows
.\venv\Scripts\pip install -r requirements.txt
.\venv\Scripts\python -m spacy download en_core_web_sm

# macOS/Linux
# source venv/bin/activate
# pip install -r requirements.txt
# python -m spacy download en_core_web_sm

cd ..
```

### 4. Set Up the Proctoring Service (Python)

Create and activate a virtual environment, then install the dependencies for real-time video/audio proctoring:

```bash
cd proctoring-service
python -m venv venv

# Windows
.\venv\Scripts\pip install -r requirements.txt

# macOS/Linux
# source venv/bin/activate
# pip install -r requirements.txt

cd ..
```

Note: Ensure the required MediaPipe model file (face_landmarker.task) is present in the root of the proctoring-service directory before running the application.

## Required Environment Variables

You need to set up environment variables for the application to function correctly. 

1. **Backend (`server/.env`)**
Create a `.env` file inside the `server/` directory:
```env
PORT=5001
MONGO_URI=mongodb://<username>:<password>@<cluster-url>/procruit?...
STRIPE_SECRET_KEY=sk_test_...
```

2. **Frontend (`.env.local`)**
Create a `.env.local` file inside the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key
```

## Running the Application

From the project root, you can start all five services simultaneously with a single command:

```bash
npm run dev
```

This concurrently launches the following services (color-coded in terminal):

| Service | Address / Port | Color | Description |
|---|---|---|---|
| **Frontend (Vite)** | `http://localhost:3000` | Cyan | Main React application |
| **Backend (Express)** | `http://localhost:5001` | Green | Core REST API and Socket.io server |
| **AI Service (FastAPI)** | `http://localhost:8000` | Magenta | CV parsing, candidate ranking, and AI interview evaluation (Ollama) |
| **Proctoring Service (FastAPI)** | `http://localhost:8001` | Yellow | WebSocket server for real-time video/gaze proctoring |
| **Ollama** | `http://localhost:11434` | Blue | Local LLM server (auto-starts, graceful skip if not installed) |

## Project Structure

```
procruit/
├── ai-service/          Python FastAPI microservice (CV Parsing & AI)
│   ├── main.py
│   ├── requirements.txt
│   └── venv/
├── proctoring-service/  Python FastAPI microservice (AI Proctoring & WebSockets)
│   ├── main.py
│   ├── requirements.txt
│   └── venv/
├── components/          React UI components
├── pages/               React page components
├── server/              Node.js/Express backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── index.js
├── utils/               Shared frontend utilities
├── App.tsx              React app entry
├── vite.config.ts       Vite configuration (contains proxy settings for API/WS)
└── package.json         Root scripts (concurrent dev) & frontend deps
```
## Contact Details
For any help or queries, You can contact us:
usmannaeem350@gmail.com
ahmedafzal25@gmail.com
