// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.

/**
 * Represents one connected player (UUID and chosen display name).
 */
export type Player = { 
/**
 * The server‐assigned unique ID (e.g. a UUID).
 */
player_id: string, 
/**
 * The display name the player typed in (e.g. “Alice”).
 */
name: string, 
/**
 * Whether if the player is ready for the current game to start.
 */
ready: boolean, };

/**
 * All messages the **front end** can send to the server.
 */
export type WsClientMsg = { "type": "CreateRoom", "data": { player: Player, } } | { "type": "JoinRoom", "data": { room_id: string, player: Player, } } | { "type": "StartGame", "data": Record<string, never> } | { "type": "ScoreUpdate", "data": { cleared_count: number, } } | { "type": "ReadyUp", "data": { ready: boolean, } } | { "type": "ChatMessage", "data": { message: string, } };

/**
 * All messages the **server** can push back to every client in a room.
 */
export type WsServerMsg = { "type": "RoomCreated", "data": { room_id: string, } } | { "type": "RoomPlayersUpdate", "data": { room_id: string, players: Array<Player>, owner_id: string, } } | { "type": "GameStarted", "data": { room_id: string, board: Array<number>, duration_secs: bigint, } } | { "type": "TimerTick", "data": { room_id: string, remaining_secs: bigint, } } | { "type": "LeaderboardUpdate", "data": { room_id: string, scores: Array<[string, number]>, } } | { "type": "ChatBroadcast", "data": { room_id: string, player: Player, message: string, } } | { "type": "Error", "data": { room_id: string | null, msg: string, } } | { "type": "Top10Scores", "data": { scores: Array<[number, string]>, } };
