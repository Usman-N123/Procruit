# Procruit — Recruitment Platform

A full-stack recruitment platform for Candidates, Recruiters, and Freelance Interviewers featuring AI-powered CV parsing and candidate ranking.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TailwindCSS |
| Backend | Node.js, Express 5, MongoDB Atlas |
| AI Service | Python, FastAPI, spaCy, SentenceTransformers |

## Prerequisites

- **Node.js** v18+
- **Python** 3.10+
- **npm** (ships with Node.js)

## Initial Setup

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

### 3. Set Up the Python AI Service

```bash
cd ai-service
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt
.\venv\Scripts\python -m spacy download en_core_web_sm
cd ..
```

### 4. Environment Variables

Create a `.env` file inside the `server/` directory with the required variables (MongoDB URI, JWT secret, etc.). A template is provided in the repository.

## Running the Project

From the project root, start all three services with a single command:

```bash
npm run dev
```

This launches:

| Service | URL |
|---|---|
| Frontend (Vite) | http://localhost:3000 |
| Backend (Express) | http://localhost:5001 |
| AI Service (FastAPI) | http://localhost:8000 |

## Project Structure

```
procruit/
├── ai-service/          Python FastAPI microservice
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
├── vite.config.ts       Vite configuration
└── package.json         Root scripts & frontend deps
```
