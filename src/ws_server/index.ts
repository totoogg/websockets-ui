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
    console.log(`Received message ${message.toString()}`);

    clients.set(remotePort, ws);

    const answer = handlers(remotePort, message);
    if (answer) {
      switch (JSON.parse(answer).type) {
        case 'reg': {
          const data = JSON.parse(answer);
          const dataRoom = {
            type: 'update_room',
            data: '' + data.dataRoom,
            id: 0,
          };
          delete data.dataRoom;
          ws.send(JSON.stringify(data));
          ws.send(JSON.stringify(dataRoom));
          break;
        }
        case 'update_room':
        case 'update_winners':
          for (const client of clients.values()) {
            client.send(answer);
          }
          break;
        case 'create_game':
        case 'start_game':
        case 'turn':
        case 'attack':
        case 'finish': {
          const data = JSON.parse(answer);
          const players: number[] = [...data.players.port];
          delete data.players;
          players.forEach((el) => clients.get(el).send(JSON.stringify(data)));
          break;
        }
        case 'update_room_create_game': {
          const data = JSON.parse(answer);
          const dataRoom = {
            type: 'update_room',
            data: data.dataRoom,
            id: 0,
          };

          for (const client of clients.values()) {
            client.send(JSON.stringify(dataRoom));
          }

          const players = [...JSON.parse(data.players)];

          players.forEach((el) =>
            clients.get(el.port).send(
              JSON.stringify({
                type: 'create_game',
                data: JSON.stringify({
                  idGame: data.dataGame,
                  idPlayer: el.index,
                }),
                id: 0,
              }),
            ),
          );
          break;
        }
      }
    } else {
      console.log(`An attempt by a user to enter a room that he created himself`);
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
