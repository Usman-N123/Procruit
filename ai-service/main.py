"""
Procruit AI Microservice — CV Parsing & NLP Matching
=====================================================
FastAPI server that extracts text from PDF resumes, computes semantic
similarity with a job description using SentenceTransformers, and
extracts keyword overlap using spaCy.

Models are loaded GLOBALLY at startup for sub-30s response times.
PDF files are processed strictly in-memory (no disk writes).
"""

import io
import logging
from typing import List

import pdfplumber
import spacy
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-service")

# ---------------------------------------------------------------------------
# Global Model Loading (at import / startup time)
# ---------------------------------------------------------------------------
logger.info("Loading SentenceTransformer model (all-MiniLM-L6-v2) ...")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
logger.info("SentenceTransformer model loaded.")

logger.info("Loading spaCy model (en_core_web_sm) ...")
nlp = spacy.load("en_core_web_sm")
logger.info("spaCy model loaded.")

# Common filler / non-technical words to exclude from keyword extraction
STOP_LABELS = {"DATE", "TIME", "PERCENT", "MONEY", "QUANTITY", "ORDINAL", "CARDINAL"}

# Curated list of common tech keywords to boost extraction accuracy
TECH_KEYWORDS = {
    "python", "java", "javascript", "typescript", "react", "angular", "vue",
    "node", "nodejs", "express", "django", "flask", "fastapi", "spring",
    "sql", "nosql", "mongodb", "postgresql", "mysql", "redis", "elasticsearch",
    "docker", "kubernetes", "aws", "azure", "gcp", "git", "ci/cd", "cicd",
    "html", "css", "sass", "tailwind", "bootstrap", "figma",
    "graphql", "rest", "api", "microservices", "serverless",
    "tensorflow", "pytorch", "pandas", "numpy", "scikit-learn",
    "machine learning", "deep learning", "nlp", "computer vision",
    "agile", "scrum", "jira", "confluence",
    "linux", "bash", "shell", "powershell",
    "c++", "c#", "go", "rust", "swift", "kotlin", "php", "ruby",
    "firebase", "supabase", "prisma", "sequelize", "mongoose",
    "webpack", "vite", "next.js", "nextjs", "nuxt", "gatsby",
    "testing", "jest", "mocha", "cypress", "selenium",
    "devops", "terraform", "ansible", "jenkins", "github actions",
}

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(title="Procruit AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Response Schema
# ---------------------------------------------------------------------------
class ParseCVResponse(BaseModel):
    suitability_score: float
    matched_keywords: List[str]
    missing_keywords: List[str]


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------
def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF using pdfplumber — strictly in-memory."""
    text_parts: list[str] = []
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
    except Exception as exc:
        logger.error("PDF extraction failed: %s", exc)
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted PDF file: {exc}")

    full_text = "\n".join(text_parts).strip()
    if not full_text:
        raise HTTPException(status_code=400, detail="Could not extract any text from the PDF. The file may be image-based or empty.")
    return full_text


def extract_keywords(text: str) -> set[str]:
    """
    Extract meaningful keywords from text using spaCy NER + noun chunks,
    plus a curated tech keyword lookup.
    """
    doc = nlp(text.lower())
    keywords: set[str] = set()

    # 1. Named entities (skip date/number-like labels)
    for ent in doc.ents:
        if ent.label_ not in STOP_LABELS and len(ent.text.strip()) > 1:
            keywords.add(ent.text.strip())

    # 2. Noun chunks (unigrams & bigrams)
    for chunk in doc.noun_chunks:
        clean = chunk.text.strip()
        if len(clean) > 1 and not clean.isnumeric():
            keywords.add(clean)

    # 3. Curated tech keyword matching
    text_lower = text.lower()
    for kw in TECH_KEYWORDS:
        if kw in text_lower:
            keywords.add(kw)

    return keywords


def compute_semantic_score(cv_text: str, jd_text: str) -> float:
    """Compute cosine similarity between CV and JD embeddings (0-100)."""
    embeddings = embedding_model.encode([cv_text, jd_text])
    score = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    return max(0.0, min(float(score) * 100, 100.0))


def compute_keyword_score(cv_keywords: set[str], jd_keywords: set[str]) -> float:
    """Compute keyword overlap percentage (0-100)."""
    if not jd_keywords:
        return 100.0
    overlap = cv_keywords & jd_keywords
    return (len(overlap) / len(jd_keywords)) * 100


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------
@app.post("/api/ai/parse-cv", response_model=ParseCVResponse)
async def parse_cv(
    file: UploadFile = File(...),
    job_description: str = Form(...),
):
    """
    Parse a candidate's CV (PDF) and score it against a job description.

    - Extracts text from the uploaded PDF (in-memory only)
    - Computes semantic similarity via SentenceTransformers
    - Extracts and compares keywords via spaCy
    - Returns a combined suitability score (0-100)
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    # Read file into memory (no temp files)
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    logger.info("Processing CV: %s (%d bytes)", file.filename, len(file_bytes))

    # 1. Extract text from PDF
    cv_text = extract_text_from_pdf(file_bytes)
    logger.info("Extracted %d characters from CV.", len(cv_text))

    # 2. Semantic similarity
    semantic_score = compute_semantic_score(cv_text, job_description)
    logger.info("Semantic score: %.2f", semantic_score)

    # 3. Keyword extraction & matching
    cv_keywords = extract_keywords(cv_text)
    jd_keywords = extract_keywords(job_description)

    matched = cv_keywords & jd_keywords
    missing = jd_keywords - cv_keywords

    keyword_score = compute_keyword_score(cv_keywords, jd_keywords)
    logger.info("Keyword score: %.2f  (matched=%d, missing=%d)", keyword_score, len(matched), len(missing))

    # 4. Combined score (60% semantic + 40% keyword)
    suitability_score = round((semantic_score * 0.6) + (keyword_score * 0.4), 1)

    return ParseCVResponse(
        suitability_score=suitability_score,
        matched_keywords=sorted(matched),
        missing_keywords=sorted(missing),
    )


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "models_loaded": True}


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
