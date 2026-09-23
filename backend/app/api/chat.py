import json
import asyncio
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest, ChatResponse
from app.agent.agent_workflow import agent_workflow
from app.agent.memory import conversation_memory

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])

@router.post("", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    result = agent_workflow.execute_turn(
        session_id=request.session_id,
        user_message=request.message,
        provider=request.provider,
        api_key=request.api_key
    )
    return result

@router.post("/stream")
async def chat_stream_endpoint(request: ChatRequest):
    async def event_generator():
        # Step 1: Thinking / Planning step
        yield f"data: {json.dumps({'event': 'thought_start', 'text': 'Analyzing question & schema...'})}\n\n"
        await asyncio.sleep(0.15)
        
        # Run agent logic in thread
        res = await asyncio.to_thread(
            agent_workflow.execute_turn,
            request.session_id,
            request.message,
            request.provider,
            request.api_key
        )
        
        for thought in res["thought_process"]:
            yield f"data: {json.dumps({'event': 'thought_step', 'text': thought})}\n\n"
            await asyncio.sleep(0.1)

        # Stream SQL or tool call
        if res.get("sql_query"):
            yield f"data: {json.dumps({'event': 'sql_ready', 'sql': res['sql_query']})}\n\n"
            await asyncio.sleep(0.1)

        # Stream response text chunks
        words = res["response"].split(" ")
        for i in range(0, len(words), 3):
            chunk = " ".join(words[i:i+3]) + " "
            yield f"data: {json.dumps({'event': 'text_chunk', 'text': chunk})}\n\n"
            await asyncio.sleep(0.04)

        # Stream complete payload with data table, chart, insights
        yield f"data: {json.dumps({'event': 'complete', 'payload': res})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/clear")
def clear_chat_history(session_id: str = "default_session"):
    conversation_memory.clear(session_id)
    return {"message": f"Conversation memory cleared for session '{session_id}'."}
