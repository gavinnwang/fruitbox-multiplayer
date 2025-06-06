import { useEffect, useRef, useState } from "react";
import type {
  WsClientMsg,
  WsServerMsg,
  Player,
} from "./types/ws";
import toast from "react-hot-toast";

/**
 * Custom hook that:
 * - opens a WebSocket to ws://<host>/ws
 * - sends CreateRoom/JoinRoom/StartGame/ScoreUpdate/ReadyUp
 * - listens for RoomCreated, JoinedRoom, RoomPlayersUpdate, GameStarted,
 *   TimerTick, LeaderboardUpdate, Error
 */
export function useGameSocket(displayName: string) {
  const wsRef = useRef<WebSocket | null>(null);

  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [board, setBoard] = useState<number[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [timer, setTimer] = useState(0);
  const [myId] = useState<string>(() => crypto.randomUUID());
  const [chatMessages, setChatMessages] = useState<
    { playerId: string; name: string; text: string }[]
  >([]);
  const [top10Scores, setTop10Scores] = useState<{ name: string; score: number }[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  useEffect(() => {
    // src/gameSocket.ts
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const isDev = import.meta.env.DEV;
    const wsUrl = isDev
      ? `${wsProtocol}://127.0.0.1:3123/ws`
      : `${wsProtocol}://${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (ev) => {
      let msg: WsServerMsg;
      try {
        msg = JSON.parse(ev.data);
      } catch (e) {
        console.error("Invalid server message", e);
        return;
      }
      console.log("Received message:", msg);

      switch (msg.type) {
        case "RoomCreated": {
          setRoomId(msg.data.room_id);
          break;
        }

        case "RoomPlayersUpdate": {
          setRoomId(msg.data.room_id);
          setPlayers(msg.data.players);
          setOwnerId(msg.data.owner_id);
          break;
        }

        case "GameStarted": {
          setBoard(msg.data.board);
          setTimer(Number(msg.data.duration_secs));
          // reset scores to zero:
          const resetScores: Record<string, number> = {};
          msg.data.board.forEach((_v, _i) => { }); // no-op, just demonstration
          setScores(resetScores);
          break;
        }

        case "TimerTick": {
          setTimer(Number(msg.data.remaining_secs));
          break;
        }

        case "LeaderboardUpdate": {
          const newScores: Record<string, number> = {};
          msg.data.scores.forEach(([pid, sc]) => {
            newScores[pid] = sc;
          });
          setScores(newScores);
          break;
        }

        case "ChatBroadcast": {
          console.log("Got broadcast", msg.data);

          const { player, message } = msg.data;
          setChatMessages((prev) => [
            ...prev,
            { playerId: player.player_id, name: player.name, text: message },
          ]);
          break;
        }

        case "Error": {
          toast.error(msg.data.msg);
          break;
        }
        case "Top10Scores": {
          setTop10Scores(
            msg.data.scores.map(([score, name]: [number, string]) => ({
              name,
              score,
            }))
          );
          console.log("Top 10 scores updated:", msg.data.scores);
          break;
        }
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [displayName]);

  /** Send CreateRoom */
  function createRoom() {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    // the owner is always ready
    const player: Player = { player_id: myId, name: displayName, ready: true };
    const m: WsClientMsg = { type: "CreateRoom", data: { player } };
    wsRef.current.send(JSON.stringify(m));
  }

  /** Send JoinRoom */
  function joinRoom(rid: string) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const player: Player = { player_id: myId, name: displayName, ready: false };
    const m: WsClientMsg = { type: "JoinRoom", data: { room_id: rid, player } };
    wsRef.current.send(JSON.stringify(m));
  }

  /** Send ReadyUp */
  function readyUp(ready: boolean) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const m: WsClientMsg = { type: "ReadyUp", data: { ready } };
    wsRef.current.send(JSON.stringify(m));
  }

  /** Send StartGame */
  function startGame() {
    if (!wsRef.current || !roomId) return;
    const m: WsClientMsg = { type: "StartGame", data: {} };
    wsRef.current.send(JSON.stringify(m));
  }

  /** Send ScoreUpdate */
  function reportScore(cleared: number) {
    console.log("Reporting score:", cleared);
    if (!wsRef.current || !roomId || !myId) return;
    const m: WsClientMsg = {
      type: "ScoreUpdate",
      data: {
        cleared_count: cleared,
      },
    };
    wsRef.current.send(JSON.stringify(m));
  }

  function sendChatMessage(text: string) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !roomId) return;
    const m: WsClientMsg = {
      type: "ChatMessage",
      data: {
        message: text,
      },
    };
    wsRef.current.send(JSON.stringify(m));
  }

  return {
    roomId,
    players,
    board,
    scores,
    timer,
    myId,
    createRoom,
    joinRoom,
    readyUp, // Add readyUp to the returned object
    startGame,
    reportScore,
    chatMessages,
    sendChatMessage,
    top10Scores,
    ownerId,
  };
}