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
import string
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

# Common NER labels that are never useful keywords
STOP_LABELS = {"DATE", "TIME", "PERCENT", "MONEY", "QUANTITY", "ORDINAL", "CARDINAL"}

# POS tags allowed when harvesting noun-chunks / tokens
ALLOWED_POS = {"PROPN", "NOUN"}

# Conversational / filler phrases that should never be keywords
NOISE_PHRASES = {
    "the ideal candidate", "this role", "ideal candidate", "the role",
    "cross-functional teams", "team player", "strong communication",
    "years of experience", "year of experience", "a plus",
    "fast-paced environment", "self-starter", "detail-oriented",
    "problem solver", "strong work ethic", "ability to",
    "responsible for", "looking for", "we are looking",
    "you will", "you", "we", "they", "our", "your",
}

# Generic JD nouns that spaCy tags as NOUN but carry zero technical signal
JD_STOPWORDS = {
    "candidate", "role", "team", "teams", "responsibilities", "responsibility",
    "experience", "hands", "key", "design", "development", "operations",
    "engineering", "monitor", "practices", "practice", "delivery",
    "reliability", "cost", "efficiency", "collaborate", "build",
    "system", "systems", "technologies", "technology", "environment",
    "environments", "solutions", "solution", "tools", "tool",
    "knowledge", "understanding", "skills", "skill", "ability",
    "proficiency", "work", "working", "position", "opportunity",
    "requirements", "requirement", "qualifications", "qualification",
    "company", "organization", "organisation", "client", "clients",
    "project", "projects", "service", "services", "support",
    "performance", "management", "process", "processes",
    "implementation", "integration", "deployment", "application",
    "applications", "infrastructure", "architecture", "platform",
    "stakeholders", "communication", "collaboration", "documentation",
    "standards", "standard", "strategy", "strategies",
    "level", "degree", "bachelor", "master", "certification",
    "minimum", "preferred", "required", "plus", "bonus",
    "job", "description", "title", "summary", "overview",
}

# Curated list of tech / professional keywords to boost extraction
TECH_KEYWORDS = {
    "python", "java", "javascript", "typescript", "react", "angular", "vue",
    "node", "nodejs", "node.js", "express", "django", "flask", "fastapi", "spring",
    "sql", "nosql", "mongodb", "postgresql", "mysql", "redis", "elasticsearch",
    "docker", "kubernetes", "k8s", "aws", "azure", "gcp", "git", "ci/cd", "cicd",
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
    "oauth", "jwt", "sso", "saml", "openid",
    "rabbitmq", "kafka", "celery", "airflow",
    "nginx", "apache", "load balancer",
    "s3", "ec2", "lambda", "ecs", "eks",
    "data engineering", "data science", "data analysis",
    "tableau", "power bi", "looker",
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


def _normalise(token_text: str) -> str:
    """Lowercase and strip leading/trailing punctuation from a token."""
    return token_text.lower().strip(string.punctuation + " \t\n")


def _is_noise(phrase: str) -> bool:
    """Return True if phrase is a known filler / conversational noise."""
    return phrase in NOISE_PHRASES


def extract_keywords(text: str) -> set[str]:
    """
    Extract meaningful **technical / professional** keywords from text.

    Strategy
    --------
    1. spaCy noun-chunks — keep only PROPN/NOUN tokens, enforce max 2 words,
       and filter against JD_STOPWORDS + spaCy stop words.
    2. spaCy named entities — skip date/number labels, noise, and fluff.
    3. Individual PROPN / NOUN tokens (unigrams).
    4. Curated TECH_KEYWORDS substring lookup.

    All results are lowercased and punctuation-stripped before returning.
    """
    doc = nlp(text)
    keywords: set[str] = set()
    stop_words = nlp.Defaults.stop_words | JD_STOPWORDS

    # ── 1. Noun chunks (max 2 words, root must be NOUN/PROPN) ──────────
    for chunk in doc.noun_chunks:
        useful_tokens = [
            _normalise(tok.text)
            for tok in chunk
            if tok.pos_ in ALLOWED_POS
            and _normalise(tok.text) not in stop_words
            and len(_normalise(tok.text)) > 1
        ]
        if not useful_tokens:
            continue
        # Enforce max 2 words
        if len(useful_tokens) > 2:
            continue
        phrase = " ".join(useful_tokens)
        if _is_noise(phrase) or phrase.isnumeric():
            continue
        keywords.add(phrase)

    # ── 2. Named entities (skip numeric / date labels, noise) ─────────
    for ent in doc.ents:
        if ent.label_ in STOP_LABELS:
            continue
        normalised = _normalise(ent.text)
        if len(normalised) <= 1 or normalised in stop_words or _is_noise(normalised):
            continue
        if len(normalised.split()) > 2:
            continue
        keywords.add(normalised)

    # ── 3. Individual PROPN / NOUN tokens ─────────────────────────────
    for tok in doc:
        if tok.pos_ not in ALLOWED_POS:
            continue
        norm = _normalise(tok.text)
        if len(norm) > 1 and norm not in stop_words and not norm.isnumeric():
            keywords.add(norm)

    # ── 4. Curated tech keyword matching ──────────────────────────────
    text_lower = text.lower()
    for kw in TECH_KEYWORDS:
        if kw in text_lower:
            keywords.add(kw)

    # Final pass — remove noise phrases and JD stopwords
    keywords = {
        k for k in keywords
        if not _is_noise(k) and k not in JD_STOPWORDS
    }

    return keywords


def compute_semantic_score(cv_text: str, jd_text: str) -> float:
    """Compute cosine similarity between CV and JD embeddings (0-100)."""
    embeddings = embedding_model.encode([cv_text, jd_text])
    score = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    return max(0.0, min(float(score) * 100, 100.0))


def _remove_subset_phrases(
    matched: set[str], missing: set[str],
) -> set[str]:
    """
    Remove n-gram phrases from *missing* when every individual word in
    the phrase already appears inside *matched*.  This prevents double-
    penalisation (e.g. "aws cloudformation" missing even though "aws"
    and "cloudformation" are both matched individually).
    """
    # Build a flat set of all individual words present in matched keywords
    matched_words = set()
    for kw in matched:
        matched_words.update(kw.split())

    cleaned_missing: set[str] = set()
    for phrase in missing:
        words = phrase.split()
        if len(words) > 1 and all(w in matched_words for w in words):
            # All sub-words already matched — not truly missing
            continue
        cleaned_missing.add(phrase)
    return cleaned_missing


def compute_keyword_score(
    cv_keywords: set[str],
    jd_keywords: set[str],
    matched_count: int,
) -> float:
    """
    Compute keyword overlap percentage (0-100) with an aggressive curve.

    If the candidate matches > 15 technical keywords the raw ratio is
    boosted so strong CVs are not anchored down by a large JD denominator.
    """
    if not jd_keywords:
        return 100.0

    raw_ratio = matched_count / len(jd_keywords)
    raw_score = raw_ratio * 100

    # Aggressive curve: reward high absolute match counts
    if matched_count >= 20:
        # Essentially a perfect keyword match at 20+ matches
        curved_score = max(raw_score, 95.0)
    elif matched_count >= 15:
        # Strong match — boost toward 90-95 range
        boost = (matched_count - 15) / 5  # 0.0 → 1.0
        curved_score = raw_score + (95.0 - raw_score) * boost * 0.7
    elif matched_count >= 10:
        # Good match — mild boost
        boost = (matched_count - 10) / 5  # 0.0 → 1.0
        curved_score = raw_score + (90.0 - raw_score) * boost * 0.3
    else:
        curved_score = raw_score

    return min(curved_score, 100.0)


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

    # 3b. Subset-matching — remove n-gram phrases whose individual
    #     words are already present in matched_keywords
    missing = _remove_subset_phrases(matched, missing)
    # Re-derive matched count after subset cleaning
    effective_matched = len(jd_keywords) - len(missing)

    keyword_score = compute_keyword_score(jd_keywords, jd_keywords, effective_matched)
    logger.info(
        "Keyword score: %.2f  (matched=%d, missing=%d, jd_total=%d)",
        keyword_score, effective_matched, len(missing), len(jd_keywords),
    )

    # 4. Combined score — dynamically adjust weights
    #    Default: 60% semantic + 40% keyword
    #    If the JD yields fewer than 5 filterable keywords the keyword
    #    score becomes unreliable, so we shift weight toward semantic.
    if len(jd_keywords) < 5:
        semantic_weight = 0.85
        keyword_weight = 0.15
        logger.info(
            "JD keyword count (%d) < 5 — using semantic-heavy weights (%.0f/%.0f)",
            len(jd_keywords), semantic_weight * 100, keyword_weight * 100,
        )
    else:
        semantic_weight = 0.60
        keyword_weight = 0.40

    suitability_score = round(
        (semantic_score * semantic_weight) + (keyword_score * keyword_weight), 1,
    )

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
