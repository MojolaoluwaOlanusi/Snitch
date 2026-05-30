import IORedis from 'ioredis';
// @ts-ignore: allow import of .ts extension in ts-node/test harness
import { RedisRoomStore } from '../src/realtime/adapter/redisRoomStore.ts';

function sleep(ms: number) { return new Promise((res) => setTimeout(res, ms)); }

async function waitForRedis(client: any, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { if ((await client.ping()) === 'PONG') return true; } catch { }
    await sleep(200);
  }
  return false;
}

(async () => {
  console.log('Starting createRoomAndAddParticipant integration test');
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  const client = new IORedis(redisUrl);

  const ok = await waitForRedis(client, 15000);
  if (!ok) {
    console.error('Redis is not reachable at', redisUrl);
    process.exit(2);
  }

  const store = new RedisRoomStore(client);

  const roomId = `itest_room_${Date.now()}`;
  const userId = `itest_user_${Date.now()}`;
  const participant = { userId, socketId: 's1', joinedAt: Date.now(), muted: false, videoOn: true, role: 'member' };
  const metadata = { topic: 'integration-test', createdBy: 'tester' };

  console.log('Calling createRoomAndAddParticipant', { roomId, userId });
  // @ts-ignore
    await store.createRoomAndAddParticipant(roomId, metadata, participant);

  // allow small propagation
  await sleep(100);

  const metaKey = `rtc:room:${roomId}:meta`;
  const participantsKey = `rtc:room:${roomId}:participants`;
  const participantKey = `rtc:room:${roomId}:participant:${userId}`;
  const activeKey = `rtc:active_rooms`;

  const roomMeta = await client.hgetall(metaKey);
  console.log('roomMeta:', roomMeta);
  if (!roomMeta || !roomMeta.metadata) {
    console.error('Room meta missing or malformed', roomMeta);
    process.exit(3);
  }
  const parsed = JSON.parse(roomMeta.metadata);
  if (parsed.topic !== metadata.topic || parsed.createdBy !== metadata.createdBy) {
    console.error('Room meta content mismatch', parsed);
    process.exit(4);
  }

  const members = await client.smembers(participantsKey);
  console.log('participants set:', members);
  if (!members.includes(userId)) {
    console.error('Participant not found in participants set');
    process.exit(5);
  }

  const pHash = await client.hgetall(participantKey);
  console.log('participant hash:', pHash);
  if (!pHash || pHash.userId !== userId) {
    console.error('Participant hash missing or incorrect', pHash);
    process.exit(6);
  }

  const active = await client.smembers(activeKey);
  console.log('active rooms:', active);
  if (!active.includes(roomId)) {
    console.error('Room not present in active rooms index');
    process.exit(7);
  }

  // cleanup
  await store.deleteRoom(roomId);
  await client.quit();

  console.log('createRoomAndAddParticipant integration test passed');
  process.exit(0);
})();

