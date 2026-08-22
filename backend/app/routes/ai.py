import logging
import requests
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings

logger = logging.getLogger("learnbridge.routes.ai")
router = APIRouter(tags=["AI Integration Layer"])

@router.get("/ai/health")
def ai_health():
    """
    Checks configuration, reachability, models, and active databases for RAG agents.
    """
    llm_configured = bool(settings.LLM_API_KEY)
    llm_reachable = False
    model_name = settings.LLM_MODEL
    
    if llm_configured:
        try:
            # Check reachability of Google APIs
            res = requests.head("https://generativelanguage.googleapis.com", timeout=2.0)
            llm_reachable = True
        except Exception:
            pass
            
    # Try Ollama if cloud is not reachable
    if not llm_reachable and settings.OLLAMA_HOST:
        try:
            res = requests.get(settings.OLLAMA_HOST, timeout=1.5)
            if res.status_code == 200:
                llm_reachable = True
                model_name = f"Ollama ({settings.OLLAMA_MODEL})"
        except Exception:
            pass

    from app.rag.vector_store import vector_store
    from app.services.embeddings_service import embeddings_service
    
    rag_status = "active" if vector_store.doc_chunks else "empty"
    vector_db_status = "FAISS ready" if vector_store.faiss_index is not None else "In-memory list"
    embedding_status = "SentenceTransformer loaded" if embeddings_service.transformer is not None else "TF-IDF Fallback"
    agent_status = "ready"
    
    return {
        "llm_configured": llm_configured or bool(settings.OLLAMA_HOST),
        "llm_reachable": llm_reachable,
        "model": model_name,
        "rag_status": rag_status,
        "vector_db_status": vector_db_status,
        "embedding_status": embedding_status,
        "agent_status": agent_status
    }

@router.get("/learning/video-script")
def get_video_script(topic_name: str, db: Session = Depends(get_db)):
    """
    Returns an interactive lesson outline with visuals and checkpoint questions for Video Learning.
    """
    from app.services.llm_service import llm_service
    
    try:
        raw_res = llm_service.generate_video_script(topic_name)
        cleaned = raw_res.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        return json.loads(cleaned.strip())
    except Exception as e:
        logger.warning(f"Failed to generate video script via LLM: {e}. Triggering fallback.")
        from app.services.ai_service import OfflineFallbackService
        fallback = OfflineFallbackService()
        fallback_res = fallback.generate(f"video script for topic '{topic_name}'")
        return json.loads(fallback_res)

@router.get("/learning/research")
def research_unknown_topic(topic_name: str, db: Session = Depends(get_db)):
    """
    Triggers the Research Agent to search/synthesize knowledge for an uncataloged topic.
    """
    from app.services.llm_service import llm_service
    
    query_clean = topic_name.strip()
    try:
        raw_response = llm_service.research_topic(query_clean)
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        ai_data = json.loads(cleaned.strip())
        
        sources = ai_data.get("sources", [
            {"title": "Wikipedia - " + query_clean.title(), "url": f"https://en.wikipedia.org/wiki/{query_clean.replace(' ', '_')}"},
            {"title": "GeeksforGeeks - " + query_clean.title() + " guide", "url": f"https://www.geeksforgeeks.org/{query_clean.replace(' ', '-').lower()}/"}
        ])
        
        return {
            "status": "success",
            "topic_name": query_clean.title(),
            "classification": ai_data.get("classification", f"'{query_clean.title()}' appears to be a specialized academic concept."),
            "learning_path": ai_data.get("learning_path", ["Introduction", "Core Principles", "Key Elements", "Practice Loops", "Review"]),
            "prerequisites": ai_data.get("prerequisites", ["Array Fundamentals", "Basic Programming Logic"]),
            "sources": sources
        }
    except Exception as e:
        logger.warning(f"Research agent failed: {e}. Falling back to default research structure.")
        from app.services.ai_service import OfflineFallbackService
        fallback = OfflineFallbackService()
        fallback_res = fallback._generate_mock_research(query_clean)
        ai_data = json.loads(fallback_res)
        return {
            "status": "success",
            "topic_name": query_clean.title(),
            "classification": ai_data.get("classification"),
            "learning_path": ai_data.get("learning_path"),
            "prerequisites": ["Array Fundamentals", "Basic Programming Logic"],
            "sources": ai_data.get("sources")
        }
