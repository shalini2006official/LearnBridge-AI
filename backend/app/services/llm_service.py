import requests
import logging
from typing import Optional, Dict, Any, List
from app.config import settings

logger = logging.getLogger("learnbridge.llm_service")

class LLMService:
    def __init__(self):
        self.api_key = settings.LLM_API_KEY
        self.model = settings.LLM_MODEL
        self.base_url = settings.LLM_BASE_URL
        self.ollama_host = settings.OLLAMA_HOST
        self.ollama_model = settings.OLLAMA_MODEL

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Attempts generation using Cloud LLM first with retries on rate limits (429),
        falling back to local Ollama, and finally using OfflineFallbackService if both are offline.
        """
        import time
        max_retries = 3
        backoff = 2.0

        # 1. Try Cloud LLM Service if API Key is configured
        if self.api_key:
            for attempt in range(max_retries):
                try:
                    # Default to Google Gemini generateContent if base_url is blank or contains googleapis
                    if not self.base_url or "googleapis.com" in self.base_url:
                        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
                        payload = {
                            "contents": [{
                                "parts": [{"text": f"{system_prompt}\n\n{prompt}" if system_prompt else prompt}]
                            }]
                        }
                        response = requests.post(url, headers={"Content-Type": "application/json"}, json=payload, timeout=20)
                        if response.status_code == 200:
                            res_json = response.json()
                            text = res_json['candidates'][0]['content']['parts'][0]['text']
                            return text.strip()
                        elif response.status_code == 429:
                            logger.warning(f"Gemini API rate limited (429). Retrying in {backoff}s (Attempt {attempt+1}/{max_retries})...")
                            time.sleep(backoff)
                            backoff *= 2
                        else:
                            logger.error(f"Gemini API returned error {response.status_code}: {response.text[:200]}")
                            break
                    
                    # Otherwise try OpenAI-compatible endpoint
                    else:
                        headers = {
                            "Content-Type": "application/json",
                            "Authorization": f"Bearer {self.api_key}"
                        }
                        payload = {
                            "model": self.model,
                            "messages": [
                                {"role": "system", "content": system_prompt or "You are an AI Tutor."},
                                {"role": "user", "content": prompt}
                            ]
                        }
                        response = requests.post(self.base_url, headers=headers, json=payload, timeout=20)
                        if response.status_code == 200:
                            res_json = response.json()
                            text = res_json['choices'][0]['message']['content']
                            return text.strip()
                        elif response.status_code == 429:
                            logger.warning(f"OpenAI-compatible API rate limited (429). Retrying in {backoff}s...")
                            time.sleep(backoff)
                            backoff *= 2
                        else:
                            logger.error(f"OpenAI-compatible API returned error {response.status_code}: {response.text[:200]}")
                            break
                except Exception as e:
                    logger.warning(f"Cloud LLM Service connection failed: {e}. Trying next option...")
                    break

        # 2. Try Ollama local service
        try:
            url = f"{self.ollama_host}/api/generate"
            payload = {
                "model": self.ollama_model,
                "prompt": prompt,
                "stream": False
            }
            if system_prompt:
                payload["system"] = system_prompt
            response = requests.post(url, json=payload, timeout=20)
            if response.status_code == 200:
                result = response.json()
                return result.get("response", "").strip()
        except Exception as e:
            logger.warning(f"Ollama local service connection failed: {e}.")

        # 3. Fallback to offline rule-based service
        logger.warning("All active LLM providers are offline. Triggering OfflineFallbackService.")
        from app.services.ai_service import OfflineFallbackService
        fallback = OfflineFallbackService()
        return fallback.generate(prompt, system_prompt)

    def generate_explanation(self, topic: str, strategy: str, question: str, language: str = "en") -> str:
        prompt = (
            f"Question: {question}\n"
            f"Topic: {topic}\n"
            f"Strategy: {strategy}\n"
            f"Language: {language}\n\n"
            f"Explain the topic '{topic}' using the strategy '{strategy}' for question: '{question}'."
        )
        return self.generate(prompt)

    def generate_example(self, topic: str) -> str:
        prompt = f"Provide a detailed, practical, real-world analogical example for the topic: '{topic}'."
        return self.generate(prompt)

    def generate_quiz(self, topic: str, num_questions: int, difficulty: str) -> str:
        prompt = (
            f"Generate {num_questions} multiple choice questions for the topic '{topic}' at a '{difficulty}' difficulty. "
            f"Format response as a JSON array of objects with keys: question_text, options, correct_answer, explanation, difficulty."
        )
        return self.generate(prompt)

    def generate_hint(self, question: str, current_answer: str) -> str:
        prompt = f"Provide a subtle, supportive pedagogical hint for this question: '{question}' given the student's current draft answer: '{current_answer}'."
        return self.generate(prompt)

    def generate_notes(self, topic: str, notes_style: str) -> str:
        prompt = (
            f"Generate comprehensive study notes for the topic '{topic}' in the style of '{notes_style}' notes. "
            f"Include Title, Quick Definition, Key Concepts, Important Rules, Code/Syntax Examples, Visual/Ascii-diagram trace, "
            f"Common Mistakes, and 3 Interview Questions with Answers."
        )
        return self.generate(prompt)

    def generate_summary(self, content: str) -> str:
        prompt = f"Summarize the following educational content concisely:\n\n{content}"
        return self.generate(prompt)

    def generate_video_script(self, topic: str) -> str:
        prompt = (
            f"Create a 5-scene visual teaching animation script flow for the topic '{topic}'. "
            f"Format as a JSON array of objects with keys: scene_number, title, scene_narration, scene_action_description, question_prompt (optional MCQ question to prompt intermediate response)."
        )
        return self.generate(prompt)

    def generate_teacher_insight(self, class_mastery_data: str) -> str:
        prompt = f"Generate teacher analytics insights for this classroom performance summary data: {class_mastery_data}"
        return self.generate(prompt)

    def evaluate_teach_back(self, explanation: str, student_response: str) -> str:
        prompt = (
            f"Tutor explanation: {explanation}\n"
            f"Student teach-back response: {student_response}\n\n"
            f"Grade the student explanation on completeness (0-100), identify detected conceptual gaps, and provide supportive feedback. "
            f"Format strictly as a JSON object with keys: score, detected_gaps (list), evaluation_feedback."
        )
        return self.generate(prompt)

    def translate_content(self, text: str, target_lang: str) -> str:
        prompt = f"Translate the following educational text into {target_lang} language, keeping technical terms in English:\n\n{text}"
        return self.generate(prompt)

    def research_topic(self, topic: str) -> str:
        prompt = (
            f"Perform detailed educational search research for the topic '{topic}'. "
            f"Define its category, 5 sequential sub-topics, prerequisites, and real sources. "
            f"Format as a JSON object with keys: classification, learning_path, sources (list of objects with keys title, url)."
        )
        return self.generate(prompt)

llm_service = LLMService()
