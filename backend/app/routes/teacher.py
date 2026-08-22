from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.utils.auth import get_current_teacher
from app.models.user import User
from app.models.teacher import Class, ClassStudent, Intervention, TeacherInsight
from app.models.curriculum import Topic
from app.models.analytics import StudentTopicMastery, ConfusionFingerprint
from app.schemas.teacher import (
    ClassResponse, ClassDetailResponse, ClassStudentResponse,
    ClassroomPulse, ClassroomRadarResponse, RadarGroup, InterventionResponse,
    InterventionUpdateStatus
)

router = APIRouter(prefix="/teacher", tags=["Teacher Layer"])

@router.get("/class-overview", response_model=List[ClassResponse])
def get_class_overview(
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    classes = db.query(Class).filter(Class.teacher_id == current_teacher.id).all()
    
    if not classes:
        # Create a default class "Introduction to Computer Science (CS)" for this teacher
        new_class = Class(
            name="Introduction to Computer Science (CS)",
            description="Introduction to fundamental algorithms, data structures, and programming theory.",
            teacher_id=current_teacher.id
        )
        db.add(new_class)
        db.commit()
        db.refresh(new_class)
        
        # Auto-enroll all existing students in this class so the roster is populated
        students = db.query(User).filter(User.role == "student").all()
        for student in students:
            db.add(ClassStudent(class_id=new_class.id, student_id=student.id))
            
        # Add a default pending intervention for recursion
        new_intv = Intervention(
            teacher_id=current_teacher.id,
            class_id=new_class.id,
            topic_id=2, # Recursion
            title="Clarify Base Cases in Recursion",
            issue_description="3 students are experiencing stack overflow crashes due to missing base case definitions in recursive functions.",
            suggested_action="Review recursion call loops visually with a stack drawing exercise and print debugging statements.",
            action_materials=["Stack visualizers and base case code templates."],
            affected_students=["Alex Mercer", "Timothy Green", "Marcus Miller"],
            status="pending"
        )
        db.add(new_intv)
        db.commit()
        
        # Query again to return the new class
        classes = [new_class]

    response = []
    for cls in classes:
        # Count students
        student_count = db.query(ClassStudent).filter(ClassStudent.class_id == cls.id).count()
        response.append(
            ClassResponse(
                id=cls.id,
                name=cls.name,
                description=cls.description,
                created_at=cls.created_at,
                student_count=student_count
            )
        )
    return response

@router.get("/class-detail/{class_id}", response_model=ClassDetailResponse)
def get_class_detail(
    class_id: int,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    cls = db.query(Class).filter(Class.id == class_id, Class.teacher_id == current_teacher.id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    class_students = db.query(ClassStudent).filter(ClassStudent.class_id == class_id).all()
    students_res = []

    for cs in class_students:
        student = db.query(User).filter(User.id == cs.student_id).first()
        if not student:
            continue

        # Calculate average mastery and mastered topics
        masteries = db.query(StudentTopicMastery).filter(StudentTopicMastery.student_id == student.id).all()
        avg_mastery = 0.0
        completed_topics = []
        if masteries:
            avg_mastery = sum([m.mastery_score for m in masteries]) / len(masteries)
            for m in masteries:
                if m.mastery_score >= 70.0:
                    topic = db.query(Topic).filter(Topic.id == m.topic_id).first()
                    if topic:
                        completed_topics.append(topic.name)

        status_color = "white"
        if avg_mastery >= 70.0:
            status_color = "green"
        elif avg_mastery >= 40.0:
            status_color = "yellow"
        elif masteries:
            status_color = "red"

        students_res.append(
            ClassStudentResponse(
                student_id=student.id,
                name=student.name,
                email=student.email,
                overall_mastery=avg_mastery,
                status_color=status_color,
                completed_topics=completed_topics
            )
        )

    return ClassDetailResponse(
        id=cls.id,
        name=cls.name,
        description=cls.description,
        created_at=cls.created_at,
        students=students_res
    )

@router.get("/class-pulse/{class_id}", response_model=ClassroomPulse)
def get_classroom_pulse(
    class_id: int,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    # Retrieve all students in class
    class_students = db.query(ClassStudent).filter(ClassStudent.class_id == class_id).all()
    
    on_track = 0
    needs_attention = 0
    high_risk = 0

    for cs in class_students:
        masteries = db.query(StudentTopicMastery).filter(StudentTopicMastery.student_id == cs.student_id).all()
        avg_mastery = 0.0
        if masteries:
            avg_mastery = sum([m.mastery_score for m in masteries]) / len(masteries)
            
        if avg_mastery >= 70.0:
            on_track += 1
        elif avg_mastery >= 40.0:
            needs_attention += 1
        else:
            high_risk += 1

    return ClassroomPulse(
        on_track_count=on_track,
        needs_attention_count=needs_attention,
        high_risk_count=high_risk
    )

@router.get("/students-at-risk/{class_id}", response_model=List[ClassStudentResponse])
def get_students_at_risk(
    class_id: int,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    class_students = db.query(ClassStudent).filter(ClassStudent.class_id == class_id).all()
    at_risk = []

    for cs in class_students:
        masteries = db.query(StudentTopicMastery).filter(StudentTopicMastery.student_id == cs.student_id).all()
        avg_mastery = 0.0
        if masteries:
            avg_mastery = sum([m.mastery_score for m in masteries]) / len(masteries)
        
        # High risk or Needs Attention counts as at-risk
        if avg_mastery < 70.0:
            student = db.query(User).filter(User.id == cs.student_id).first()
            status_color = "red" if avg_mastery < 40.0 else "yellow"
            if student:
                at_risk.append(
                    ClassStudentResponse(
                        student_id=student.id,
                        name=student.name,
                        email=student.email,
                        overall_mastery=avg_mastery,
                        status_color=status_color
                    )
                )
    return at_risk

@router.get("/topic-insights/{class_id}/{topic_id}", response_model=ClassroomRadarResponse)
def get_classroom_radar(
    class_id: int,
    topic_id: int,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    # Get class students
    class_students = db.query(ClassStudent).filter(ClassStudent.class_id == class_id).all()
    student_ids = [cs.student_id for cs in class_students]

    # Get fingerprints for these students on this topic
    fingerprints = db.query(ConfusionFingerprint).filter(
        ConfusionFingerprint.topic_id == topic_id,
        ConfusionFingerprint.student_id.in_(student_ids)
    ).all()

    # Cluster students by primary issue
    issue_groups = {}
    
    # Catch students with no fingerprints or 100% mastery as "On Track"
    on_track_students = []
    
    for student_id in student_ids:
        student = db.query(User).filter(User.id == student_id).first()
        if not student:
            continue
            
        mastery = db.query(StudentTopicMastery).filter(
            StudentTopicMastery.student_id == student_id,
            StudentTopicMastery.topic_id == topic_id
        ).first()
        
        fp = next((f for f in fingerprints if f.student_id == student_id), None)
        if fp and fp.primary_issue:
            issue = fp.primary_issue
            if issue not in issue_groups:
                issue_groups[issue] = []
            issue_groups[issue].append({"id": student.id, "name": student.name})
        elif mastery and mastery.mastery_score >= 70.0:
            on_track_students.append({"id": student.id, "name": student.name})

    radar_groups = []
    
    # Add clustered issue groups
    for issue, students in issue_groups.items():
        radar_groups.append(
            RadarGroup(
                sub_issue=issue,
                description=f"Students struggling with {issue.lower()}.",
                student_count=len(students),
                students=students
            )
        )

    # Add On Track group
    if on_track_students:
        radar_groups.append(
            RadarGroup(
                sub_issue="Concept Mastered / On Track",
                description="Students showing healthy topic comprehension.",
                student_count=len(on_track_students),
                students=on_track_students
            )
        )

    return ClassroomRadarResponse(
        topic_id=topic_id,
        topic_name=topic.name,
        radar_groups=radar_groups
    )

@router.get("/interventions/{class_id}", response_model=List[InterventionResponse])
def get_interventions(
    class_id: int,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    interventions = db.query(Intervention).filter(Intervention.class_id == class_id).all()
    
    response = []
    for intv in interventions:
        topic = db.query(Topic).filter(Topic.id == intv.topic_id).first()
        topic_name = topic.name if topic else "Unknown Topic"
        
        response.append(
            InterventionResponse(
                id=intv.id,
                class_id=intv.class_id,
                topic_id=intv.topic_id,
                topic_name=topic_name,
                title=intv.title,
                issue_description=intv.issue_description,
                suggested_action=intv.suggested_action,
                action_materials=intv.action_materials,
                affected_students=intv.affected_students,
                status=intv.status,
                created_at=intv.created_at
            )
        )
    return response

@router.post("/interventions/{intervention_id}/status")
def update_intervention_status(
    intervention_id: int,
    status_update: InterventionUpdateStatus,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    intervention = db.query(Intervention).filter(Intervention.id == intervention_id).first()
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention not found")

    intervention.status = status_update.status
    db.commit()
    return {"message": f"Intervention status updated to {status_update.status}."}

@router.delete("/class/{class_id}/student/{student_id}")
def remove_student_from_class(
    class_id: int,
    student_id: int,
    current_teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    cls = db.query(Class).filter(Class.id == class_id, Class.teacher_id == current_teacher.id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found or unauthorized")
        
    enrollment = db.query(ClassStudent).filter(
        ClassStudent.class_id == class_id,
        ClassStudent.student_id == student_id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Student enrollment not found in this class")
        
    db.delete(enrollment)
    db.commit()
    return {"status": "success", "message": "Student successfully removed from class"}
