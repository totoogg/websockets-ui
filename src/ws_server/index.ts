import { WebSocketServer } from 'ws';
import 'dotenv/config';
import { handlers } from './controllers/index.ts';
import { IShip } from '../models/index.ts';

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

    if (answer === 'Incorrect room') {
      console.log(`An attempt by a user to enter a room that he created himself`);
      return;
    }
    if (typeof answer === 'string' && answer) {
      switch (JSON.parse(answer).type) {
        case 'reg': {
          const data = JSON.parse(answer);
          const dataRoom = {
            type: 'update_room',
            data: '' + data.dataRoom,
            id: 0,
          };
          const dataWins = {
            type: 'update_winners',
            data: '' + data.dataWins,
            id: 0,
          };

          delete data.dataRoom;
          delete data.dataWins;

          ws.send(JSON.stringify(data));

          for (const client of clients.values()) {
            client.send(JSON.stringify(dataRoom));
            client.send(JSON.stringify(dataWins));
          }

          break;
        }
        case 'create_game': {
          const data = JSON.parse(answer);
          const players = [...JSON.parse(data.players)];

          delete data.player;

          players.forEach((el) => clients.get(el.port).send(JSON.stringify(data)));
          break;
        }
        case 'start_game': {
          const data = JSON.parse(answer);
          const dataSend = JSON.parse(data.dataGame);
          const players = [...JSON.parse(data.players)];

          players.forEach((el) =>
            clients.get(el.port).send(
              JSON.stringify({
                type: 'start_game',
                data: JSON.stringify({
                  currentPlayerIndex: el.index,
                  ships: dataSend.find(
                    (index: { answerShip: { ships: IShip[]; currentPlayerIndex: number } }) =>
                      index.answerShip.currentPlayerIndex === el.index,
                  ).answerShip.ships,
                }),
                id: 0,
              }),
            ),
          );

          players.forEach((el) =>
            clients.get(el.port).send(
              JSON.stringify({
                type: 'turn',
                data: JSON.stringify({
                  currentPlayer: dataSend.find((player: { turn: boolean }) => player.turn === true).index,
                }),
                id: 0,
              }),
            ),
          );
          break;
        }
        case 'update_room':
        case 'update_winners':
          for (const client of clients.values()) {
            client.send(answer);
          }
          break;
        case 'attack': {
          const data = JSON.parse(answer);
          const dataSend = JSON.parse(data.dataGame);
          const dataTurn = JSON.parse(data.dataTurn);
          const dataWins = JSON.parse(data.dataWins);
          const players = [...JSON.parse(data.players)];

          players.forEach((el) =>
            clients.get(el.port).send(
              JSON.stringify({
                type: 'attack',
                data: JSON.stringify({
                  currentPlayer: dataSend.currentPlayer,
                  status: dataSend.status,
                  position: dataSend.position,
                }),
                id: 0,
              }),
            ),
          );

          if (dataSend.status === 'killed') {
            players.forEach((el) => {
              for (let i = 0; i < dataSend.positionShip.length; i++) {
                clients.get(el.port).send(
                  JSON.stringify({
                    type: 'attack',
                    data: JSON.stringify({
                      currentPlayer: dataSend.currentPlayer,
                      status: 'killed',
                      position: dataSend.positionShip[i],
                    }),
                    id: 0,
                  }),
                );
              }
              for (let i = 0; i < dataSend.positionNear.length; i++) {
                clients.get(el.port).send(
                  JSON.stringify({
                    type: 'attack',
                    data: JSON.stringify({
                      currentPlayer: dataSend.currentPlayer,
                      status: 'miss',
                      position: dataSend.positionNear[i],
                    }),
                    id: 0,
                  }),
                );
              }
            });
          }

          if (dataSend.finish && dataSend.finish.status) {
            players.forEach((el) =>
              clients.get(el.port).send(
                JSON.stringify({
                  type: 'finish',
                  data: JSON.stringify({
                    winPlayer: dataSend.finish.winPlayer,
                  }),
                  id: 0,
                }),
              ),
            );

            for (const client of clients.values()) {
              client.send(
                JSON.stringify({
                  type: 'update_winners',
                  data: JSON.stringify(dataWins),
                  id: 0,
                }),
              );
            }
          } else {
            players.forEach((el) =>
              clients.get(el.port).send(
                JSON.stringify({
                  type: 'turn',
                  data: JSON.stringify({
                    currentPlayer: dataTurn.find((player: { turn: boolean }) => player.turn === true).index,
                  }),
                  id: 0,
                }),
              ),
            );
          }

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
    }
  });

  ws.on('close', () => {
    const data = JSON.parse(handlers(remotePort));
    const dataWins = JSON.parse(data.dataWins);
    const player = data.player;
    const index = data.index;

    clients.delete(remotePort);

    clients.get(player.port).send(
      JSON.stringify({
        type: 'finish',
        data: JSON.stringify({
          winPlayer: index,
        }),
        id: 0,
      }),
    );

    for (const client of clients.values()) {
      client.send(
        JSON.stringify({
          type: 'update_winners',
          data: JSON.stringify(dataWins),
          id: 0,
        }),
      );
    }
    console.error('close', remotePort);
  });
});

wss.on('error', console.error);

wss.on('close', () => {
  console.log('WebSocket server close');
});
