import { io } from 'socket.io-client';

// Avoid hardcoding tokens in source. Prefer providing TEST_TOKEN in the environment when running tests
// or have the token available in localStorage when running in a browser.
const token = (typeof process !== 'undefined' && process.env && process.env.TEST_TOKEN)
  || (typeof localStorage !== 'undefined' && localStorage.getItem('access-token'))
  || '';

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