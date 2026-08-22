import json
import logging
from typing import Dict, Any, List, Optional
from app.config import settings

logger = logging.getLogger("learnbridge.ai_service")

class OfflineFallbackService:
    """
    Upgraded offline rule-based service that returns accurate, topic-specific
    data in the exact format required (Markdown for notes, JSON arrays/objects
    for quizzes, scripts, and evaluations) to prevent raw JSON leaks.
    """
    def get_gfg_link(self, topic_name: str) -> str:
        gfg_mappings = {
            "recursion": "[GeeksforGeeks - Recursion](https://www.geeksforgeeks.org/recursion/)",
            "binary search": "[GeeksforGeeks - Binary Search](https://www.geeksforgeeks.org/binary-search/)",
            "array fundamentals": "[GeeksforGeeks - Array Data Structure](https://www.geeksforgeeks.org/array-data-structure/)",
            "strings": "[GeeksforGeeks - String Data Structure](https://www.geeksforgeeks.org/string-data-structure/)",
            "linked lists": "[GeeksforGeeks - Linked List Data Structure](https://www.geeksforgeeks.org/linked-list-data-structure/)",
            "stacks": "[GeeksforGeeks - Stack Data Structure](https://www.geeksforgeeks.org/stack-data-structure/)",
            "queues": "[GeeksforGeeks - Queue Data Structure](https://www.geeksforgeeks.org/queue-data-structure/)",
            "trees": "[GeeksforGeeks - Tree Data Structure](https://www.geeksforgeeks.org/tree-data-structure/)",
            "graphs": "[GeeksforGeeks - Graph Data Structure](https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/)",
            "algorithms": "[GeeksforGeeks - Fundamentals of Algorithms](https://www.geeksforgeeks.org/fundamentals-of-algorithms/)"
        }
        name_lower = topic_name.lower()
        for key, link in gfg_mappings.items():
            if key in name_lower or name_lower in key:
                return link
        clean_name = topic_name.replace(" ", "+")
        return f"[GeeksforGeeks - {topic_name.title()}](https://www.geeksforgeeks.org/search?q={clean_name})"

    def get_yt_link(self, topic_name: str) -> str:
        yt_mappings = {
            "recursion": "[YouTube - Recursion Tutorial](https://www.youtube.com/results?search_query=recursion+programming+tutorial)",
            "binary search": "[YouTube - Binary Search Tutorial](https://www.youtube.com/results?search_query=binary+search+programming+tutorial)",
            "array fundamentals": "[YouTube - Array Fundamentals Tutorial](https://www.youtube.com/results?search_query=array+data+structure+tutorial)",
            "strings": "[YouTube - Strings Tutorial](https://www.youtube.com/results?search_query=strings+programming+tutorial)",
            "linked lists": "[YouTube - Linked Lists Tutorial](https://www.youtube.com/results?search_query=linked+list+data+structure+tutorial)",
            "stacks": "[YouTube - Stack Tutorial](https://www.youtube.com/results?search_query=stack+data+structure+tutorial)",
            "queues": "[YouTube - Queue Tutorial](https://www.youtube.com/results?search_query=queue+data+structure+tutorial)",
            "trees": "[YouTube - Tree Data Structure Tutorial](https://www.youtube.com/results?search_query=tree+data+structure+tutorial)",
            "graphs": "[YouTube - Graph Data Structure Tutorial](https://www.youtube.com/results?search_query=graph+data+structure+tutorial)",
            "algorithms": "[YouTube - Algorithms Course](https://www.youtube.com/results?search_query=algorithms+programming+course)"
        }
        name_lower = topic_name.lower()
        for key, link in yt_mappings.items():
            if key in name_lower or name_lower in key:
                return link
        clean_name = topic_name.replace(" ", "+")
        return f"[YouTube - {topic_name.title()} Video](https://www.youtube.com/results?search_query={clean_name}+tutorial)"

    def __init__(self):
        # Seeded bank of detailed responses for all 10 core topics
        self.topic_database = {
            "recursion": {
                "definition": "Recursion is a programming technique where a function calls itself directly or indirectly to solve a problem by breaking it down into smaller instances.",
                "technical": "Recursion consists of a base case and a recursive step. Time complexity is typically O(2^n) for branch recursion (like Fibonacci) or O(n) for linear recursion. Space complexity is O(n) due to stack frames.",
                "analogy": "Recursion is like Russian Matryoshka nesting dolls: to find the candy inside the smallest doll (the base case), you must open each outer doll one by one. Once found, you close them back up.",
                "example": "```python\ndef factorial(n):\n    if n <= 1: return 1\n    return n * factorial(n - 1)\n```",
                "visual": "factorial(3)\n  => 3 * factorial(2)\n    => 2 * factorial(1) -> returns 1\n    => 2 * 1 = 2\n  => 3 * 2 = 6",
                "mistake": "Forgetting the base case, which results in infinite recursion and a Stack Overflow error.",
                "citation": ""
            },
            "binary search": {
                "definition": "Binary Search is an O(log n) search algorithm that finds the position of a target value within a sorted array by repeatedly dividing the search interval in half.",
                "technical": "Requires a sorted array. Pointers low and high track the search range. Mid is calculated as low + (high - low) // 2.",
                "analogy": "Searching for a word in a physical dictionary: open it in the middle, check if the word is in the first or second half, throw away the other half, and repeat.",
                "example": "```python\ndef binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = low + (high - low) // 2\n        if arr[mid] == target: return mid\n        elif arr[mid] < target: low = mid + 1\n        else: high = mid - 1\n    return -1\n```",
                "visual": "Array: [1, 3, 5, 7, 9], Target: 7\n- Step 1: low=0, high=4, mid=2 (val=5) < 7 => low=3\n- Step 2: low=3, high=4, mid=3 (val=7) == 7 => Found index 3!",
                "mistake": "Calculating mid as (low + high) // 2, which can cause integer overflow in static-typed languages.",
                "citation": ""
            },
            "array fundamentals": {
                "definition": "An array is a data structure consisting of a collection of elements, each identified by at least one array index, stored in contiguous memory.",
                "technical": "Indices start at 0. Access is O(1). Insertion/Deletion is O(n) because elements must be shifted in memory.",
                "analogy": "A row of numbered lockers next to each other. If you know the locker number, you can open it instantly.",
                "example": "```python\n# Array initialization & access\nscores = [90, 85, 78, 92]\nfirst_score = scores[0]  # O(1) access\nscores.append(88)       # Add to end\n```",
                "visual": "Indices:  [ 0 ][ 1 ][ 2 ][ 3 ]\nMemory:   [101][102][103][104]\nElements: [ 90][ 85][ 78][ 92]",
                "mistake": "Off-by-one errors (accessing index len(arr) which causes IndexOutOfBounds).",
                "citation": ""
            },
            "strings": {
                "definition": "A string is a sequence of characters, typically used to represent text. In many languages, strings are immutable.",
                "technical": "Strings are arrays of characters. Access is O(1). Substring operations typically run in O(n) time.",
                "analogy": "A bead necklace where each bead represents a character. You can read the beads in order but cannot change them without making a new necklace.",
                "example": "```python\n# String operations\ntext = \"LearnBridge\"\nprefix = text[:5]   # \"Learn\"\nupper_text = text.upper()\n```",
                "visual": "Indices:    [0][1][2][3][4][5][6][7][8][9][10]\nCharacters: [L][e][a][r][n][B][r][i][d][g][e]",
                "mistake": "Attempting to modify characters directly (e.g. text[0] = 'l' raises TypeError in Python).",
                "citation": ""
            },
            "linked lists": {
                "definition": "A linked list is a linear data structure where elements (nodes) are stored in separate objects, connected sequentially by pointers.",
                "technical": "Dynamic size. Insertion/Deletion is O(1) if pointer is known. Access is O(n) since we must traverse from head.",
                "analogy": "A treasure hunt game: each clue (node) tells you where to find the next clue. You must follow the chain to reach the end.",
                "example": "```python\nclass Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None\n```",
                "visual": "[ Head: 10 ] -> [ Next: 20 ] -> [ Next: 30 ] -> None",
                "mistake": "Losing references to list segments during node pointer reassignments, leading to memory leaks.",
                "citation": ""
            },
            "stacks": {
                "definition": "A stack is a linear data structure that follows the Last-In-First-Out (LIFO) protocol. Elements are inserted and removed from the same end.",
                "technical": "Operations: push (insert) in O(1), pop (remove) in O(1), peek (top element) in O(1). Access is O(n).",
                "analogy": "A stack of plates in a cafeteria: you can only add a new plate to the top, and you must take the top plate off first.",
                "example": "```python\n# Stack implementation\nstack = []\nstack.append(10)      # Push\ntop_val = stack.pop() # Pop\n```",
                "visual": "|  30  | <-- Top\n|  20  |\n|  10  | <-- Bottom",
                "mistake": "Attempting to pop from an empty stack (Stack Underflow).",
                "citation": ""
            },
            "queues": {
                "definition": "A queue is a linear data structure that follows the First-In-First-Out (FIFO) protocol. Elements are added at the rear and removed from the front.",
                "technical": "Operations: enqueue (insert) in O(1), dequeue (remove) in O(1). Access is O(n). Utilizes front and rear pointers.",
                "analogy": "A line of people waiting for tickets: the first person to stand in line is the first one served and leaves first.",
                "example": "```python\nfrom collections import deque\nqueue = deque()\nqueue.append(10)      # Enqueue\nfront = queue.popleft() # Dequeue\n```",
                "visual": "Front --> [ 10 ][ 20 ][ 30 ] <-- Rear",
                "mistake": "Using a standard list for queue dequeue (pop(0)), which runs in O(n) due to element shifting. Use deque.",
                "citation": ""
            },
            "trees": {
                "definition": "A tree is a non-linear hierarchical data structure consisting of nodes connected by edges, with a single root node.",
                "technical": "Includes binary trees, BSTs, and balanced AVL trees. Access, search, and insertion run in O(log n) average complexity.",
                "analogy": "An organizational chart: CEO (root) leads managers (parent nodes), who oversee team members (leaf nodes).",
                "example": "```python\nclass TreeNode:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None\n```",
                "visual": "      [ 10 ] <-- Root\n     /      \\\n  [ 5 ]    [ 15 ]",
                "mistake": "Unbalanced binary search trees degrading to linked lists, increasing search complexity to O(n).",
                "citation": ""
            },
            "graphs": {
                "definition": "A graph is a non-linear data structure consisting of vertices (nodes) and edges that connect vertices. Can be directed or undirected.",
                "technical": "Represented by Adjacency List or Matrix. Searched using DFS (Stack/Recursion) or BFS (Queue).",
                "analogy": "A social network: vertices are people, and edges are friendships. Flights between cities are vertices and routes.",
                "example": "```python\n# Adjacency list graph representation\ngraph = {\n    'A': ['B', 'C'],\n    'B': ['A', 'D'],\n    'C': ['A'],\n    'D': ['B']\n}\n```",
                "visual": "  A --- B\n  |     |\n  C     D",
                "mistake": "Forgetting to track visited nodes during BFS/DFS, resulting in infinite loops in cyclic graphs.",
                "citation": ""
            },
            "algorithms": {
                "definition": "An algorithm is a step-by-step procedure or set of rules to be followed in calculations or other problem-solving operations.",
                "technical": "Analyzed using Big-O notation. Commonly categorizes sorting, searching, divide-and-conquer, dynamic programming, and greedy algorithms.",
                "analogy": "A cooking recipe: follow the steps in order to turn raw ingredients into a finished dish.",
                "example": "```python\n# Linear Search Algorithm\ndef linear_search(arr, val):\n    for idx, x in enumerate(arr):\n        if x == val: return idx\n    return -1\n```",
                "visual": "Input: [4, 2, 8] => Algorithm (Sort) => Output: [2, 4, 8]",
                "mistake": "Optimizing micro-details of code instead of choosing the correct algorithmic complexity class (e.g. using Bubble Sort instead of Merge Sort).",
                "citation": ""
            }
        }
        
        # Seed Java, C++, and C alternative examples for the offline database
        self.topic_database["recursion"]["example_java"] = "```java\nint factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n```"
        self.topic_database["recursion"]["example_cpp"] = "```cpp\nint factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n```"
        self.topic_database["recursion"]["example_c"] = "```c\nint factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n```"

        self.topic_database["binary search"]["example_java"] = "```java\nint binarySearch(int[] arr, int target) {\n    int low = 0, high = arr.length - 1;\n    while (low <= high) {\n        int mid = low + (high - low) / 2;\n        if (arr[mid] == target) return mid;\n        else if (arr[mid] < target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}\n```"
        self.topic_database["binary search"]["example_cpp"] = "```cpp\nint binarySearch(std::vector<int>& arr, int target) {\n    int low = 0, high = arr.size() - 1;\n    while (low <= high) {\n        int mid = low + (high - low) / 2;\n        if (arr[mid] == target) return mid;\n        else if (arr[mid] < target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}\n```"
        self.topic_database["binary search"]["example_c"] = "```c\nint binarySearch(int arr[], int size, int target) {\n    int low = 0, high = size - 1;\n    while (low <= high) {\n        int mid = low + (high - low) / 2;\n        if (arr[mid] == target) return mid;\n        else if (arr[mid] < target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}\n```"

        self.topic_database["array fundamentals"]["example_java"] = "```java\nint[] scores = {90, 85, 78, 92};\nint firstScore = scores[0]; // O(1) access\n```"
        self.topic_database["array fundamentals"]["example_cpp"] = "```cpp\nstd::vector<int> scores = {90, 85, 78, 92};\nint firstScore = scores[0]; // O(1) access\n```"
        self.topic_database["array fundamentals"]["example_c"] = "```c\nint scores[] = {90, 85, 78, 92};\nint firstScore = scores[0]; // O(1) access\n```"

        self.topic_database["strings"]["example_java"] = "```java\nString text = \"LearnBridge\";\nString prefix = text.substring(0, 5); // \"Learn\"\n```"
        self.topic_database["strings"]["example_cpp"] = "```cpp\nstd::string text = \"LearnBridge\";\nstd::string prefix = text.substr(0, 5); // \"Learn\"\n```"
        self.topic_database["strings"]["example_c"] = "```c\nchar text[] = \"LearnBridge\";\n// Access char elements\n```"

        self.topic_database["linked lists"]["example_java"] = "```java\nclass Node {\n    int val;\n    Node next;\n    Node(int val) { this.val = val; }\n}\n```"
        self.topic_database["linked lists"]["example_cpp"] = "```cpp\nstruct Node {\n    int val;\n    Node* next;\n    Node(int v) : val(v), next(nullptr) {}\n};\n```"
        self.topic_database["linked lists"]["example_c"] = "```c\nstruct Node {\n    int val;\n    struct Node* next;\n};\n```"

        self.topic_database["stacks"]["example_java"] = "```java\nStack<Integer> stack = new Stack<>();\nstack.push(10);\nint topVal = stack.pop();\n```"
        self.topic_database["stacks"]["example_cpp"] = "```cpp\nstd::stack<int> stack;\nstack.push(10);\nint topVal = stack.top(); stack.pop();\n```"
        self.topic_database["stacks"]["example_c"] = "```c\n// Array stack representation\nint stack[100];\nint top = -1;\nstack[++top] = 10; // push\nint val = stack[top--]; // pop\n```"

        for t_key in self.topic_database.keys():
            self.topic_database[t_key]["citation"] = f"{self.get_gfg_link(t_key)}, {self.get_yt_link(t_key)}"

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        prompt_lower = prompt.lower()
        
        # 1. Match topic: look specifically for "topic 'X'" pattern in prompt
        import re
        topic = "recursion"
        match = re.search(r"topic ['\"](.*?)['\"]", prompt, re.IGNORECASE)
        if not match:
            match = re.search(r"topic:\s*['\"](.*?)['\"]", prompt, re.IGNORECASE)
            
        if match:
            extracted_topic = match.group(1).strip()
            matched_key = None
            for t_name in self.topic_database.keys():
                if t_name == extracted_topic.lower() or t_name in extracted_topic.lower() or extracted_topic.lower() in t_name:
                    matched_key = t_name
                    break
            if matched_key:
                topic = matched_key
            else:
                topic = extracted_topic
        else:
            # Fallback keyword match
            for t_name in self.topic_database.keys():
                if t_name in prompt_lower:
                    topic = t_name
                    break

        # 2. Check prompt request type
        
        # A. Quiz Generation
        if "multiple choice question" in prompt_lower or "generate_quiz" in prompt_lower or "mcq" in prompt_lower:
            import re
            count = 5
            count_match = re.search(r"count\s*(\d+)", prompt_lower)
            if count_match:
                count = int(count_match.group(1))
            return self._generate_mock_quiz(topic, count)

        # B. Notes Generation
        elif "comprehensive study notes" in prompt_lower or "generate_notes" in prompt_lower or "study notes" in prompt_lower:
            return self._generate_mock_notes(topic, prompt)

        # C. Video Script Generation
        elif "video script" in prompt_lower or "animation script" in prompt_lower:
            return self._generate_mock_video_script(topic)

        # D. Research Topic Generation
        elif "search research" in prompt_lower or "research_topic" in prompt_lower:
            return self._generate_mock_research(topic)

        # E. Teach Back Evaluation
        elif "teach-back" in prompt_lower or "evaluate" in prompt_lower:
            return self._generate_mock_teachback(topic, prompt)

        # F. Doubt Explanation
        else:
            # Determine strategy
            strategy = "example"
            if "analogy" in prompt_lower:
                strategy = "analogy"
            elif "technical" in prompt_lower or "definition" in prompt_lower:
                strategy = "technical"
            elif "visual" in prompt_lower or "trace" in prompt_lower:
                strategy = "visual"

            is_custom = topic.lower() not in self.topic_database
            if is_custom:
                # Custom topic dynamic template
                explanation_text = (
                    f"### {topic.title()} - Explanation\n\n"
                    f"**Definition**: {topic.title()} is a fundamental concept. "
                    f"It represents a structured system, pattern, or process used to analyze and resolve challenges.\n\n"
                    f"**Real-world Analogy**: Imagine {topic.title()} like a structured sequence (like a recipe or set of mirror reflections). "
                    f"Following the correct order is essential to get the right outcome.\n\n"
                    f"**Step-by-Step Walkthrough**:\n"
                    f"1. Initialize the inputs or context for {topic.title()}.\n"
                    f"2. Apply the specific rules of {topic.title()}.\n"
                    f"3. Verify and return the final state/result.\n\n"
                    f"**Common Mistake**: Assuming {topic.title()} can scale infinitely without boundary checks.\n\n"
                    f"**Quick Check Question**: What is a primary objective of using {topic.title()}?"
                )
                
                if "tamil" in prompt_lower:
                    explanation_text = (
                        f"### {topic.title()} - Tamil Explanation\n\n"
                        f"**விளக்கம்**: {topic.title()} என்பது ஒரு முக்கிய கல்வி அல்லது தொழில்நுட்ப கருத்து ஆகும். "
                        f"இது சிக்கல்களைத் தீர்க்கப் பயன்படும் ஒரு படிநிலை செயல்முறை அல்லது அமைப்பைக் குறிக்கிறது.\n\n"
                        f"**உதாரணம்**: சமையல் குறிப்பு அல்லது ஒரு செயல்முறை வழிகாட்டி போன்றது. "
                        f"சரியான வரிசையைப் பின்பற்றுவது இறுதி முடிவை அடைய உதவும்.\n\n"
                        f"**English Reference**:\n{explanation_text}"
                    )
                
                response = {
                    "explanation": explanation_text,
                    "strategy": strategy,
                    "topic": topic.title(),
                    "citation": "LearnBridge Sources",
                    "is_grounded": True
                }
                return json.dumps(response)

            db_entry = self.topic_database[topic]
            
            # Check strategy mappings
            if strategy == "full_concept" or "full concept" in prompt_lower:
                lang_code = db_entry['example']
                if "java" in prompt_lower:
                    lang_code = db_entry.get('example_java', db_entry['example'])
                elif "c++" in prompt_lower or "cpp" in prompt_lower:
                    lang_code = db_entry.get('example_cpp', db_entry['example'])
                elif " c " in prompt_lower or prompt_lower.endswith(" c") or prompt_lower.startswith("c "):
                    lang_code = db_entry.get('example_c', db_entry['example'])

                explanation_text = (
                    f"### {topic.title()} - Comprehensive Full Concept Guide\n\n"
                    f"**1. Detailed Explanation & Conceptual Overview**\n"
                    f"{db_entry['definition']}\n\n"
                    f"This educational concept represents a fundamental block in computational system designs. By leveraging this structure, "
                    f"programs partition execution spaces, manage registers, and optimize resource access times dynamically. At the compiler level, "
                    f"elements are aligned logically so CPU registers can perform instruction pre-fetching and avoid caching delays, ensuring peak "
                    f"scalability and structural integrity under extensive user traffic.\n\n"
                    f"**2. Detailed Architectural Mechanics & Big-O Complexity Analysis**\n"
                    f"{db_entry['technical']}\n\n"
                    f"Operations are bound by standard mathematical scaling classes. Keeping data elements structured prevents CPU cache line eviction, "
                    f"greatly boosting performance over unaligned random pointer references.\n\n"
                    f"**3. Complete Code Syntax Implementation**\n"
                    f"{lang_code}\n\n"
                    f"**4. Real-world Industrial Applications**\n"
                    f"- *High-Performance Cache Alignments*: Used to map addresses quickly inside key-value database engines.\n"
                    f"- *Lexical Execution Scopes*: Tracks variables, call stack references, and bounds checks in modern compilers.\n"
                    f"- *Data Parsing Streams*: Buffers sequential packets dynamically without fragmentation overhead.\n\n"
                    f"**5. Crucial Best Practice & Mistakes to Avoid**\n"
                    f"Warning: {db_entry['mistake']}. Always maintain strict validation checks to prevent runtime errors.\n\n"
                    f"**6. Reference Resources & Tutorial Video Guides**\n"
                    f"- Written Guide: {self.get_gfg_link(topic)}\n"
                    f"- Video Guide: {self.get_yt_link(topic)}"
                )
            elif strategy == "technical":
                explanation_text = f"### {topic.title()} - Technical Explanation\n\n" + f"{db_entry['definition']}\n\n{db_entry['technical']}"
            elif strategy == "analogy":
                explanation_text = f"### {topic.title()} - Analogy Explanation\n\n" + f"{db_entry['definition']}\n\n**Analogy**: {db_entry['analogy']}"
            elif strategy == "visual":
                explanation_text = f"### {topic.title()} - Visual Explanation\n\n" + f"{db_entry['definition']}\n\n**Visual Representation**:\n```\n{db_entry['visual']}\n```"
            else:
                lang_code = db_entry['example']
                # Language selector mappings
                if "java" in prompt_lower:
                    lang_code = db_entry.get('example_java', db_entry['example'])
                elif "c++" in prompt_lower or "cpp" in prompt_lower:
                    lang_code = db_entry.get('example_cpp', db_entry['example'])
                elif " c " in prompt_lower or prompt_lower.endswith(" c") or prompt_lower.startswith("c "):
                    lang_code = db_entry.get('example_c', db_entry['example'])
                explanation_text = f"### {topic.title()} - Example Explanation\n\n" + f"{db_entry['definition']}\n\n**Code Example**:\n{lang_code}\n\n**Mistake to Avoid**: {db_entry['mistake']}"

            # Tamil mapping details
            if "tamil" in prompt_lower:
                tamil_defs = {
                    "recursion": "தன்னிலையியல்பு (Recursion) என்பது ஒரு சார்பு தன்னைத்தானே மீண்டும் அழைப்பதாகும். இது ஒரு சிக்கலை சிறிய பகுதிகளாக பிரிக்க உதவுகிறது.",
                    "binary search": "இருbinary தேடல் (Binary Search) என்பது வரிசைப்படுத்தப்பட்ட வரிசையிலிருந்து ஒரு உறுப்பைக் கண்டறியும் O(log n) வழிமுறையாகும்.",
                    "array fundamentals": "வரிசை (Array) என்பது தொடர்ச்சியான நினைவகத்தில் சேமிக்கப்படும் மாறிகளின் தொகுப்பாகும்.",
                    "strings": "சரம் (String) என்பது எழுத்துக்களின் வரிசையாகும்.",
                    "linked lists": "இணைக்கப்பட்ட பட்டியல் (Linked List) என்பது அடுத்தடுத்த முனைகளை சுட்டிக்காட்டும் ஒரு தரவு கட்டமைப்பாகும்.",
                    "stacks": "அடுக்கு (Stack) என்பது கடைசியாக உள்ளே முதலாவதாக வெளியே (LIFO) என்ற கொள்கையைக் கொண்டது.",
                    "queues": "வரிசை (Queue) என்பது முதலில் உள்ளே முதலாவதாக வெளியே (FIFO) என்ற கொள்கையைக் கொண்டது.",
                    "trees": "மரம் (Tree) என்பது ஒரு படிநிலை தரவு கட்டமைப்பாகும்.",
                    "graphs": "வரைபடம் (Graph) என்பது முனைகள் மற்றும் விளிம்புகளின் தொகுப்பாகும்.",
                    "algorithms": "வழிமுறை (Algorithm) என்பது ஒரு சிக்கலைத் தீர்ப்பதற்கான படிப்படியான செயல்முறையாகும்."
                }
                tamil_desc = tamil_defs.get(topic, "தரவு கட்டமைப்பின் விளக்கம்.")
                explanation_text = (
                    f"### {topic.title()} - Tamil Explanation\n\n"
                    f"**விளக்கம்**: {tamil_desc}\n\n"
                    f"**English Reference**:\n{explanation_text}"
                )

            response = {
                "explanation": explanation_text,
                "strategy": strategy,
                "topic": topic.title(),
                "citation": db_entry["citation"],
                "is_grounded": True
            }
            return json.dumps(response)

    def _generate_mock_quiz(self, topic: str, count: int = 5) -> str:
        templates = [
            {
                "question_text": "What is a core concept regarding the topic '{topic}'?",
                "options": [
                    "A) It is dynamically allocated in heap index units.",
                    "B) It is a key structure to organize data and optimize algorithms.",
                    "C) It cannot be analyzed with standard Big-O notation.",
                    "D) It executes in linear hardware cycles only."
                ],
                "correct_answer": "B) It is a key structure to organize data and optimize algorithms.",
                "explanation": "Understanding {topic} helps you select the correct memory and performance trade-offs in software development."
            },
            {
                "question_text": "Which of these is a common mistake when implementing '{topic}'?",
                "options": [
                    "A) Allocating unnecessary static buffers.",
                    "B) Missing boundaries, leading to IndexOutOfBounds or infinite runtime states.",
                    "C) Using camelCase variable notations.",
                    "D) Using standard object serialization classes."
                ],
                "correct_answer": "B) Missing boundaries, leading to IndexOutOfBounds or infinite runtime states.",
                "explanation": "Correct validation checks must be performed to maintain program termination and memory safety."
            },
            {
                "question_text": "What is the average lookup or operation cost for optimized implementations of '{topic}'?",
                "options": [
                    "A) O(1) or O(log n) average cost.",
                    "B) O(n^2) scaling cost.",
                    "C) O(n!) factorial cost.",
                    "D) Unbounded memory cost."
                ],
                "correct_answer": "A) O(1) or O(log n) average cost.",
                "explanation": "Well-designed lookup tables or tree systems yield logarithmic or constant execution bounds."
            },
            {
                "question_text": "How does '{topic}' behave under peak scalability workloads?",
                "options": [
                    "A) Memory allocations scale linearly with active references.",
                    "B) Thread execution drops to O(1) immediately.",
                    "C) The stack overflows automatically on every compiler run.",
                    "D) The operating system delegates indexing to local browser storage."
                ],
                "correct_answer": "A) Memory allocations scale linearly with active references.",
                "explanation": "Growth scales with active elements requiring dynamic references."
            },
            {
                "question_text": "What is the primary constraint to maintain when managing '{topic}' bounds?",
                "options": [
                    "A) Terminating boundary validation checks.",
                    "B) Forcing compiler garbage collection calls.",
                    "C) Restricting CPU temperature thresholds.",
                    "D) Eliminating variable scope names."
                ],
                "correct_answer": "A) Terminating boundary validation checks.",
                "explanation": "Boundary validation prevents buffer overflows and program crashes."
            }
        ]

        quiz_data = []
        for i in range(count):
            tmpl = templates[i % len(templates)]
            multiplier = f" (Variant {i // len(templates) + 1})" if i >= len(templates) else ""
            quiz_data.append({
                "question_text": tmpl["question_text"].format(topic=topic.title()) + multiplier,
                "options": tmpl["options"],
                "correct_answer": tmpl["correct_answer"],
                "explanation": tmpl["explanation"].format(topic=topic.lower()),
                "difficulty": "medium"
            })
        return json.dumps(quiz_data)

    def _generate_mock_notes(self, topic: str, prompt: str) -> str:
        db_entry = self.topic_database[topic]
        style = "Detailed"
        if "quick" in prompt.lower() or "revision" in prompt.lower():
            style = "Quick Cheat Sheet"
        elif "exam" in prompt.lower():
            style = "Exam Prep Guide"
        elif "interview" in prompt.lower():
            style = "Interview Questions"

        notes = f"""# Study Notes: {topic.title()} ({style} format)

## Quick Definition
{db_entry['definition']}

## Key Concepts
- **Core Principles**: {db_entry['technical']}
- **Analogy**: {db_entry['analogy']}

## Implementation Syntax Example
{db_entry['example']}

## Visual Execution Trace
```
{db_entry['visual']}
```

## Common Mistakes & Pitfalls
- **Crucial Warning**: {db_entry['mistake']}

## Study Q&A Checkpoint
1. **Q: What is the main design advantage of {topic.title()}?**
   *A: It allows structured memory storage or logarithmic execution limits depending on design details.*
2. **Q: How does this connect to computer science foundations?**
   *A: Relies directly on contiguous RAM index blocks or address pointer nodes mapped sequentially.*
3. **Q: What is the source documentation?**
   *A: Mapped from {db_entry['citation']}.*
"""
        return notes

    def _generate_mock_video_script(self, topic: str) -> str:
        if topic in self.topic_database:
            db_entry = self.topic_database[topic]
            definition = db_entry['definition']
            analogy = db_entry['analogy']
            technical = db_entry['technical']
            example = db_entry['example']
            mistake = db_entry['mistake']
            citation = db_entry['citation']
        else:
            definition = f"{topic.title()} is a fundamental educational topic, involving structured rules, relationships, and processes."
            analogy = f"Imagine {topic.title()} like a flowchart or set of steps: you follow the sequence logically to reach the desired state."
            technical = f"Governed by key system configurations, boundaries, and variables to ensure correct execution."
            example = f"# Walkthrough code for {topic.title()}\ndef run_process():\n    # Step 1: Initialize states\n    # Step 2: Execute operations"
            mistake = f"Forgetting boundary checks or input parameters for {topic.title()}."
            citation = "LearnBridge Academic Guide"

        script_data = [
            {
                "scene_number": 1,
                "title": f"Introducing {topic.title()}",
                "scene_narration": f"Welcome to LearnBridge AI. Today, we will explore {topic.title()}. {definition}",
                "scene_action_description": f"Visual animation demonstrating a high-level representation of {topic.title()}.",
                "question_prompt": None
            },
            {
                "scene_number": 2,
                "title": "Practical Analogy",
                "scene_narration": f"To understand this simply, think of it this way: {analogy}",
                "scene_action_description": "Everyday objects illustrating how the segments connect.",
                "question_prompt": None
            },
            {
                "scene_number": 3,
                "title": "Interactive Checkpoint",
                "scene_narration": f"Let's check your understanding. What is a key constraint or detail of {topic.title()}?",
                "scene_action_description": f"Displays checkpoint MCQ about {topic.title()}.",
                "question_prompt": {
                    "text": f"What is a primary characteristic of {topic.title()}?",
                    "options": [
                        "A) It is purely static and cannot scale.",
                        f"B) It is defined as: {technical[:80]}...",
                        "C) It executes in linear O(n^2) hardware threads.",
                        "D) It requires constant thread reboots."
                    ],
                    "correct": f"B) It is defined as: {technical[:80]}...",
                    "explanation": f"Correct! {technical}"
                }
            },
            {
                "scene_number": 4,
                "title": "Code Walkthrough",
                "scene_narration": f"Let's write some code or outline the process. This simple demonstration shows how it executes.",
                "scene_action_description": f"Presents active trace: {example}",
                "question_prompt": None
            },
            {
                "scene_number": 5,
                "title": "Visual Summary",
                "scene_narration": f"In summary, remember to avoid: {mistake}. This will lock in your fundamentals.",
                "scene_action_description": f"Visual summary displaying references to {citation}.",
                "question_prompt": None
            }
        ]
        return json.dumps(script_data)

    def _generate_mock_research(self, topic: str) -> str:
        if topic in self.topic_database:
            db_entry = self.topic_database[topic]
            classification = f"'{topic.title()}' is a core data structure and programming concept in Computer Science."
            mit_ocw = f"MIT OpenCourseWare - Introduction to Algorithms ({topic.title()})"
            wiki = f"Wikipedia - {topic.title()}"
            stanford = f"Stanford Computer Science Library Guide"
            wiki_url = f"https://en.wikipedia.org/wiki/{topic.replace(' ', '_')}"
        else:
            classification = f"'{topic.title()}' is a specialized concept in sciences, mathematics, or academic studies."
            mit_ocw = f"MIT OpenCourseWare - Lecture references for {topic.title()}"
            wiki = f"Wikipedia - {topic.title()}"
            stanford = f"Stanford Libraries Reference Search"
            wiki_url = f"https://en.wikipedia.org/wiki/{topic.replace(' ', '_')}"

        research_data = {
            "classification": classification,
            "learning_path": [
                f"Introduction to {topic.title()}",
                "Core Principles & Scope",
                "Practical Applications & Mappings",
                "Boundary Controls",
                "Advanced Problems & Solutions"
            ],
            "sources": [
                {"title": mit_ocw, "url": "https://ocw.mit.edu/"},
                {"title": wiki, "url": wiki_url},
                {"title": stanford, "url": "https://cs.stanford.edu/"}
            ]
        }
        return json.dumps(research_data)

    def _generate_mock_teachback(self, topic: str, prompt: str) -> str:
        # Extract student response
        student_resp = ""
        parts = prompt.split("Student teach-back response:")
        if len(parts) > 1:
            student_resp = parts[1].strip()
        
        student_lower = student_resp.lower()
        score = 80.0
        gaps = []
        feedback = "Great job! You explained the basic concept accurately."

        db_entry = self.topic_database[topic]
        
        # Crude checks to detect gaps
        if len(student_lower) < 15:
            score = 30.0
            gaps.append("Explanation is too brief; missing details.")
            feedback = "Your explanation is very short. Let's try adding examples or analogies."
        else:
            # Topic specific checks
            if topic == "recursion":
                if "base" not in student_lower:
                    gaps.append("Missed base case/termination conditions.")
                    score -= 25
            elif topic == "binary search":
                if "sorted" not in student_lower:
                    gaps.append("Missed array sorted condition requirement.")
                    score -= 25
            elif topic == "linked lists":
                if "pointer" not in student_lower and "node" not in student_lower:
                    gaps.append("Missed node pointer details.")
                    score -= 25

        if gaps:
            feedback = f"Good start, but you missed: {', '.join(gaps)}. Consider strategy shifts to review."

        eval_data = {
            "score": float(max(score, 10.0)),
            "detected_gaps": gaps if gaps else ["None! Excellent understanding."],
            "evaluation_feedback": feedback
        }
        return json.dumps(eval_data)

class AIService:
    """
    Orchestrates the active LLM implementation, switching between secure Cloud/Local LLMs and Offline fallback.
    """
    def __init__(self):
        self.ai_active = bool(settings.LLM_API_KEY)
        if not self.ai_active:
            try:
                res = requests.get(settings.OLLAMA_HOST, timeout=2)
                if res.status_code == 200:
                    self.ai_active = True
            except Exception:
                pass
        
        if self.ai_active:
            logger.info("Initializing AIService: Active LLM provider detected.")
        else:
            logger.warning("Initializing AIService: No active LLM provider found. Falling back to Demo Mode.")

    def generate_explanation(self, prompt: str, strategy: str = "example", topic_name: str = "recursion") -> Dict[str, Any]:
        """
        Generates explanation and structured metadata for the tutors.
        """
        from app.services.llm_service import llm_service
        if self.ai_active:
            try:
                system_prompt = (
                    f"You are LearnBridge AI, an expert adaptive tutor explaining the topic '{topic_name}' "
                    f"using the '{strategy}' teaching strategy. You must output a JSON object containing "
                    f"keys 'explanation', 'strategy', 'topic', 'citation', and 'is_grounded'."
                )
                raw_response = llm_service.generate(prompt, system_prompt)
                try:
                    cleaned = raw_response.strip()
                    if cleaned.startswith("```json"):
                        cleaned = cleaned[7:]
                    if cleaned.endswith("```"):
                        cleaned = cleaned[:-3]
                    return json.loads(cleaned.strip())
                except Exception:
                    return {
                        "explanation": raw_response,
                        "strategy": strategy,
                        "topic": topic_name,
                        "citation": "Retrieved Vector Base Context",
                        "is_grounded": True
                    }
            except Exception:
                logger.warning("LLM call failed during run. Temporarily switching to Offline Fallback.")
                fallback = OfflineFallbackService()
                return json.loads(fallback.generate(prompt))
        else:
            fallback = OfflineFallbackService()
            fallback_res = fallback.generate(f"Topic: {topic_name}, Strategy: {strategy}, Prompt: {prompt}")
            return json.loads(fallback_res)

    def evaluate_teach_back(self, explanation: str, student_response: str) -> Dict[str, Any]:
        """
        Evaluates Feynman Teach-Back submission.
        """
        from app.services.llm_service import llm_service
        if self.ai_active:
            try:
                prompt = (
                    f"Tutor explanation: {explanation}\n"
                    f"Student teach-back response: {student_response}\n\n"
                    f"Analyze the student response. Grade it on completeness/accuracy (0-100), identify specific cognitive gaps, "
                    f"and write a short supportive evaluation feedback text. Output format MUST be a JSON object with keys "
                    f"'score' (float), 'detected_gaps' (list of strings), and 'evaluation_feedback' (string)."
                )
                raw_response = llm_service.generate(prompt)
                try:
                    cleaned = raw_response.strip()
                    if cleaned.startswith("```json"):
                        cleaned = cleaned[7:]
                    if cleaned.endswith("```"):
                        cleaned = cleaned[:-3]
                    return json.loads(cleaned.strip())
                except Exception:
                    pass
            except Exception as e:
                logger.warning(f"AI teach-back call failed: {e}")
        
        fallback = OfflineFallbackService()
        prompt_str = f"Tutor explanation: {explanation}\nStudent teach-back response: {student_response}"
        return json.loads(fallback._generate_mock_teachback("recursion", prompt_str))

# Singleton instance
ai_service = AIService()
import requests # Ensure requests is imported at module level
