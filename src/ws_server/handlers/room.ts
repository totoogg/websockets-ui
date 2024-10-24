import { rooms } from '../../db/rooms.ts';
import { users } from '../../db/users.ts';
import { IRoom, IShip } from '../../models/index.ts';

export function createRoom(port: number): void {
  const user = users.getUserByPort(port);

  if (!rooms.checkUser(user)) {
    rooms.createRoom(user);
  }
}

export function getRooms(): IRoom[] {
  return rooms.getFreeRooms();
}

export function joinRoom(port: number, indexRoom: number): boolean {
  const user = users.getUserByPort(port);
  if (!rooms.checkSameUserJoinRoom(user, indexRoom)) {
    rooms.joinRoom(user, indexRoom);
    return true;
  }
  return false;
}

export function getUsersInRoom(indexRoom: number) {
  return rooms
    .getRoomByIndex(Number(indexRoom))
    ?.roomUsers.map((el) => el.index)
    .map((el) => ({
      index: el,
      port: users.getUserByIndex(el).port,
    }));
}

export function addShips(indexRoom: number, indexPlayer: number, ships: IShip[]) {
  rooms.fillField(indexRoom, indexPlayer, ships);

  if (rooms.checkPlayersReady(indexRoom)) {
    return rooms.getInfoPlayersStartGame(indexRoom);
  }
  return false;
}
