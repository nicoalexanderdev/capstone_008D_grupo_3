import os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from typing import Dict
from mcp.server.fastmcp import FastMCP
from metrosence_flow.core import (
    Flow, list_lines, select_line, list_directions, select_direction,
    list_stations, select_station, get_selection_summary, reset_flow
)
from metrosence_flow.providers import provider_from_env


# # -------------------------------
# # comando para levantar el agente MCP: mcp dev "mcp/server.py"
# # -------------------------------


mcp = FastMCP("metrosence-mcp")
DP = provider_from_env()
SESSIONS: Dict[str, Flow] = {}


def _flow(session_id: str) -> Flow:
    if session_id not in SESSIONS:
        SESSIONS[session_id] = Flow()
    return SESSIONS[session_id]


@mcp.tool()
async def list_lines_tool(session_id: str):
    """Devuelve líneas disponibles."""
    return await list_lines(_flow(session_id), DP)


@mcp.tool()
async def select_line_tool(session_id: str, line: str):
    """Selecciona línea por id/nombre normalizado (L1, 1, 'línea 1')."""
    return await select_line(_flow(session_id), DP, line)


@mcp.tool()
async def list_directions_tool(session_id: str):
    return await list_directions(_flow(session_id), DP)


@mcp.tool()
async def select_direction_tool(session_id: str, direction: str):
    return await select_direction(_flow(session_id), DP, direction)


@mcp.tool()
async def list_stations_tool(session_id: str):
    return await list_stations(_flow(session_id), DP)


@mcp.tool()
async def select_station_tool(session_id: str, station: str):
    return await select_station(_flow(session_id), DP, station)


@mcp.tool()
async def get_selection_summary_tool(session_id: str):
    return await get_selection_summary(_flow(session_id), DP)


# @mcp.tool()
# async def start_navigation_tool(session_id: str):
#     return await start_navigation(_flow(session_id), DP)


@mcp.tool()
async def reset_flow_tool(session_id: str):
    return reset_flow(_flow(session_id))


if __name__ == "__main__":
    # Usa METROSENCE_API_BASE y METROSENCE_API_KEY desde .env
    from dotenv import load_dotenv; load_dotenv()
    mcp.run()
