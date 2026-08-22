from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Dict, Any
from app.database import get_db
from app.utils.auth import get_current_student
from app.models.user import User, StudentProfile
from app.models.scholarship import Scholarship, ScholarshipMatch
from app.schemas.scholarship import ScholarshipProfileUpdate, ScholarshipMatchResponse
from app.services.ai_service import ai_service

router = APIRouter(prefix="/aid", tags=["Aid & Scholarships"])

@router.post("/profile")
def update_aid_profile(
    profile_in: ScholarshipProfileUpdate,
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = current_student.student_profile
    if not profile:
        profile = StudentProfile(user_id=current_student.id)
        db.add(profile)
        db.commit()
        db.refresh(current_student)
        profile = current_student.student_profile

    # Update aid-specific self-reported fields
    if profile_in.income_bracket is not None:
        profile.income_bracket = profile_in.income_bracket
    if profile_in.category is not None:
        profile.category = profile_in.category
    if profile_in.region is not None:
        profile.region = profile_in.region
    if profile_in.field_of_interest is not None:
        profile.field_of_interest = profile_in.field_of_interest

    db.commit()
    return {"message": "Private scholarship match profile updated successfully."}

@router.get("/matches", response_model=List[ScholarshipMatchResponse])
def get_scholarship_matches(
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = current_student.student_profile
    
    # Empty state trigger: if student has not self-reported any aid profile fields, return empty
    if not profile or (
        profile.income_bracket is None and
        profile.category is None and
        profile.region is None and
        profile.field_of_interest is None
    ):
        return []

    # 1. Rule-based Filter
    query = db.query(Scholarship)
    
    # We load all scholarships and filter in memory to allow flexible partial-match rules
    all_scholarships = query.all()
    candidate_scholarships = []

    for s in all_scholarships:
        # Grade check
        if s.grade_criteria and profile.grade and s.grade_criteria.lower() != profile.grade.lower():
            continue
            
        # Income check: student income must be <= maximum limit specified
        if s.income_criteria is not None and profile.income_bracket is not None:
            if profile.income_bracket > s.income_criteria:
                continue

        # Category check: e.g. merit, need, disability, community
        if s.category_criteria:
            s_cat = s.category_criteria.lower()
            p_cat = (profile.category or "").lower()
            # Special restriction check: if the scholarship requires disability/minority criteria,
            # only match if the student explicitly self-reported that category.
            if "disability" in s_cat and "disability" not in p_cat:
                continue
            if "community" in s_cat and "community" not in p_cat:
                continue
            # Note: merit-based and need-based scholarships are generally open to all categories,
            # so we do not discard them if a student selects a specialized category.

        # Region check
        if s.region_criteria and profile.region:
            s_region = s.region_criteria.lower()
            p_region = profile.region.lower()
            # If the scholarship region is "national" or "all", it matches any student's region/state.
            # Otherwise, check if student's region matches the scholarship region.
            if s_region != "national" and s_region != "all" and s_region not in p_region and p_region not in s_region:
                continue

        # Field check: e.g. CS, Math, Engineering
        if s.field_criteria and profile.field_of_interest:
            s_field = s.field_criteria.lower()
            p_field = profile.field_of_interest.lower()
            # Match if either is contained in the other
            if s_field not in p_field and p_field not in s_field:
                continue

        # If it passes all criteria checks, add as candidate
        candidate_scholarships.append(s)

    # 2. Match generation & Local LLM pass
    results = []

    for s in candidate_scholarships:
        # Check if match already exists
        match = db.query(ScholarshipMatch).filter(
            ScholarshipMatch.student_id == current_student.id,
            ScholarshipMatch.scholarship_id == s.id
        ).first()

        if match:
            # If match was already dismissed by student, skip returning it
            if match.status == "dismissed":
                continue
        else:
            # Run Local LLM pass to create "why you qualify" checklist explanation
            explanation = ""
            lang = current_student.language or "en"
            
            if ai_service.ai_active:
                try:
                    prompt = (
                        f"Student Profile:\n"
                        f"- Grade: {profile.grade or 'Not Specified'}\n"
                        f"- Region: {profile.region or 'Not Specified'}\n"
                        f"- Category interest: {profile.category or 'Not Specified'}\n"
                        f"- Income limit: {profile.income_bracket or 'Not Specified'}\n\n"
                        f"Scholarship Details:\n"
                        f"- Name: {s.name}\n"
                        f"- Required Documents: {', '.join(s.required_documents) if s.required_documents else 'None'}\n\n"
                        f"Explain in 2 short sentences why the student qualifies and list the required documents. "
                        f"Write this in language code: {lang}. Keep the format clean."
                    )
                    explanation = ai_service.service.generate(prompt)
                except Exception:
                    pass

            # Fallback static template generator for offline demo mode
            if not explanation:
                doc_list = ", ".join(s.required_documents) if s.required_documents else "latest transcript"
                explanation = (
                    f"Match identified based on your profile inputs. "
                    f"Required items checklist: {doc_list}."
                )

            # Create new match record
            match = ScholarshipMatch(
                student_id=current_student.id,
                scholarship_id=s.id,
                matched_criteria=explanation,
                status="suggested"
            )
            db.add(match)
            db.commit()
            db.refresh(match)

        results.append(match)

    # 3. Rank by deadline proximity (closer deadlines first)
    results.sort(key=lambda m: (m.scholarship.deadline, -m.scholarship.award_amount))

    return results

@router.post("/matches/{match_id}/status")
def update_match_status(
    match_id: int,
    status_update: Dict[str, str], # expecting {"status": "applied" | "dismissed"}
    current_student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    new_status = status_update.get("status")
    if new_status not in ["suggested", "applied", "dismissed"]:
        raise HTTPException(status_code=400, detail="Invalid status option.")

    match = db.query(ScholarshipMatch).filter(
        ScholarshipMatch.id == match_id,
        ScholarshipMatch.student_id == current_student.id
    ).first()

    if not match:
        raise HTTPException(status_code=404, detail="Scholarship match record not found.")

    match.status = new_status
    db.commit()
    return {"message": f"Scholarship match status updated to '{new_status}'."}
