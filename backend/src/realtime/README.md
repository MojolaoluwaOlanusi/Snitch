Realtime Socket & Presign Developer Guide
==========================================

What this guide contains
- Quick setup: how to connect to the realtime server (socket.io) with JWT auth
- Concrete client examples for every important socket event (presence, messaging, reactions, typing)
- WebRTC call flow examples (initiate, join, signaling, ICE, controls)
- Examples for uploading media with the REST presign endpoint and the socket presign event
- Best-practices, reconnection guidance, and server expectations

Quick setup
-----------
Prerequisites (client):
- socket.io-client (v4+)
- A valid JWT issued by your backend (used for socket auth and REST endpoints)

Install (example using npm):

```bash
npm install socket.io-client
```

Connecting to the socket server (browser / Node.js)

```js
import { io } from 'socket.io-client';

const token = '<YOUR_JWT_TOKEN>'; // obtain via your auth flow
const socket = io(process.env.CLIENT_SOCKET_URL || 'http://localhost:4500', {
  auth: { token }, // handshake auth
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('connected', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('connect_error', err.message);
});
```

Note: The server also accepts Authorization header on handshake; many clients provide `extraHeaders` in Node.js.

Presence
--------
The server emits `users_online` to the connecting socket and broadcasts `user_online` / `user_offline` as users connect/disconnect.

Client example:

```js
socket.on('users_online', (users) => console.log('online users', users));
socket.on('user_online', (id) => console.log('user online', id));
socket.on('user_offline', (id) => console.log('user offline', id));
```

Messaging (send/receive)
------------------------
Use `send_message` to create and deliver messages. The server persists messages to MongoDB and delivers `receive_message` to recipients.

Send message example (with ack):

```js
// payload: { receiverId, text?, media? }
socket.emit('send_message', { receiverId: 'userB', text: 'Hello!', media: [] }, (ack) => {
  if (!ack || !ack.ok) return console.error('send failed', ack);
  console.log('message sent', ack.message);
});
```

Receive message example:

```js
socket.on('receive_message', (message) => {
  console.log('incoming', message);
});

socket.on('message_sent', (message) => {
  // server uses this to acknowledge and return the persisted message
  console.log('message saved for sender', message);
});
```

Reactions, edit, delete, forward, read
--------------------------------------
Reaction example:

```js
socket.emit('reaction:add', { messageId: 'abc123', reaction: '❤️' }, (ack) => {
  if (!ack.ok) console.error('reaction failed', ack.error);
});

socket.on('reaction:update', ({ messageId, reactions }) => {
  console.log('reaction update', messageId, reactions);
});
```

Edit message example:

```js
socket.emit('message:edit', { messageId: 'abc123', newText: 'Edited text' }, (ack) => {
  if (!ack.ok) return console.error('edit failed', ack.error);
  console.log('edited', ack.message);
});
```

Delete message example:

```js
socket.emit('message:delete', { messageId: 'abc123' }, (ack) => {
  if (!ack.ok) return console.error('delete failed', ack.error);
  console.log('message deleted');
});
```

Forward example:

```js
socket.emit('message:forward', { messageId: 'abc123', targets: ['userC', 'userD'] }, (ack) => {
  if (!ack.ok) console.error('forward error', ack.error);
  else console.log('forwarded');
});
```

Read receipt example:

```js
socket.emit('message:read', { messageId: 'abc123' }, (ack) => {
  if (!ack.ok) console.error('read ack failed');
});

socket.on('message:read', ({ messageId, userId }) => {
  console.log(`${userId} read ${messageId}`);
});
```

Typing indicator
----------------

```js
// start typing to a user
socket.emit('typing:start', { toUserId: 'userB' });
// stop typing
socket.emit('typing:stop', { toUserId: 'userB' });

socket.on('typing:start', ({ from }) => console.log(from, 'is typing'));
socket.on('typing:stop', ({ from }) => console.log(from, 'stopped typing'));
```

Media upload (presign)
----------------------
Two options: REST `/api/media/presign` or socket event `upload:presign`.

REST presign (recommended for simple flows)

```bash
curl -X POST 'http://localhost:4500/api/media/presign' \
 -H 'Authorization: Bearer <TOKEN>' \
 -H 'Content-Type: application/json' \
 -d '{"contentType":"image/png","key":"avatar.png","expiresInSeconds":600}'
```

Response example:

```json
{ "ok": true, "url": "https://...", "bucket": "snitch-dev", "key": "uploads/<userId>/avatar.png", "publicUrl": "http://.../snitch-dev/uploads/<userId>/avatar.png", "expiresInSeconds": 600 }
```

Socket presign example:

```js
socket.emit('upload:presign', { key: 'avatar.png', contentType: 'image/png' }, (ack) => {
  if (!ack.ok) return console.error('presign failed', ack.error);
  // use ack.url for PUT
  fetch(ack.url, { method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: file })
    .then((r) => { if (!r.ok) throw new Error('upload failed'); console.log('uploaded'); })
    .catch(console.error);
});
```

PUT example (browser fetch)

```js
await fetch(presignUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
// then include publicUrl in your message payload or notify the server
```

WebRTC signaling & call flow
---------------------------
This section shows a minimal peer-to-peer mesh signaling flow using the server to route SDP and ICE messages. For group calls >4 consider an SFU.

Terminology:
- Caller: initiates with `webrtc:call:initiate`
- Callee(s): receive `webrtc:call:incoming` and should `webrtc:call:join` to participate

1) Initiate a call (caller):

```js
// targets: array of userIds
socket.emit('webrtc:call:initiate', { targets: ['userB'], isVideo: true }, (ack) => {
  if (!ack.ok) return console.error('call init failed', ack.error);
  const { callId, roomId } = ack;
  console.log('call created', callId, roomId);
  // continue to create local RTCPeerConnection and gather ICE, then send offer via webrtc:signal
});
```

2) Incoming call (callee):

```js
socket.on('webrtc:call:incoming', async ({ callId, from, roomId, isVideo }) => {
  console.log('incoming call from', from, callId);
  // show incoming UI to user; if accepted:
  socket.emit('webrtc:call:join', { callId }, (ack) => {
    if (!ack.ok) return console.error('join failed');
    const participants = ack.participants; // list of participants with socketIds
    // create RTCPeerConnection(s) and exchange SDP via webrtc:signal
  });
});
```

3) Exchanging SDP & ICE (generic signaling):

Client sends an offer/answer/ice to a target socketId (or toUserId or to the whole call room):

```js
// sending an offer to a specific socketId
socket.emit('webrtc:signal', { toSocketId: remoteSocketId, type: 'offer', data: { sdp: offer.sdp } });

socket.on('webrtc:signal', ({ from, type, data }) => {
  if (type === 'offer') {
    // set remote description and create answer
  } else if (type === 'answer') {
    // set remote description
  } else if (type === 'ice') {
    // add ICE candidate
  }
});
```

4) Call controls (mute/unmute, toggle video, screenshare)

```js
socket.emit('webrtc:call:control', { callId, action: 'mute' });
socket.emit('webrtc:call:control', { callId, action: 'toggle_video' });

socket.on('webrtc:call:participants', (participants) => {
  console.log('participants changed', participants);
});
```

5) Leaving and ending the call

```js
socket.emit('webrtc:call:leave', { callId }, (ack) => { /* ... */ });
// owner/admin can end
socket.emit('webrtc:call:end', { callId }, (ack) => { /* ... */ });
```

Offer/answer collision note
- The client implementation should pick a deterministic policy for which peer creates the initial offer to avoid collisions (server may instruct using participants list). A simple heuristic: always let the joining participant create offers to existing participants or use userId ordering.

Group calls
-----------
- Create/join group room:

```js
socket.emit('webrtc:group:create', { metadata: { topic: 'Standup' } }, (ack) => console.log(ack));
socket.emit('webrtc:group:join', { groupId: 'group123' }, (ack) => console.log(ack.participants));
```

- Broadcast group messages using `webrtc:group:message` (not persisted by realtime layer by default; use REST if you need DB persistence).

Room queries
------------
Retrieve participants for a room:

```js
socket.emit('webrtc:room:participants', { roomId: 'call_abc' }, (ack) => {
  if (ack.ok) console.log('participants', ack.participants);
});
```

Disconnect & reconnection behavior
----------------------------------
- The server only removes a participant when the stored participant.socketId matches the disconnected socket ID. This allows multiple device connections per user.
- For transient network drops, rejoin the call using the same user identity; `webrtc:call:join` will update socketId for existing participant entries.
- Configure reasonable reconnect attempts and backoff on the client.

Security & best practices
-------------------------
- Never send raw media blobs through socket events; use presigned uploads and include returned publicUrl in `send_message` payloads.
- Clamp presign expiry and force user-scoped keys to limit accidental/extraneous writes.
- Rate-limit signaling on the client and server to prevent abuse.
- For production scale: enable Redis adapter and a Redis-backed RoomStore; add monitoring for room counts and signaling rates.

Server expectations & notes for client devs
------------------------------------------
- Auth: every socket connection is authenticated via JWT; the server populates `socket.data.userId` (string). The client must use the same token used for REST endpoints.
- All acks are optional but recommended to ensure delivery and error handling.
- Keep calls and messages small and use chunked/multipart uploads for very large files.

Troubleshooting
---------------
- "No token provided" on connect: verify the token is sent in handshake auth or Authorization header.
- "presign failed": check contentType whitelist and that the token userId matches the requested key prefix.
- If peers can't establish media: verify ICE candidate flow and that both clients can reach each other's ICE (STUN/TURN configuration may be required in production).

Further reading and next steps
-----------------------------
- Add an SFU (mediasoup or Janus) for group calls >4
- Implement Redis-backed RoomStore (`backend/src/realtime/rooms.ts` swap) and `socket.io-redis` adapter for multi-instance scaling
- Add unit & integration tests for signaling flows using `socket.io-client` in CI

Files to inspect in repository
- `backend/src/realtime/signaling.ts` — main signaling and presign logic
- `backend/src/realtime/handlers.ts` — messaging handlers, presence, and disconnect cleanup

If you'd like, I can now:
- Add example TypeScript client code (instead of JS) for each example
- Create small automated integration tests that exercise presign and a two-peer signaling flow
- Implement a Redis-backed RoomStore and configure the socket.io Redis adapter

Which of these would you like next?
