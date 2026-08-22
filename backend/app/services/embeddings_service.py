import numpy as np
import logging
import re
from typing import List

logger = logging.getLogger("learnbridge.embeddings")


class EmbeddingsService:
    def __init__(self):
        # Do not load SentenceTransformer on Render/free instances.
        # The lightweight hash-vector fallback is used instead.
        self.transformer = None
        logger.info(
            "Using lightweight hash-based embeddings. "
            "SentenceTransformer disabled to reduce memory usage."
        )

    def get_embedding(self, text: str) -> np.ndarray:
        if self.transformer:
            try:
                emb = self.transformer.encode([text])[0]
                return np.array(emb, dtype=np.float32)
            except Exception as e:
                logger.error(f"Error encoding embedding: {e}. Falling back.")

        return self._hash_vectorize(text, dimension=384)

    def get_embeddings(self, texts: List[str]) -> np.ndarray:
        if self.transformer:
            try:
                embs = self.transformer.encode(texts)
                return np.array(embs, dtype=np.float32)
            except Exception as e:
                logger.error(f"Error encoding batch embeddings: {e}. Falling back.")

        embs = [
            self._hash_vectorize(text, dimension=384)
            for text in texts
        ]

        return np.array(embs, dtype=np.float32)

    def _hash_vectorize(
        self,
        text: str,
        dimension: int = 384
    ) -> np.ndarray:

        vec = np.zeros(dimension, dtype=np.float32)

        words = re.findall(r'\w+', text.lower())

        if not words:
            return vec

        for word in words:
            idx = int(hash(word) % dimension)
            vec[idx] += 1.0

        norm = np.linalg.norm(vec)

        if norm > 0:
            vec = vec / norm

        return vec


# Singleton instance
embeddings_service = EmbeddingsService()
