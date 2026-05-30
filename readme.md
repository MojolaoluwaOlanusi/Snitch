[![Realtime integration](https://github.com/olanu/Snitch/actions/workflows/realtime-integration.yml/badge.svg?branch=main)](https://github.com/olanu/Snitch/actions/workflows/realtime-integration.yml)

# Snitch — Realtime Backend (developer notes)

This repository contains the Snitch realtime backend and related frontend/admin code. The backend implements a WebSocket + WebRTC realtime system built with Socket.IO, Redis, and MongoDB; it also includes Redis-backed room stores and atomic Lua scripts used by the realtime components.

This README combines: quick start & CI info, a concise socket event contract summary (quick table + details), and TypeScript types developers can copy into the frontend.

---

## Table of contents
- [Quick status](#quick-status)
- [Quick start (run integration tests locally)](#quick-start-run-integration-tests-locally)
- [Files of interest](#files-of-interest)
- [Socket contract quick table](#socket-contract-quick-table)
- [Socket event contracts (detailed)](#socket-event-contracts-detailed)
  - [Core messaging events](#core-messaging-events)
  - [Typing / presence](#typing--presence)
  - [Reactions](#reactions)
  - [WebRTC signaling & call lifecycle](#webrtc-signaling--call-lifecycle)
  - [Call control events](#call-control-events)
- [TypeScript API types (copy into frontend)](#typescript-api-types-copy-into-frontend)
- [HTTP presign endpoint (upload to MINIO / S3)](#http-presign-endpoint-upload-to-minio--s3)
- [Contributing & notes](#contributing--notes)

---

## Quick status
- CI workflow: `.github/workflows/realtime-integration.yml` runs Redis-backed integration tests on push/PR to `main`.

## Quick start (run integration tests locally)
Prerequisites:
- Docker (for Redis) or an available Redis instance
- Node 18+ and npm

1. Start Redis (Docker):

```powershell
# start Redis locally for tests
docker run -d --name snitch-redis -p 6379:6379 redis:7
```

2. Install backend dependencies and run tests:

```powershell
cd backend
npm install
# run the atomic create+add integration test
$env:REDIS_URL = 'redis://127.0.0.1:6379'; npm run test:create-add
# run the remove-participant reload integration test
$env:REDIS_URL = 'redis://127.0.0.1:6379'; npm run test:redis-reload
```

You can run both sequentially in one line:

```powershell
$env:REDIS_URL = 'redis://127.0.0.1:6379'; npm run test:create-add; npm run test:redis-reload
```

## Files of interest
- `backend/src/realtime/adapter/redisRoomStore.ts` — RedisRoomStore with Lua scripts and atomic helpers.
- `backend/test/redis-reload.ts` — integration test for Lua script preload/reload and remove-last-participant behavior.
- `backend/test/create-add-integration.ts` — integration test for atomic createRoom + addParticipant script.
- `.github/workflows/realtime-integration.yml` — CI workflow that runs the tests using a Redis service.

---

## Socket contract quick table
A compact, copyable summary of the most important socket events.

| Event | Direction | Short payload | Ack | Notes |
|---|---:|---|---:|---|
| send_message | client -> server | { receiverId, text?, media?, replyTo? } | yes | Server persists + forwards
| receive_message | server -> client | Message | n/a | Delivered to recipients
| message:edit | client -> server | { messageId, newText } | yes | Validates ownership
| message:delete | client -> server | { messageId } | yes | Validates ownership
| message:read | client -> server | { messageId } | no | Read receipts
| typing:start / typing:stop | client -> server | { toUserId?, roomId? } | no | Forwarded to targets
| reaction:add | client -> server | { messageId, reaction } | no | Updates reactions
| webrtc:call:create | client -> server | { roomId?, metadata? } | yes | Creates room if needed
| webrtc:call:join | client -> server | { roomId } | yes | Adds participant to room store
| webrtc:signaling:* | client -> server | { to, sdp/ice } | no | Offer/answer/ice forwarding

---

## Socket event contracts (detailed)

### Core messaging events

#### send_message (client -> server)
- Payload: { receiverId: string, text?: string, media?: Array<{ url: string, mime?: string, size?: number }>, replyTo?: string }
- Ack: { ok: true, message } or { ok: false, error }
- Server emits `receive_message` to recipient(s) and `message_sent` to sender.

#### receive_message (server -> client)
- Payload: Message object (persisted), e.g. { id, from, to, text, media, createdAt }

#### message:edit
- Payload: { messageId: string, newText: string }
- Ack: { ok: true, message }
- Server emits `message:edited` to involved parties.

#### message:delete
- Payload: { messageId: string }
- Server emits `message:deleted` with { messageId }.

#### message:read
- Payload: { messageId: string }
- Server records read receipt and emits `message:read` to original sender.

### Typing / presence
- `typing:start` / `typing:stop`: payload { toUserId?: string, roomId?: string }
- Presence: server emits `user_online` and `user_offline` on `presence` channel.

### Reactions
- `reaction:add`: payload { messageId: string, reaction: string }
- Server updates message.reactions and emits `reaction:update` with { messageId, reactions }

### WebRTC signaling & call lifecycle
- `webrtc:call:create` (client -> server): { roomId?: string, metadata?: object } → ack { ok: true, roomId }
- `webrtc:call:join` (client -> server): { roomId } → server adds participant and emits `webrtc:call:participant_joined`
- Signaling: `webrtc:signaling:offer|answer|ice`: payload { to, sdp/ice } forwarded to target socket
- `webrtc:call:participant_left` (server -> room): { userId }
- `webrtc:call:ended` (server -> room): { roomId }

### Call control events (client <-> server)
- `webrtc:control:mute` / `webrtc:control:unmute` -> { roomId, userId }
- `webrtc:control:screen_share:start` / `webrtc:control:screen_share:stop`
- `webrtc:control:set_quality` -> { roomId, quality: 'low'|'medium'|'high' }

---

## TypeScript API types (copy into frontend)
Copy these into your frontend TypeScript code to get typed socket payloads.

```ts
// Socket payloads (frontend types)
export type ID = string;

export interface MediaItem {
  url: string;
  mime?: string;
  size?: number;
}

export interface SendMessagePayload {
  receiverId: ID;
  text?: string;
  media?: MediaItem[];
  replyTo?: ID;
}

export interface Message {
  id: ID;
  from: ID;
  to: ID | ID[];
  text?: string;
  media?: MediaItem[];
  replyTo?: ID;
  createdAt: string;
  editedAt?: string;
  reactions?: Record<string, string[]>; // reaction -> userIds
}

export interface EditMessagePayload { messageId: ID; newText: string }
export interface DeleteMessagePayload { messageId: ID }
export interface ReadMessagePayload { messageId: ID }

export interface TypingPayload { toUserId?: ID; roomId?: ID }
export interface ReactionPayload { messageId: ID; reaction: string }

export interface WebrtcCallCreatePayload { roomId?: ID; metadata?: Record<string, any> }
export interface WebrtcCallJoinPayload { roomId: ID }
export interface SignalingPayload { to: ID; sdp?: any; ice?: any }

// Usage (example):
// socket.emit('send_message', payload as SendMessagePayload, (ack) => { ... })
```

---

## HTTP presign endpoint (upload to MINIO / S3)
The backend exposes an endpoint that returns a presigned URL (or form fields) allowing clients to upload media directly to object storage.

- Endpoint: POST /api/media/presign
  - auth: Bearer JWT
  - request body: { filename: string, contentType: string, size?: number, folder?: string }
  - response: { ok: true, uploadUrl: string, method: 'PUT'|'POST', fields?: object, key: string, publicUrl: string }

Example: get a presigned PUT URL

```bash
curl -X POST \ 
  -H "Authorization: Bearer $TOKEN" \ 
  -H "Content-Type: application/json" \ 
  -d '{"filename":"video.mp4","contentType":"video/mp4","size":123456}' \ 
  https://api.example.com/api/media/presign
```

Client upload (PUT)

```js
await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'video/mp4' },
  body: fileBlob
});

socket.emit('send_message', { receiverId, text: '', media: [{ url: publicUrl, mime: 'video/mp4', size }] }, ack);
```

## Contributing & notes
- The project is TypeScript based. Tests use `ts-node` for quick execution in CI/dev.
- If your GitHub repo path differs from `olanu/Snitch` update the badge URL at the top of this file.
- For production use, ensure Redis is secured and tuned, and consider placing Lua scripts in a script registry or preloading them during app boot.

If you want, I can:
- Replace the badge owner/repo automatically by detecting your git remote and updating the README, or
- Convert the ad-hoc integration scripts to Jest tests and wire them to CI for better reporting.

Happy to make either change — tell me which one you prefer next.
