import { WebSocketServer } from 'ws';
import 'dotenv/config';
import { handlers } from './controllers/index.ts';

const WS_PORT = Number(process.env.WS_PORT) || 3000;

export const wss = new WebSocketServer({ port: WS_PORT });

const clients = new Map();

wss.on('connection', (ws, request) => {
  const remotePort = request.socket.remotePort || 0;
  console.log(remotePort);
  console.log(request.socket.address());

  ws.on('error', console.error);

  ws.on('message', (message) => {
    clients.set(remotePort, ws);
    console.log(`Received message ${message.toString()}`);
    ws.send(handlers(remotePort, message));
  });

  ws.on('close', () => {
    handlers(remotePort);
    clients.delete(remotePort);
    console.error('close', remotePort);
  });
});

wss.on('error', console.error);

wss.on('close', () => {
  console.log('WebSocket server close');
});
