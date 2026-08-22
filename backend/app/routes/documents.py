from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
import os
import shutil
from app.database import get_db
from app.models.documents import EducationalDocument
from app.rag.document_processor import process_and_index_document, reload_all_chunks_into_vector_store
from app.utils.auth import get_current_user

router = APIRouter(prefix="/documents", tags=["Document/RAG Management"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "documents")

@router.post("/upload")
def upload_document(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure directory exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Validate file type
    filename = file.filename
    ext = filename.split(".")[-1].lower()
    if ext not in ["txt", "md", "pdf"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Only .txt, .md, and .pdf files are accepted."
        )

    # Save file locally
    save_path = os.path.join(UPLOAD_DIR, filename)
    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write file to disk: {e}"
        )

    # Save to database
    doc_entry = EducationalDocument(
        title=filename.split(".")[0].replace("_", " ").title(),
        file_path=save_path,
        file_type=ext
    )
    db.add(doc_entry)
    db.commit()
    db.refresh(doc_entry)

    # Process and index chunks
    try:
        chunks_count = process_and_index_document(db, doc_entry.id, save_path, ext)
        return {
            "message": "File uploaded and indexed successfully.",
            "document_id": doc_entry.id,
            "title": doc_entry.title,
            "chunks_created": chunks_count
        }
    except Exception as e:
        # Clean up database entry if indexing failed
        db.delete(doc_entry)
        db.commit()
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to index document: {e}"
        )

@router.post("/index")
def trigger_reindex(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        reload_all_chunks_into_vector_store(db)
        return {"message": "All database document chunks have been reloaded into the active vector index."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reindexing failed: {e}"
        )
