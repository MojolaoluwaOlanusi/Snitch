import { io } from 'socket.io-client';

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OWM2YWFiZDA4MWVjNDAzZDFhNTc1MSIsImlhdCI6MTc3MjEwMzA3MywiZXhwIjoxNzcyNzA3ODczfQ.FGz_3tLQ82yiaYUM0NoH4f0sy9b7dUrPMe64ZeUuQbw";
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