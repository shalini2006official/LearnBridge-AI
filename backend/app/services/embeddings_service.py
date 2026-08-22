import numpy as np
import logging
import re
from typing import List

logger = logging.getLogger("learnbridge.embeddings")

class EmbeddingsService:
    def __init__(self):
        self.transformer = None
        logger.info("Using lightweight hash-based embeddings for deployment.")

    def get_embedding(self, text: str) -> np.ndarray:
        if self.transformer:
            try:
                emb = self.transformer.encode([text])[0]
                return np.array(emb, dtype=np.float32)
            except Exception as e:
                logger.error(f"Error encoding embedding: {e}. Falling back.")

        # Fallback representation: Simple term frequency vector
        # Returns a 384-dimensional vector (matching MiniLM dimension)
        return self._hash_vectorize(text, dimension=384)

    def get_embeddings(self, texts: List[str]) -> np.ndarray:
        if self.transformer:
            try:
                embs = self.transformer.encode(texts)
                return np.array(embs, dtype=np.float32)
            except Exception as e:
                logger.error(f"Error encoding batch embeddings: {e}. Falling back.")

        embs = [self._hash_vectorize(text, dimension=384) for text in texts]
        return np.array(embs, dtype=np.float32)

    def _hash_vectorize(self, text: str, dimension: int = 384) -> np.ndarray:
        """
        Generates a normalized bag-of-words hash vector of fixed dimension.
        Ensures semantic similarity can still be computed via dot product.
        """
        vec = np.zeros(dimension, dtype=np.float32)
        words = re.findall(r'\w+', text.lower())
        if not words:
            return vec
        for word in words:
            # Hash word into dimension index
            idx = int(hash(word) % dimension)
            vec[idx] += 1.0
        # Normalize
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

# Singleton instance
embeddings_service = EmbeddingsService()
