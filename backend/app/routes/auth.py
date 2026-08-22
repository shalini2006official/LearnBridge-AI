from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app.models.user import User, StudentProfile
from app.schemas.user import UserCreate, UserLogin, Token, UserResponse
from app.utils.auth import hash_password, verify_password, create_access_token, get_current_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Create new User
    hashed = hash_password(user_in.password)
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hashed,
        role=user_in.role,
        language=user_in.language,
        accessibility_settings={"font_size": "medium", "high_contrast": False, "lite_mode": False}
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # If role is student, create a student profile and auto-enroll in active classes
    if new_user.role == "student":
        student_profile = StudentProfile(
            user_id=new_user.id,
            grade=user_in.grade or "college",
            explanation_preference=user_in.explanation_preference or "example",
            confidence_history=[]
        )
        db.add(student_profile)
        
        try:
            from app.models.teacher import Class, ClassStudent
            active_classes = db.query(Class).all()
            for cls in active_classes:
                db.add(ClassStudent(class_id=cls.id, student_id=new_user.id))
        except Exception as e:
            logger.error(f"Failed to auto-enroll student: {e}")
            
        db.commit()
        db.refresh(new_user) # reload to populate student_profile relationship

    # Generate token
    access_token = create_access_token(data={"sub": new_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

# Endpoint for standard OAuth2 form login compatibility if needed
@router.post("/token", response_model=Token)
def login_for_oauth2_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }
