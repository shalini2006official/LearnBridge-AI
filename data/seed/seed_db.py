import sys
import os
from datetime import datetime, timedelta

# Adjust path to find backend app
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "backend"))

from app.database import SessionLocal, Base, engine
from app.utils.auth import hash_password
from app.models.user import User, StudentProfile
from app.models.curriculum import Subject, Topic, TopicPrerequisite
from app.models.quiz import QuizQuestion
from app.models.analytics import Misconception, StudentTopicMastery, ConfusionFingerprint, LearningRecommendation
from app.models.gamification import Achievement, StudentAchievement
from app.models.teacher import Class, ClassStudent, Intervention, TeacherInsight
from app.models.scholarship import Scholarship

def seed_database():
    db = SessionLocal()
    print("Database seeding initiated...")

    # Clean existing data safely
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # 1. Create Achievements / Badges
    badges = [
        Achievement(title="Quiz Conqueror", description="Scored 100% on any adaptive topic quiz.", badge_icon="Award", xp_reward=100),
        Achievement(title="Feynman Master", description="Successfully explained a complex topic in Teach-Back Mode.", badge_icon="BookOpen", xp_reward=150),
        Achievement(title="Spaced Learner", description="Completed a scheduled spaced repetition review.", badge_icon="Calendar", xp_reward=75),
        Achievement(title="Curriculum Explorer", description="Achieved green status in 3 topics.", badge_icon="Compass", xp_reward=200)
    ]
    for b in badges:
        db.add(b)
    db.commit()
    print("Achievements seeded.")

    # 2. Create Users
    # Student Demo (credentials: student@learnbridge.edu / student123)
    student_pwd = hash_password("student123")
    student = User(
        name="Alex Mercer",
        email="student@learnbridge.edu",
        password_hash=student_pwd,
        role="student",
        language="en",
        accessibility_settings={"font_size": "medium", "high_contrast": False, "lite_mode": False}
    )
    db.add(student)
    
    # Teacher Demo (credentials: teacher@learnbridge.edu / teacher123)
    teacher_pwd = hash_password("teacher123")
    teacher = User(
        name="Dr. Sarah Collins",
        email="teacher@learnbridge.edu",
        password_hash=teacher_pwd,
        role="teacher",
        language="en",
        accessibility_settings={"font_size": "medium", "high_contrast": False, "lite_mode": False}
    )
    db.add(teacher)
    db.commit()

    # Create Student Profile
    profile = StudentProfile(
        user_id=student.id,
        grade="college",
        explanation_preference="example",
        confidence_history=[]
    )
    db.add(profile)
    db.commit()
    print("Users and Student Profile seeded.")

    # 3. Create Subjects and Topics
    # Subject: Computer Science
    cs = Subject(name="Computer Science", description="Data structures, algorithms, and theory.")
    db.add(cs)
    db.commit()

    topics_dict = {
        "Array Fundamentals": Topic(subject_id=cs.id, name="Array Fundamentals", description="Introduction to lists, index access, and array operations."),
        "Recursion": Topic(subject_id=cs.id, name="Recursion", description="Defining recursive base cases, stacks, and recursive trees."),
        "Binary Search": Topic(subject_id=cs.id, name="Binary Search", description="Divide-and-conquer search in sorted collection arrays."),
        "Strings": Topic(subject_id=cs.id, name="Strings", description="Sequence of characters, concatenation, substrings, and matching patterns."),
        "Linked Lists": Topic(subject_id=cs.id, name="Linked Lists", description="Dynamic node sequences linked via pointers, singly and doubly linked."),
        "Stacks": Topic(subject_id=cs.id, name="Stacks", description="LIFO (Last In First Out) structure, push, pop, peek operations, and stack traces."),
        "Queues": Topic(subject_id=cs.id, name="Queues", description="FIFO (First In First Out) structure, enqueue, dequeue operations."),
        "Trees": Topic(subject_id=cs.id, name="Trees", description="Hierarchical tree nodes, binary search trees, traversal methods (DFS/BFS)."),
        "Graphs": Topic(subject_id=cs.id, name="Graphs", description="Network node vertices and edges, adjacency matrices, BFS and DFS pathfinding."),
        "Algorithms": Topic(subject_id=cs.id, name="Algorithms", description="Step-by-step logic, bubble sort, merge sort, Big-O analysis, divide and conquer.")
    }

    for t in topics_dict.values():
        db.add(t)
    db.commit()

    # Prerequisite Setup:
    prereqs = [
        TopicPrerequisite(topic_id=topics_dict["Recursion"].id, prerequisite_id=topics_dict["Array Fundamentals"].id),
        TopicPrerequisite(topic_id=topics_dict["Binary Search"].id, prerequisite_id=topics_dict["Array Fundamentals"].id),
        TopicPrerequisite(topic_id=topics_dict["Strings"].id, prerequisite_id=topics_dict["Array Fundamentals"].id),
        TopicPrerequisite(topic_id=topics_dict["Linked Lists"].id, prerequisite_id=topics_dict["Array Fundamentals"].id),
        TopicPrerequisite(topic_id=topics_dict["Stacks"].id, prerequisite_id=topics_dict["Linked Lists"].id),
        TopicPrerequisite(topic_id=topics_dict["Queues"].id, prerequisite_id=topics_dict["Linked Lists"].id),
        TopicPrerequisite(topic_id=topics_dict["Trees"].id, prerequisite_id=topics_dict["Linked Lists"].id),
        TopicPrerequisite(topic_id=topics_dict["Graphs"].id, prerequisite_id=topics_dict["Trees"].id),
        TopicPrerequisite(topic_id=topics_dict["Algorithms"].id, prerequisite_id=topics_dict["Array Fundamentals"].id)
    ]
    for p in prereqs:
        db.add(p)
    db.commit()
    print("Subjects, Topics, and Prerequisites seeded.")

    # 4. Seed Misconceptions
    misconceptions = [
        Misconception(
            topic_id=topics_dict["Recursion"].id,
            name="Forgets Base Case",
            description="The recursive function calls itself infinitely without terminating, leading to a stack overflow.",
            wrong_answer_pattern="recursion without end",
            remedial_explanation="Always define a base case condition first: if n <= 1: return 1. This prevents the stack from overflowing."
        ),
        Misconception(
            topic_id=topics_dict["Recursion"].id,
            name="Confuses Call Order",
            description="The student expects outputs in the order of the recursive trigger rather than the unwinding phase.",
            wrong_answer_pattern="first print is before",
            remedial_explanation="Remember that recursive calls execute inside a Stack. The last function called is the first to finish (LIFO)."
        ),
        Misconception(
            topic_id=topics_dict["Binary Search"].id,
            name="Calculates Mid with Overflow",
            description="Calculates mid as (low + high) // 2 which can overflow in low-level languages, instead of low + (high - low) // 2.",
            wrong_answer_pattern="low + high",
            remedial_explanation="In low-level compiled languages like Java/C++, use mid = low + (high - low) // 2 to avoid integer overflow bounds."
        )
    ]
    for m in misconceptions:
        db.add(m)
    db.commit()
    print("Misconceptions seeded.")

    # 5. Seed Quiz Questions
    questions = [
        # Array Fundamentals
        QuizQuestion(
            topic_id=topics_dict["Array Fundamentals"].id,
            question_text="What is the average time complexity to access an element in an array by its index?",
            question_type="MCQ",
            options=["O(1)", "O(n)", "O(log n)", "O(n log n)"],
            correct_answer="O(1)",
            explanation="Array elements occupy contiguous memory, so address lookup math is direct index * size, yielding O(1) time.",
            difficulty="easy"
        ),
        # Recursion
        QuizQuestion(
            topic_id=topics_dict["Recursion"].id,
            question_text="What happens when a recursive function has no base case condition?",
            question_type="MCQ",
            options=["Runs successfully", "Crashes with a Stack Overflow error", "Returns null", "Compiles into an infinite loop"],
            correct_answer="Crashes with a Stack Overflow error",
            explanation="Without a base case, recursive calls consume the call stack indefinitely until memory limit is exceeded, crashing with a Stack Overflow.",
            difficulty="easy"
        ),
        QuizQuestion(
            topic_id=topics_dict["Recursion"].id,
            question_text="Which data structure does the runtime engine use internally to track recursive calls?",
            question_type="MCQ",
            options=["Queue", "Stack", "Heap", "Graph"],
            correct_answer="Stack",
            explanation="The computer uses a call stack to keep track of execution return addresses and active scope frames (LIFO order).",
            difficulty="medium"
        ),
        QuizQuestion(
            topic_id=topics_dict["Recursion"].id,
            question_text="Write a recursive Python function to compute the n-th Fibonacci number. (Base cases: fib(0)=0, fib(1)=1)",
            question_type="CODING",
            options=[],
            correct_answer="def fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)",
            explanation="Fibonacci values arise from adding the two preceding terms recursively with two base cases: n=0 and n=1.",
            difficulty="hard"
        ),
        # Binary Search
        QuizQuestion(
            topic_id=topics_dict["Binary Search"].id,
            question_text="What is the key prerequisite condition before Binary Search can be applied to a collection array?",
            question_type="MCQ",
            options=["The array must be empty", "The array elements must be sorted", "The array must contain positive values only", "The array must be shuffled"],
            correct_answer="The array elements must be sorted",
            explanation="Binary search relies on interval-halving logic. Without elements sorted in order, mid checks cannot declare which direction to query next.",
            difficulty="easy"
        ),
        QuizQuestion(
            topic_id=topics_dict["Binary Search"].id,
            question_text="What is the worst-case time complexity of Binary Search on a sorted array of size n?",
            question_type="MCQ",
            options=["O(n)", "O(log n)", "O(1)", "O(n^2)"],
            correct_answer="O(log n)",
            explanation="At each search check, binary search discards half of the collection range, leading to logarithmic complexity: O(log n).",
            difficulty="medium"
        ),
        # Strings
        QuizQuestion(
            topic_id=topics_dict["Strings"].id,
            question_text="Which string matching algorithm runs in O(n + m) time complexity using patterns hashing?",
            question_type="MCQ",
            options=["Brute Force", "Rabin-Karp", "KMP", "Boyer-Moore"],
            correct_answer="Rabin-Karp",
            explanation="Rabin-Karp algorithm uses rolling hashes to find a pattern substring match in linear average time complexity.",
            difficulty="medium"
        ),
        # Linked Lists
        QuizQuestion(
            topic_id=topics_dict["Linked Lists"].id,
            question_text="What is the time complexity to insert a node at the head of a singly linked list?",
            question_type="MCQ",
            options=["O(1)", "O(n)", "O(log n)", "O(n^2)"],
            correct_answer="O(1)",
            explanation="Inserting at the head requires allocating a node, linking its next pointer to the current head, and updating head pointer. All operations run in O(1).",
            difficulty="easy"
        ),
        # Stacks
        QuizQuestion(
            topic_id=topics_dict["Stacks"].id,
            question_text="What order protocol is followed by Stack push and pop operations?",
            question_type="MCQ",
            options=["LIFO (Last In First Out)", "FIFO (First In First Out)", "LILO", "Random"],
            correct_answer="LIFO (Last In First Out)",
            explanation="A stack operates on a Last In First Out basis where elements are added and removed from the same endpoint.",
            difficulty="easy"
        ),
        # Queues
        QuizQuestion(
            topic_id=topics_dict["Queues"].id,
            question_text="Which queue operation inserts an element at the rear of the collection?",
            question_type="MCQ",
            options=["Enqueue", "Dequeue", "Push", "Pop"],
            correct_answer="Enqueue",
            explanation="Enqueue inserts elements at the rear, while Dequeue removes elements from the front of the Queue.",
            difficulty="easy"
        ),
        # Trees
        QuizQuestion(
            topic_id=topics_dict["Trees"].id,
            question_text="Which binary search tree traversal yields node keys in sorted ascending order?",
            question_type="MCQ",
            options=["Pre-order", "In-order", "Post-order", "Level-order"],
            correct_answer="In-order",
            explanation="In-order traversal visits left subtree, root, then right subtree, producing values in sorted ascending sequence.",
            difficulty="medium"
        ),
        # Graphs
        QuizQuestion(
            topic_id=topics_dict["Graphs"].id,
            question_text="Which algorithm searches a graph by expanding search nodes outwards level-by-level?",
            question_type="MCQ",
            options=["Depth-First Search (DFS)", "Breadth-First Search (BFS)", "Dijkstra", "Kruskal"],
            correct_answer="Breadth-First Search (BFS)",
            explanation="BFS uses a Queue to traverse neighbor vertices level-by-level, ensuring shortest path traversal in unweighted graphs.",
            difficulty="medium"
        ),
        # Algorithms
        QuizQuestion(
            topic_id=topics_dict["Algorithms"].id,
            question_text="Which sorting algorithm operates with O(n log n) worst-case time complexity using divide and conquer?",
            question_type="MCQ",
            options=["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"],
            correct_answer="Merge Sort",
            explanation="Merge Sort recursively divides arrays in halves, sorts them, and merges them, ensuring a worst-case O(n log n) time.",
            difficulty="easy"
        )
    ]
    for q in questions:
        db.add(q)
    db.commit()
    print("Quiz Questions seeded.")

    # 6. Seed Student Roster and Classroom details for the Teacher dashboard
    classroom = Class(
        name="Introduction to Computer Science (CS101)",
        teacher_id=teacher.id,
        description="Introduction to fundamental algorithms, data structures, and programming theory."
    )
    db.add(classroom)
    db.commit()

    db.add(ClassStudent(class_id=classroom.id, student_id=student.id))
    db.commit()

    mock_students = [
        User(name="Marcus Miller", email="marcus@learnbridge.edu", password_hash=student_pwd, role="student"),
        User(name="Jane Doe", email="jane@learnbridge.edu", password_hash=student_pwd, role="student"),
        User(name="Timothy Green", email="timothy@learnbridge.edu", password_hash=student_pwd, role="student")
    ]
    for ms in mock_students:
        db.add(ms)
    db.commit()

    for ms in mock_students:
        db.add(ClassStudent(class_id=classroom.id, student_id=ms.id))
        db.add(StudentProfile(user_id=ms.id, grade="college", explanation_preference="analogy"))
    db.commit()
    print("Classroom and students seeded.")

    # 7. Seed Student Historical Analytics
    # Alex Mercer (student.id)
    db.add(StudentTopicMastery(student_id=student.id, topic_id=topics_dict["Array Fundamentals"].id, mastery_score=85.0, status_color="green"))
    db.add(StudentTopicMastery(student_id=student.id, topic_id=topics_dict["Recursion"].id, mastery_score=35.0, status_color="red"))
    db.add(StudentTopicMastery(student_id=student.id, topic_id=topics_dict["Binary Search"].id, mastery_score=0.0, status_color="white"))
    db.add(StudentTopicMastery(student_id=student.id, topic_id=topics_dict["Strings"].id, mastery_score=60.0, status_color="yellow"))
    db.add(StudentTopicMastery(student_id=student.id, topic_id=topics_dict["Linked Lists"].id, mastery_score=0.0, status_color="white"))
    db.add(StudentTopicMastery(student_id=student.id, topic_id=topics_dict["Stacks"].id, mastery_score=0.0, status_color="white"))
    db.add(StudentTopicMastery(student_id=student.id, topic_id=topics_dict["Queues"].id, mastery_score=0.0, status_color="white"))
    db.add(StudentTopicMastery(student_id=student.id, topic_id=topics_dict["Trees"].id, mastery_score=0.0, status_color="white"))
    db.add(StudentTopicMastery(student_id=student.id, topic_id=topics_dict["Graphs"].id, mastery_score=0.0, status_color="white"))
    db.add(StudentTopicMastery(student_id=student.id, topic_id=topics_dict["Algorithms"].id, mastery_score=0.0, status_color="white"))

    # Seed some fingerprints for recursion struggles
    db.add(ConfusionFingerprint(
        student_id=student.id,
        topic_id=topics_dict["Recursion"].id,
        primary_issue="Forgets Base Case",
        secondary_issue="Recursive call order",
        preferred_strategy="example",
        calibration="overconfident",
        severity_percentage=65.0,
        misconceptions_matched=[misconceptions[0].id]
    ))

    # Add recommendations
    db.add(LearningRecommendation(
        student_id=student.id,
        topic_id=topics_dict["Recursion"].id,
        title="Escalate Practice: Recursion Base Case",
        recommendation_text="Focus on base case conditions. Try implementing 3 simple recursive loops (factorial, array sum, power).",
        action_type="review",
        is_completed=False,
        scheduled_at=datetime.utcnow() + timedelta(days=1),
        interval_days=1
    ))

    # Earned initial achievements
    db.add(StudentAchievement(student_id=student.id, achievement_id=badges[0].id))

    # Seed other mock students' mastery for classroom radar visualization
    db.add(StudentTopicMastery(student_id=mock_students[0].id, topic_id=topics_dict["Recursion"].id, mastery_score=42.0, status_color="yellow"))
    db.add(ConfusionFingerprint(
        student_id=mock_students[0].id,
        topic_id=topics_dict["Recursion"].id,
        primary_issue="Confuses Call Order",
        preferred_strategy="analogy",
        calibration="underconfident",
        severity_percentage=58.0,
        misconceptions_matched=[misconceptions[1].id]
    ))

    db.add(StudentTopicMastery(student_id=mock_students[1].id, topic_id=topics_dict["Recursion"].id, mastery_score=28.0, status_color="red"))
    db.add(ConfusionFingerprint(
        student_id=mock_students[1].id,
        topic_id=topics_dict["Recursion"].id,
        primary_issue="Forgets Base Case",
        preferred_strategy="visual",
        calibration="accurate",
        severity_percentage=72.0,
        misconceptions_matched=[misconceptions[0].id]
    ))

    db.add(StudentTopicMastery(student_id=mock_students[2].id, topic_id=topics_dict["Recursion"].id, mastery_score=31.0, status_color="red"))
    db.add(ConfusionFingerprint(
        student_id=mock_students[2].id,
        topic_id=topics_dict["Recursion"].id,
        primary_issue="Forgets Base Case",
        preferred_strategy="example",
        calibration="overconfident",
        severity_percentage=69.0,
        misconceptions_matched=[misconceptions[0].id]
    ))
    db.commit()
    print("Historical student analytics seeded.")

    # 8. Seed Interventions Recommendations
    intv = Intervention(
        teacher_id=teacher.id,
        class_id=classroom.id,
        topic_id=topics_dict["Recursion"].id,
        title="Clarify Base Cases in Recursion",
        issue_description="3 students are experiencing stack overflow crashes due to missing base case definitions in recursive functions.",
        suggested_action="Review recursion call loops visually with a stack drawing exercise and print debugging statements.",
        action_materials=["https://learnbridge.ai/materials/recursion_callstack_slides.pdf", "Interactive Visual Stack tracing sandbox"],
        affected_students=[
            {"id": student.id, "name": student.name},
            {"id": mock_students[1].id, "name": mock_students[1].name},
            {"id": mock_students[2].id, "name": mock_students[2].name}
        ],
        status="pending"
    )
    db.add(intv)
    db.commit()

    # 9. Seed Financial Aid & Scholarships
    scholarships = [
        Scholarship(
            name="Central Sector Scheme of Scholarship",
            provider="Ministry of Education, Government of India",
            grade_criteria="college",
            income_criteria=450000,
            category_criteria="merit",
            region_criteria="National",
            field_criteria="CS",
            award_amount=20000.0,
            required_documents=["Aadhaar Card", "Income Certificate", "Academic Marksheets", "Bank Passbook"],
            deadline=datetime.utcnow() + timedelta(days=60),
            official_link="https://scholarships.gov.in"
        ),
        Scholarship(
            name="Karnataka Post-Matric Scholarship",
            provider="Department of Higher Education, Karnataka",
            grade_criteria="college",
            income_criteria=250000,
            category_criteria="need",
            region_criteria="Karnataka",
            award_amount=15000.0,
            required_documents=["Income Certificate", "Domicile Certificate", "College Fee Receipt", "Aadhaar Card"],
            deadline=datetime.utcnow() + timedelta(days=45),
            official_link="https://scholarships.gov.in"
        ),
        Scholarship(
            name="Pragati Scholarship Scheme for Girl Students",
            provider="AICTE, Government of India",
            grade_criteria="college",
            income_criteria=800000,
            category_criteria="merit",
            region_criteria="National",
            field_criteria="CS",
            award_amount=50000.0,
            required_documents=["AICTE Admission Letter", "Aadhaar Card", "Income Certificate", "Bonafide Student Certificate"],
            deadline=datetime.utcnow() + timedelta(days=30),
            official_link="https://scholarships.gov.in"
        ),
        Scholarship(
            name="Tamil Nadu Post-Matric Scholarship",
            provider="Department of Backward Classes Welfare, Tamil Nadu",
            grade_criteria="college",
            income_criteria=250000,
            category_criteria="need",
            region_criteria="Tamilnadu",
            award_amount=18000.0,
            required_documents=["Income Certificate", "Tamil Nadu Domicile Certificate", "College Fee Receipt", "Aadhaar Card"],
            deadline=datetime.utcnow() + timedelta(days=40),
            official_link="https://scholarships.gov.in"
        ),
        Scholarship(
            name="National Fellowship for Students with Disabilities",
            provider="Ministry of Social Justice and Empowerment, Government of India",
            grade_criteria="college",
            income_criteria=600000,
            category_criteria="disability",
            region_criteria="National",
            award_amount=40000.0,
            required_documents=["Disability Certificate", "Income Certificate", "Aadhaar Card", "College Admission Proof"],
            deadline=datetime.utcnow() + timedelta(days=50),
            official_link="https://scholarships.gov.in"
        )
    ]
    for s in scholarships:
        db.add(s)
    db.commit()
    print("Scholarships seeded.")

    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
