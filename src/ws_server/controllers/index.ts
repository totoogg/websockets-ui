import { RawData } from 'ws';
import { logOut, registration } from '../handlers/reg.ts';
import { createRoom, getRooms } from '../handlers/room.ts';

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
        case 'add_user_to_room':
          break;
        case 'add_ships':
          break;
        case 'attack':
          break;
        case 'randomAttack':
          break;
        case 'single_play':
          break;

        default:
          console.error('Incorrect type');
          break;
      }
    } else {
      console.error('Incorrect JSON');
    }
  } else {
    logOut(port);
  }
  return '';
}
