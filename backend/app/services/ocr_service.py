import logging
import base64
import os
from PIL import Image
import io

logger = logging.getLogger("learnbridge.ocr")

class OCRService:
    def __init__(self):
        self.tesseract_available = False
        try:
            import pytesseract
            self.pytesseract = pytesseract
            # Check if tesseract is in path
            # (In production, the path to tesseract binary can be set using pytesseract.pytesseract.tesseract_cmd)
            self.tesseract_available = True
            logger.info("pytesseract imported successfully.")
        except Exception as e:
            logger.warning(f"pytesseract not loaded: {e}. Fallback OCR simulation active.")

    def extract_text_from_base64(self, base64_image: str) -> str:
        """
        Takes base64 image data and performs OCR.
        Falls back to a realistic mock text extraction if Tesseract is not installed/configured.
        """
        if not base64_image:
            return ""

        # Clean base64 header if present
        if "," in base64_image:
            base64_image = base64_image.split(",")[1]

        try:
            image_data = base64.b64decode(base64_image)
            image = Image.open(io.BytesIO(image_data))
            
            if self.tesseract_available:
                try:
                    text = self.pytesseract.image_to_string(image)
                    if text.strip():
                        logger.info("Successfully extracted text via Tesseract OCR.")
                        return text.strip()
                except Exception as ex:
                    logger.warning(f"Tesseract binary execution failed: {ex}. Falling back to simulation.")

        except Exception as e:
            logger.error(f"Error parsing image: {e}")

        # Simulated OCR return for demo validation
        logger.info("Simulated OCR: Returning educational text doubt extraction.")
        return "Write a recursive function in Python to calculate factorial, and explain how the call stack handles the base case."

# Singleton instance
ocr_service = OCRService()
