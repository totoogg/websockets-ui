import { rooms } from '../../db/rooms.ts';
import { users } from '../../db/users.ts';
import { IRoom } from '../../models/IRoom.ts';

export function createRoom(port: number): void {
  const user = users.getUserByPort(port);

  if (!rooms.checkUser(user)) {
    rooms.createRoom(user);
  }
}

export function getRooms(): IRoom[] {
  return rooms.getRooms();
}
