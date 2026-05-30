import IORedis from 'ioredis';
// @ts-ignore: allow import of .ts extension in ts-node/test harness
import { RedisRoomStore } from '../src/realtime/adapter/redisRoomStore.ts';

async function sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}

async function waitForRedis(client: any, timeout = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        try {
            const pong = await client.ping();
            if (pong === 'PONG') return true;
        } catch (err) {
            // ignore and retry
        }
        await sleep(200);
    }
    return false;
}

function writeLog(...args: any[]) {
    // simple console-only logger for test harness (no fs dependency)
    const msg = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
    console.log(msg);
}

(async () => {
    writeLog('Starting redis-reload integration test');
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

    // create a fresh redis client to inspect
    const client = new IORedis(redisUrl);

    writeLog('Waiting for Redis to be reachable at', redisUrl);
    const ok = await waitForRedis(client, 15000);
    if (!ok) {
        writeLog('Redis is not available at', redisUrl, '\nPlease start Redis (e.g., `docker run -d --name snitch-redis -p 6379:6379 redis:7`) and re-run this test.');
        process.exit(2);
    }

    // statically import the store (ts-node or allowImportingTsExtensions is expected)
    const store = new RedisRoomStore(client);

    // create a room and add a participant
    const roomId = `testroom_${Date.now()}`;
    await store.createRoom(roomId, { test: true });
    await store.addParticipant(roomId, { userId: 'user1', socketId: 's1', joinedAt: Date.now() });

    writeLog('Room created and participant added. Waiting for script preload...');

    // wait for the store to have preloaded sha or timeout
    const preloadTimeout = 5000;
    const preloadStart = Date.now();
    while (!store['removeParticipantSha'] && Date.now() - preloadStart < preloadTimeout) {
        await sleep(100);
    }

    // verify script SHA is present in store
    if (!store['removeParticipantSha']) {
        writeLog('Script SHA not preloaded in store - continuing but behavior may use fallback EVAL');
    } else {
        writeLog('Script was preloaded, sha=', store['removeParticipantSha']);
    }

    // Evict scripts from Redis by running SCRIPT FLUSH (this simulates eviction/restart)
    writeLog('Flushing scripts from Redis to simulate eviction...');
    try {
        await client.script('FLUSH');
    } catch (err: any) {
        writeLog('Error flushing scripts (continuing):', err.message || err);
    }

    // Ensure scripts gone
    try {
        const sha = store['removeParticipantSha'] || 'nosha';
        const exists = sha && sha !== 'nosha' ? await client.script('EXISTS', sha) : [0];
        writeLog('Script exists after flush:', exists);
    } catch (err) {
        writeLog('Could not check script existence:', err);
    }

    // Now call removeParticipant which should either reload the script (due to ready/connect listener) or fallback to EVAL
    writeLog('Calling removeParticipant (this will trigger EVALSHA then fallback to EVAL if needed)...');
    const deleted = await store.removeParticipant(roomId, 'user1');
    writeLog('removeParticipant returned (roomDeleted):', deleted);

    // verify that room was deleted from active rooms
    const active = await client.smembers('rtc:active_rooms');
    writeLog('Active rooms after removal:', active);

    // cleanup
    await client.quit();
    process.exit(0);
})();
