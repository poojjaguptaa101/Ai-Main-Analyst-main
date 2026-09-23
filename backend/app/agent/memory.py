from typing import Dict, List, Any
from datetime import datetime

class ConversationMemory:
    def __init__(self, max_history: int = 20):
        self.max_history = max_history
        self.sessions: Dict[str, List[Dict[str, Any]]] = {}
        self.session_context: Dict[str, Dict[str, Any]] = {}

    def get_history(self, session_id: str) -> List[Dict[str, Any]]:
        return self.sessions.get(session_id, [])

    def add_turn(self, session_id: str, user_msg: str, assistant_res: Dict[str, Any]):
        if session_id not in self.sessions:
            self.sessions[session_id] = []
        
        self.sessions[session_id].append({
            "role": "user",
            "content": user_msg,
            "timestamp": datetime.now().isoformat()
        })
        self.sessions[session_id].append({
            "role": "assistant",
            "content": assistant_res.get("response", ""),
            "sql_query": assistant_res.get("sql_query"),
            "chart_spec": assistant_res.get("chart_spec"),
            "insights": assistant_res.get("insights", []),
            "timestamp": datetime.now().isoformat()
        })
        # Trim history if needed
        if len(self.sessions[session_id]) > self.max_history * 2:
            self.sessions[session_id] = self.sessions[session_id][-self.max_history * 2:]

    def update_context(self, session_id: str, key: str, value: Any):
        if session_id not in self.session_context:
            self.session_context[session_id] = {}
        self.session_context[session_id][key] = value

    def get_context(self, session_id: str) -> Dict[str, Any]:
        return self.session_context.get(session_id, {})

    def clear(self, session_id: str):
        if session_id in self.sessions:
            del self.sessions[session_id]
        if session_id in self.session_context:
            del self.session_context[session_id]

conversation_memory = ConversationMemory()
