import re
import os
import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.documents import EducationalDocument, DocumentChunk
from app.rag.vector_store import vector_store

logger = logging.getLogger("learnbridge.document_processor")

def extract_text_from_file(file_path: str, file_type: str) -> str:
    """
    Extracts plain text from document based on file type.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    if file_type in ["txt", "md"]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

    elif file_type == "pdf":
        text_content = []
        try:
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        text_content.append(text)
            return "\n".join(text_content)
        except ImportError:
            logger.warning("pdfplumber is not installed. PDF extraction will fail.")
            # Fallback plain binary reader
            with open(file_path, "rb") as f:
                return f.read().decode("utf-8", errors="ignore")
        except Exception as e:
            logger.error(f"Error parsing PDF: {e}")
            raise e
    else:
        raise ValueError(f"Unsupported file type: {file_type}")

def chunk_text(text: str, chunk_size: int = 600, overlap: int = 100) -> List[str]:
    """
    Splits text into chunks of roughly chunk_size characters with overlap.
    """
    if not text:
        return []
        
    # Clean up excessive whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    chunks = []
    start = 0
    text_length = len(text)
    
    while start < text_length:
        end = min(start + chunk_size, text_length)
        chunk = text[start:end]
        chunks.append(chunk)
        
        # Move forward by size - overlap
        start += (chunk_size - overlap)
        if start >= text_length or end == text_length:
            break
            
    return chunks

def process_and_index_document(db: Session, doc_id: int, file_path: str, file_type: str) -> int:
    """
    Loads text, chunks it, saves chunks to DB, and registers vectors in Vector Store.
    """
    document = db.query(EducationalDocument).filter(EducationalDocument.id == doc_id).first()
    if not document:
        raise ValueError(f"Document with ID {doc_id} not found in database.")

    # 1. Extract
    text = extract_text_from_file(file_path, file_type)
    document.content = text
    db.commit()

    # 2. Chunk
    chunks = chunk_text(text)
    
    # 3. Save to database
    db_chunks = []
    vector_chunks = []
    for idx, text_chunk in enumerate(chunks):
        db_chunk = DocumentChunk(
            document_id=document.id,
            chunk_index=idx,
            text_content=text_chunk
        )
        db.add(db_chunk)
        db_chunks.append(db_chunk)

    db.commit()
    
    # 4. Refresh to get chunk IDs and add to Vector Store
    for db_c in db_chunks:
        vector_chunks.append({
            "chunk_id": db_c.id,
            "document_id": document.id,
            "text": db_c.text_content,
            "source": document.title
        })

    vector_store.add_chunks(vector_chunks)
    logger.info(f"Indexed document '{document.title}' (ID {document.id}) - {len(vector_chunks)} chunks.")
    return len(vector_chunks)

def reload_all_chunks_into_vector_store(db: Session):
    """
    Run on startup to populate vector store index with existing chunks from database.
    """
    vector_store.clear()
    chunks = db.query(DocumentChunk).all()
    vector_chunks = []
    for chunk in chunks:
        doc = db.query(EducationalDocument).filter(EducationalDocument.id == chunk.document_id).first()
        source = doc.title if doc else "Unknown Source"
        vector_chunks.append({
            "chunk_id": chunk.id,
            "document_id": chunk.document_id,
            "text": chunk.text_content,
            "source": source
        })
    if vector_chunks:
        vector_store.add_chunks(vector_chunks)
        logger.info(f"Reloaded {len(vector_chunks)} chunks from database into active vector index.")
