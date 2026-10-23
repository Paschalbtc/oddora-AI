from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional, List

from dotenv import load_dotenv
import google.generativeai as genai
from groq import Groq
from supabase import create_client, Client

# Configure logger
logger = logging.getLogger("oddora.config")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

# Load environment variables (.env in backend or workspace root)
backend_env_path = Path(__file__).resolve().parent / ".env"
root_env_path = Path(__file__).resolve().parent.parent / ".env"

if backend_env_path.exists():
    load_dotenv(dotenv_path=backend_env_path)
elif root_env_path.exists():
    load_dotenv(dotenv_path=root_env_path)
else:
    load_dotenv()

# Environment variables
API_FOOTBALL_KEY: str = os.getenv("API_FOOTBALL_KEY", "")
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")

APP_MODE: str = os.getenv("APP_MODE", "TEST_FREE_BETA")

# Supabase Client Initialization (using SUPABASE_SERVICE_KEY)
supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        logger.info("Supabase client initialized successfully with SUPABASE_SERVICE_KEY.")
    except Exception as e:
        logger.error("Failed to initialize Supabase client: %s", e)
else:
    logger.warning("SUPABASE_URL or SUPABASE_SERVICE_KEY missing. Supabase client initialized as None.")

# Groq Client Initialization
groq_client: Optional[Groq] = None
if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
        logger.info("Groq client initialized successfully.")
    except Exception as e:
        logger.error("Failed to initialize Groq client: %s", e)
else:
    logger.warning("GROQ_API_KEY missing. Groq client initialized as None.")

# Configure Google Generative AI
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        logger.info("google.generativeai configured successfully.")
    except Exception as e:
        logger.error("Failed to configure google.generativeai: %s", e)
else:
    logger.warning("GEMINI_API_KEY missing. google.generativeai not configured.")

# Constants
EMBEDDING_MODEL: str = "models/gemini-embedding-001"
EMBEDDING_DIMENSIONS: int = 768


def get_embedding(text: str) -> list[float]:
    """
    Generate an embedding vector for the provided text using Google Generative AI (768 dimensions).
    Includes a safe fallback returning a zero-vector so callers never crash even on errors, rate limits, or missing keys.
    """
    if not text or not isinstance(text, str) or not text.strip():
        return [0.0] * EMBEDDING_DIMENSIONS

    try:
        if not GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not configured. Returning 768-dim zero-vector fallback.")
            return [0.0] * EMBEDDING_DIMENSIONS

        try:
            response = genai.embed_content(
                model=EMBEDDING_MODEL,
                content=text.strip(),
                output_dimensionality=EMBEDDING_DIMENSIONS,
            )
        except Exception:
            # Fallback to models/text-embedding-004 or without output_dimensionality if needed
            response = genai.embed_content(
                model="models/text-embedding-004",
                content=text.strip(),
            )

        if isinstance(response, dict) and "embedding" in response:
            emb = response["embedding"]
            if isinstance(emb, list) and len(emb) > 0:
                # Ensure exactly 768 dimensions
                if len(emb) > EMBEDDING_DIMENSIONS:
                    emb = emb[:EMBEDDING_DIMENSIONS]
                elif len(emb) < EMBEDDING_DIMENSIONS:
                    emb = emb + [0.0] * (EMBEDDING_DIMENSIONS - len(emb))
                return [float(x) for x in emb]
        elif hasattr(response, "embedding"):
            emb = response.embedding
            if isinstance(emb, list) and len(emb) > 0:
                if len(emb) > EMBEDDING_DIMENSIONS:
                    emb = emb[:EMBEDDING_DIMENSIONS]
                elif len(emb) < EMBEDDING_DIMENSIONS:
                    emb = emb + [0.0] * (EMBEDDING_DIMENSIONS - len(emb))
                return [float(x) for x in emb]

        logger.warning("Embedding response had unexpected format. Returning 768-dim zero-vector fallback.")
        return [0.0] * EMBEDDING_DIMENSIONS
    except Exception as e:
        logger.error("Error generating embedding with %s: %s. Returning fallback.", EMBEDDING_MODEL, e)
        return [0.0] * EMBEDDING_DIMENSIONS

