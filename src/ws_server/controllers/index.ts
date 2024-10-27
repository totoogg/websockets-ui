import { RawData } from 'ws';
import { logOut, registration } from '../handlers/reg.ts';
import {
  addShips,
  attack,
  createRoom,
  createRoomWithBot,
  deleteRoom,
  getInfoTurn,
  getRooms,
  getUsersInRoom,
  getWins,
  joinRoom,
  leaveRoom,
  randomAttack,
} from '../handlers/room.ts';

const isValidJSON = (str: string) => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

export function handlers(port: number, data?: RawData): string {
  if (data) {
    const str = data.toString();
    if (isValidJSON(str)) {
      const action = JSON.parse(str);

      switch (action.type) {
        case 'reg': {
          const regResponse = registration(JSON.parse(action.data), port);
          const result = {
            type: 'reg',
            data: JSON.stringify(regResponse),
            dataRoom: JSON.stringify(getRooms()),
            dataWins: JSON.stringify(getWins()),
            id: 0,
          };
          return JSON.stringify(result);
        }
        case 'create_room': {
          createRoom(port);
          const result = {
            type: 'update_room',
            data: JSON.stringify(getRooms()),
            id: 0,
          };
          return JSON.stringify(result);
        }
        case 'add_user_to_room': {
          const indexRoom = JSON.parse(action.data).indexRoom;
          if (joinRoom(port, indexRoom)) {
            const result = {
              type: 'update_room_create_game',
              dataRoom: JSON.stringify(getRooms()),
              dataGame: JSON.stringify(indexRoom),
              players: JSON.stringify(getUsersInRoom(indexRoom)),
              id: 0,
            };
            return JSON.stringify(result);
          }
          return 'Incorrect room';
        }
        case 'add_ships': {
          const dataShip = JSON.parse(action.data);
          const startGame = addShips(dataShip.gameId, dataShip.indexPlayer, dataShip.ships);
          if (startGame) {
            const result = {
              type: 'start_game',
              dataGame: JSON.stringify(startGame),
              players: JSON.stringify(getUsersInRoom(dataShip.gameId)),
              id: 0,
            };
            return JSON.stringify(result);
          }
          break;
        }
        case 'attack': {
          const dataShip = JSON.parse(action.data);
          const attackAction = attack(dataShip.gameId, dataShip.indexPlayer, { x: dataShip.x, y: dataShip.y });
          if (attackAction) {
            const result = {
              type: 'attack',
              players: JSON.stringify(getUsersInRoom(dataShip.gameId)),
              dataTurn: JSON.stringify(getInfoTurn(dataShip.gameId)),
              dataWins: JSON.stringify(getWins()),
              dataGame: JSON.stringify(attackAction),
              id: 0,
            };
            if (attackAction.finish?.status) {
              deleteRoom(dataShip.gameId);
            }
            return JSON.stringify(result);
          }
          break;
        }
        case 'randomAttack': {
          const dataShip = JSON.parse(action.data);
          const attackAction = randomAttack(dataShip.gameId, dataShip.indexPlayer);
          if (attackAction) {
            const result = {
              type: 'attack',
              dataGame: JSON.stringify(attackAction),
              dataTurn: JSON.stringify(getInfoTurn(dataShip.gameId)),
              dataWins: JSON.stringify(getWins()),
              players: JSON.stringify(getUsersInRoom(dataShip.gameId)),
              id: 0,
            };
            return JSON.stringify(result);
          }
          break;
        }
        case 'single_play': {
          const room = createRoomWithBot(port);
          const result = {
            type: 'create_game',
            players: JSON.stringify([{ port }]),
            data: JSON.stringify(room),
            id: 0,
          };
          return JSON.stringify(result);
        }

        default:
          console.error('Incorrect type');
          break;
      }
    } else {
      console.error('Incorrect JSON');
    }
  } else {
    const result = JSON.stringify(leaveRoom(port));
    logOut(port);
    return result;
  }
  return '';
}
