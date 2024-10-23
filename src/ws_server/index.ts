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

  clients.set(remotePort, ws);

  ws.on('error', console.error);

  ws.on('message', (message) => {
    console.log(`Received message ${message.toString()}`);
    const answer = handlers(remotePort, message);
    switch (JSON.parse(answer).type) {
      case 'reg':
        ws.send(answer);
        break;
      case 'update_room':
      case 'create_game':
      case 'update_winners':
        for (const client of clients.values()) {
          client.send(answer);
        }
        break;
      case 'start_game':
      case 'turn':
      case 'attack':
      case 'finish': {
        const data = JSON.parse(answer);
        const players: number[] = [...data.players];
        delete data.players;
        players.forEach((el) => clients.get(el).send(JSON.stringify(data)));
        break;
      }
    }
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
