# metrosence-agents/bridge.py
import os, asyncio, json
from typing import Any, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# ---------- Config ----------
MCP_CMD = [os.getenv("PYTHON", "python"), os.getenv("MCP_SERVER_PATH", "mcp/server.py")]
#ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:19006,http://localhost:8081").split(",")

# ---------- FastAPI ----------
app = FastAPI(title="Metrosence MCP Bridge")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- MCP session singleton ----------
_mcp_ctx = None      # stdio_client context manager
_mcp_session = None  # ClientSession

async def mcp_call_tool(name: str, args: Dict[str, Any]) -> Any:
    # Llama una tool y devuelve JSON “plano”
    result = await _mcp_session.call_tool(name, args)
    sc = getattr(result, "structuredContent", None)
    if sc is not None:
        return sc
    content = getattr(result, "content", None) or getattr(result, "outputs", None) or []
    for item in content:
        t = getattr(item, "type", None) or (isinstance(item, dict) and item.get("type"))
        if t == "json":
            return getattr(item, "json", None) or getattr(item, "object", None) or (isinstance(item, dict) and (item.get("json") or item.get("object")))
        if t == "text":
            txt = getattr(item, "text", None) or (isinstance(item, dict) and item.get("text"))
            try:
                return json.loads(txt)
            except Exception:
                return {"text": txt}
    return {"ok": False, "error": "empty_response"}

@app.on_event("startup")
async def _startup():
    global _mcp_ctx, _mcp_session
    server_params = StdioServerParameters(command=MCP_CMD[0], args=MCP_CMD[1:])
    _mcp_ctx = stdio_client(server_params)
    read, write = await _mcp_ctx.__aenter__()
    _mcp_session = ClientSession(read, write)
    await _mcp_session.__aenter__()
    await _mcp_session.initialize()

@app.on_event("shutdown")
async def _shutdown():
    global _mcp_ctx, _mcp_session
    try:
        if _mcp_session: await _mcp_session.__aexit__(None, None, None)
        if _mcp_ctx:     await _mcp_ctx.__aexit__(None, None, None)
    except Exception:
        pass

# ---------- Modelos ----------
class SelectLineBody(BaseModel):
    line: str

class SelectDirectionBody(BaseModel):
    direction: str

class SelectStationBody(BaseModel):
    station: str

# ---------- Endpoints “amigables” para el front ----------
@app.get("/mcp/{session_id}/lines")
async def list_lines(session_id: str):
    return await mcp_call_tool("list_lines_tool", {"session_id": session_id})

@app.post("/mcp/{session_id}/line")
async def select_line(session_id: str, body: SelectLineBody):
    return await mcp_call_tool("select_line_tool", {"session_id": session_id, "line": body.line})

@app.get("/mcp/{session_id}/directions")
async def list_directions(session_id: str):
    return await mcp_call_tool("list_directions_tool", {"session_id": session_id})

@app.post("/mcp/{session_id}/direction")
async def select_direction(session_id: str, body: SelectDirectionBody):
    return await mcp_call_tool("select_direction_tool", {"session_id": session_id, "direction": body.direction})

@app.get("/mcp/{session_id}/stations")
async def list_stations(session_id: str):
    return await mcp_call_tool("list_stations_tool", {"session_id": session_id})

@app.post("/mcp/{session_id}/station")
async def select_station(session_id: str, body: SelectStationBody):
    return await mcp_call_tool("select_station_tool", {"session_id": session_id, "station": body.station})

@app.get("/mcp/{session_id}/summary")
async def get_selection_summary(session_id: str):
    return await mcp_call_tool("get_selection_summary_tool", {"session_id": session_id})

@app.post("/mcp/{session_id}/start")
async def start_navigation(session_id: str):
    return await mcp_call_tool("start_navigation_tool", {"session_id": session_id})

@app.post("/mcp/{session_id}/reset")
async def reset_flow(session_id: str):
    return await mcp_call_tool("reset_flow_tool", {"session_id": session_id})
