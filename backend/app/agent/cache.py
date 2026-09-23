import hashlib
import json
import time
from typing import Optional, Any, Dict

class QueryCache:
    def __init__(self, max_size: int = 150, ttl_seconds: int = 1800):
        self.max_size = max_size
        self.ttl = ttl_seconds
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.hits = 0
        self.misses = 0

    def _hash(self, key_data: Any) -> str:
        s = json.dumps(key_data, sort_keys=True)
        return hashlib.sha256(s.encode('utf-8')).hexdigest()

    def get(self, key_data: Any) -> Optional[Any]:
        k = self._hash(key_data)
        item = self.cache.get(k)
        if item:
            if time.time() - item["timestamp"] < self.ttl:
                self.hits += 1
                return item["data"]
            else:
                del self.cache[k]
        self.misses += 1
        return None

    def set(self, key_data: Any, data: Any):
        if len(self.cache) >= self.max_size:
            # Evict oldest entry
            oldest_key = min(self.cache.keys(), key=lambda x: self.cache[x]["timestamp"])
            del self.cache[oldest_key]
        
        k = self._hash(key_data)
        self.cache[k] = {
            "data": data,
            "timestamp": time.time()
        }

    def stats(self) -> Dict[str, Any]:
        total = self.hits + self.misses
        ratio = round((self.hits / total * 100), 1) if total > 0 else 0.0
        return {
            "cache_entries": len(self.cache),
            "hits": self.hits,
            "misses": self.misses,
            "hit_ratio_pct": ratio
        }

query_cache = QueryCache()
