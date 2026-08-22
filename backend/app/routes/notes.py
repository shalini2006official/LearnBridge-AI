import io
import logging
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.auth import get_current_student, get_current_user
from app.models.user import User
from app.models.notes import StudyNote
from app.schemas.notes import StudyNoteCreate, StudyNoteResponse
from app.services.llm_service import llm_service

logger = logging.getLogger("learnbridge.routes.notes")
router = APIRouter(tags=["Study Notes Layer"])

@router.post("/notes/generate", response_model=StudyNoteResponse)
def generate_notes(
    request: StudyNoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # 1. Ask LLM to generate structured notes
        notes_content = llm_service.generate_notes(request.topic_name, request.notes_style)
        
        # 2. Persist to SQLite
        new_note = StudyNote(
            student_id=current_user.id,
            topic_name=request.topic_name,
            notes_style=request.notes_style,
            content=notes_content
        )
        db.add(new_note)
        db.commit()
        db.refresh(new_note)
        
        return new_note
    except Exception as e:
        logger.error(f"Failed to generate study notes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Notes Generation failed: {e}"
        )

@router.get("/notes", response_model=List[StudyNoteResponse])
def list_notes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(StudyNote).filter(StudyNote.student_id == current_user.id).all()

@router.get("/notes/{note_id}", response_model=StudyNoteResponse)
def get_note_detail(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(StudyNote).filter(
        StudyNote.id == note_id,
        StudyNote.student_id == current_user.id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.delete("/notes/{note_id}")
def delete_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(StudyNote).filter(
        StudyNote.id == note_id,
        StudyNote.student_id == current_user.id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    db.delete(note)
    db.commit()
    return {"status": "success", "message": "Note deleted successfully"}

@router.post("/notes/{note_id}/download")
def download_note_pdf(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    
    note = db.query(StudyNote).filter(
        StudyNote.id == note_id,
        StudyNote.student_id == current_user.id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    # PDF generation buffer
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#17233C'),
        spaceAfter=15
    )
    
    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#52627A'),
        spaceAfter=20
    )
    
    h2_style = ParagraphStyle(
        'H2Style',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#F26B0F'),
        spaceBefore=10,
        spaceAfter=5
    )
    
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['BodyText'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#17233C'),
        spaceAfter=6
    )
    
    story = []
    
    # Brand line
    story.append(Paragraph("<b>LearnBridge AI — Personal Learning Companion</b>", ParagraphStyle('Brand', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#FF8A1F'))))
    story.append(Spacer(1, 8))
    
    # Title
    story.append(Paragraph(f"Study Notes: {note.topic_name}", title_style))
    
    # Meta
    date_str = datetime.now().strftime("%B %d, %Y")
    story.append(Paragraph(f"Student: <b>{current_student.name}</b> | Format: <b>{note.notes_style.title()} Notes</b> | Date: {date_str}", meta_style))
    story.append(Spacer(1, 10))
    
    # Split content into paragraphs
    lines = note.content.split('\n')
    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            story.append(Spacer(1, 4))
            continue
            
        if line_clean.startswith('###') or line_clean.startswith('##') or line_clean.startswith('#'):
            clean_title = line_clean.replace('#', '').strip()
            story.append(Paragraph(clean_title, h2_style))
        else:
            # Basic formatting using regex to correctly balance bold tags
            import re
            formatted = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line_clean)
            # Escape HTML brackets to avoid parsing error
            formatted = formatted.replace('< ', '&lt; ').replace(' >', ' &gt;')
            story.append(Paragraph(formatted, body_style))
            
    doc.build(story)
    buffer.seek(0)
    
    filename = f"LearnBridge_{note.topic_name.replace(' ', '_')}_{note.notes_style}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
