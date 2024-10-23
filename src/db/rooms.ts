import { IRoom, IRoomUser } from '../models/index.ts';

class Rooms {
  private rooms: IRoom[] = [];

  checkUser(user: IRoomUser): boolean {
    const arrPlayers = this.rooms.map((el) => el.roomUsers);
    return !![...arrPlayers.flat()].find((el) => el.index === user.index);
  }

  createRoom(user: IRoomUser): IRoom {
    const room: IRoom = {
      roomId: this.rooms.length,
      roomUsers: [user],
    };

    this.rooms.push(room);

    return room;
  }

  getRooms(): IRoom[] {
    return this.rooms;
  }
}

export const rooms = new Rooms();
