import { WebSocketServer } from 'ws';
import 'dotenv/config';
import { handlers } from './controllers/index.ts';
import { IShip } from '../models/index.ts';
import { botTurn } from './handlers/room.ts';

const WS_PORT = Number(process.env.WS_PORT) || 3000;

export const wss = new WebSocketServer({ port: WS_PORT });

const clients = new Map();

wss.on('listening', () => {
  console.log(`Start WebSocket server on the ${WS_PORT} port!`);
});

wss.on('connection', (ws, request) => {
  const remotePort = request.socket.remotePort || 0;

  console.log(`The client connected to port ${remotePort}!`);

  ws.on('error', console.error);

  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);

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

          console.log(`Sent message: ${JSON.stringify(data)}`);
          console.log(`Sent message: ${JSON.stringify(dataRoom)}`);
          console.log(`Sent message: ${JSON.stringify(dataWins)}`);

          for (const client of clients.values()) {
            client.send(JSON.stringify(dataRoom));
            client.send(JSON.stringify(dataWins));
          }

          break;
        }
        case 'create_game': {
          const data = JSON.parse(answer);
          const players = [...JSON.parse(data.players)];
          let rooms;

          if (data.dataRoom) {
            rooms = [...JSON.parse(data.dataRoom)];

            delete data.dataRoom;
          }

          delete data.player;

          players.forEach((el) => clients.get(el.port).send(JSON.stringify(data)));

          console.log(`Sent message: ${JSON.stringify(data)}`);

          if (rooms) {
            const answer = {
              type: 'update_room',
              data: JSON.stringify(rooms),
              id: 0,
            };

            for (const client of clients.values()) {
              client.send(JSON.stringify(answer));
            }

            console.log(`Sent message: ${JSON.stringify(answer)}`);
          }

          break;
        }
        case 'start_game': {
          const data = JSON.parse(answer);
          const dataSend = JSON.parse(data.dataGame);
          const players = [...JSON.parse(data.players)];

          players.forEach((el) => {
            if (el.port > 0) {
              const sentData = {
                type: 'start_game',
                data: JSON.stringify({
                  currentPlayerIndex: el.index,
                  ships: dataSend.find(
                    (index: { answerShip: { ships: IShip[]; currentPlayerIndex: number } }) =>
                      index.answerShip.currentPlayerIndex === el.index,
                  ).answerShip.ships,
                }),
                id: 0,
              };

              clients.get(el.port).send(JSON.stringify(sentData));

              console.log(`Sent message: ${JSON.stringify(sentData)}`);
            }
          });

          players.forEach((el, i) => {
            if (el.port > 0) {
              const sentData = {
                type: 'turn',
                data: JSON.stringify({
                  currentPlayer: dataSend.find((player: { turn: boolean }) => player.turn === true).index,
                }),
                id: 0,
              };

              clients.get(el.port).send(JSON.stringify(sentData));

              if (i === 0) {
                console.log(`Sent message: ${JSON.stringify(sentData)}`);
              }
            }
          });

          if (players[1].port === -1) {
            const attack = botTurn(players[0].index);
            if (attack) {
              actionAttack(JSON.stringify(attack));
            }
          }

          break;
        }
        case 'update_room':
        case 'update_winners':
          for (const client of clients.values()) {
            client.send(answer);
          }

          console.log(`Sent message: ${answer}`);

          break;
        case 'attack': {
          actionAttack(answer);
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

          console.log(`Sent message: ${JSON.stringify(dataRoom)}`);

          const players = [...JSON.parse(data.players)];

          players.forEach((el) => {
            const sentData = {
              type: 'create_game',
              data: JSON.stringify({
                idGame: data.dataGame,
                idPlayer: el.index,
              }),
              id: 0,
            };

            clients.get(el.port).send(JSON.stringify(sentData));

            console.log(`Sent message: ${JSON.stringify(sentData)}`);
          });
          break;
        }
      }
    }
  });

  ws.on('close', () => {
    const data = JSON.parse(handlers(remotePort));

    clients.delete(remotePort);

    if (!Array.isArray(data)) {
      const dataWins = JSON.parse(data.dataWins);
      const player = data.player;
      const index = data.index;

      if (player && player.port !== -1) {
        const sentData = {
          type: 'finish',
          data: JSON.stringify({
            winPlayer: index,
          }),
          id: 0,
        };
        clients.get(player.port).send(JSON.stringify(sentData));

        console.log(`Sent message: ${JSON.stringify(sentData)}`);

        const sentWinner = {
          type: 'update_winners',
          data: JSON.stringify(dataWins),
          id: 0,
        };

        for (const client of clients.values()) {
          client.send(JSON.stringify(sentWinner));
        }

        console.log(`Sent message: ${JSON.stringify(sentWinner)}`);
      }
    } else {
      const answer = {
        type: 'update_room',
        data: JSON.stringify(data),
        id: 0,
      };

      for (const client of clients.values()) {
        client.send(JSON.stringify(answer));
      }

      console.log(`Sent message: ${JSON.stringify(answer)}`);
    }

    console.log(`The client on port ${remotePort} has disconnected!`);
  });
});

wss.on('error', console.error);

wss.on('close', () => {
  console.log(`WebSocket server on port ${WS_PORT} is closed!`);
});

function actionAttack(answer: string) {
  const data = JSON.parse(answer);
  const dataSend = JSON.parse(data.dataGame);
  const dataTurn = JSON.parse(data.dataTurn);
  const dataWins = JSON.parse(data.dataWins);
  const players = [...JSON.parse(data.players)];

  players.forEach((el, i) => {
    if (el.port > 0) {
      const sentData = {
        type: 'attack',
        data: JSON.stringify({
          currentPlayer: dataSend.currentPlayer,
          status: dataSend.status,
          position: dataSend.position,
        }),
        id: 0,
      };

      clients.get(el.port).send(JSON.stringify(sentData));

      if (i === 0) {
        console.log(`Sent message: ${JSON.stringify(sentData)}`);
      }
    }
  });

  if (dataSend.status === 'killed') {
    players.forEach((el) => {
      if (el.port > 0) {
        for (let i = 0; i < dataSend.positionShip.length; i++) {
          const sentData = {
            type: 'attack',
            data: JSON.stringify({
              currentPlayer: dataSend.currentPlayer,
              status: 'killed',
              position: dataSend.positionShip[i],
            }),
            id: 0,
          };

          clients.get(el.port).send(JSON.stringify(sentData));

          console.log(`Sent message: ${JSON.stringify(sentData)}`);
        }

        for (let i = 0; i < dataSend.positionNear.length; i++) {
          const sentData = {
            type: 'attack',
            data: JSON.stringify({
              currentPlayer: dataSend.currentPlayer,
              status: 'miss',
              position: dataSend.positionNear[i],
            }),
            id: 0,
          };

          clients.get(el.port).send(JSON.stringify(sentData));

          console.log(`Sent message: ${JSON.stringify(sentData)}`);
        }
      }
    });
  }

  if (dataSend.finish && dataSend.finish.status) {
    players.forEach((el, i) => {
      if (el.port > 0) {
        const sentData = {
          type: 'finish',
          data: JSON.stringify({
            winPlayer: dataSend.finish.winPlayer,
          }),
          id: 0,
        };

        clients.get(el.port).send(JSON.stringify(sentData));

        if (i === 0) {
          console.log(`Sent message: ${JSON.stringify(sentData)}`);
        }
      }
    });

    const sentWinner = {
      type: 'update_winners',
      data: JSON.stringify(dataWins),
      id: 0,
    };

    for (const client of clients.values()) {
      client.send(JSON.stringify(sentWinner));
    }

    console.log(`Sent message: ${JSON.stringify(sentWinner)}`);
  } else {
    players.forEach((el, i) => {
      if (el.port > 0) {
        const sentData = {
          type: 'turn',
          data: JSON.stringify({
            currentPlayer: dataTurn.find((player: { turn: boolean }) => player.turn === true).index,
          }),
          id: 0,
        };

        clients.get(el.port).send(JSON.stringify(sentData));

        if (i === 0) {
          console.log(`Sent message: ${JSON.stringify(sentData)}`);
        }
      }
    });

    if (players[1].port === -1 && dataTurn[1].turn) {
      const attack = botTurn(players[0].index);
      if (attack) {
        actionAttack(JSON.stringify(attack));
      }
    }
  }
}
