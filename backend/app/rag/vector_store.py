import numpy as np
import logging
from typing import List, Dict, Any, Tuple
from app.services.embeddings_service import embeddings_service

logger = logging.getLogger("learnbridge.vector_store")

class LocalVectorStore:
    def __init__(self):
        self.faiss_index = None
        self.doc_chunks = [] # Stores mapping of index to {"chunk_id": int, "document_id": int, "text": str, "source": str}
        
        try:
            import faiss
            self.faiss = faiss
            # 384 dimensions from SentenceTransformer / Hash fallback
            self.faiss_index = faiss.IndexFlatIP(384)
            logger.info("Initialized FAISS IndexFlatIP vector store.")
        except Exception as e:
            logger.warning(f"Could not initialize FAISS: {e}. Falling back to Python Cosine Similarity.")
            self.faiss = None

    def add_chunks(self, chunks: List[Dict[str, Any]]):
        """
        chunks is a list of dicts: {"chunk_id": int, "document_id": int, "text": str, "source": str}
        """
        if not chunks:
            return
        
        texts = [c["text"] for c in chunks]
        embeddings = embeddings_service.get_embeddings(texts)
        
        # Ensure embeddings are float32 and normalized
        embeddings = np.array(embeddings, dtype=np.float32)
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        # Avoid division by zero
        norms = np.where(norms == 0, 1.0, norms)
        embeddings = embeddings / norms

        if self.faiss_index is not None:
            try:
                self.faiss_index.add(embeddings)
                self.doc_chunks.extend(chunks)
                logger.info(f"Added {len(chunks)} chunks to FAISS vector store.")
                return
            except Exception as e:
                logger.error(f"FAISS add failed: {e}. Falling back to list-based vectors.")

        # Fallback list storage
        for idx, chunk in enumerate(chunks):
            chunk["embedding"] = embeddings[idx]
            self.doc_chunks.append(chunk)
        logger.info(f"Added {len(chunks)} chunks to local memory vector list.")

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        if not self.doc_chunks:
            return []

        query_emb = embeddings_service.get_embedding(query)
        query_emb = np.array(query_emb, dtype=np.float32)
        norm = np.linalg.norm(query_emb)
        if norm > 0:
            query_emb = query_emb / norm

        # Use FAISS index if available
        if self.faiss_index is not None:
            try:
                # FAISS expects 2D array
                q_expanded = np.expand_dims(query_emb, axis=0)
                similarities, indices = self.faiss_index.search(q_expanded, top_k)
                
                results = []
                for score, idx in zip(similarities[0], indices[0]):
                    if idx != -1 and idx < len(self.doc_chunks):
                        chunk = self.doc_chunks[idx].copy()
                        chunk["score"] = float(score)
                        results.append(chunk)
                return results
            except Exception as e:
                logger.error(f"FAISS search failed: {e}. Falling back to list search.")

        # Cosine similarity matching in memory
        scores = []
        for chunk in self.doc_chunks:
            chunk_emb = chunk["embedding"]
            similarity = float(np.dot(query_emb, chunk_emb))
            scores.append((similarity, chunk))

        # Sort and take top k
        scores.sort(key=lambda x: x[0], reverse=True)
        results = []
        for similarity, chunk in scores[:top_k]:
            c_copy = chunk.copy()
            # Remove embedding array for serialization
            if "embedding" in c_copy:
                del c_copy["embedding"]
            c_copy["score"] = similarity
            results.append(c_copy)
        return results

    def clear(self):
        self.doc_chunks = []
        if self.faiss_index is not None and self.faiss is not None:
            self.faiss_index = self.faiss.IndexFlatIP(384)
            logger.info("Cleared FAISS vector store index.")
        else:
            logger.info("Cleared local memory vector store list.")

# Singleton instance
vector_store = LocalVectorStore()
