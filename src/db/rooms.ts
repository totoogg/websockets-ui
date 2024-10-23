import { IRoom, IRoomUser } from '../models/index.ts';

class Rooms {
  private rooms: IRoom[] = [];
  private index: number = 0;

  checkUser(user: IRoomUser): boolean {
    const arrPlayers = this.rooms.map((el) => el.roomUsers);
    return !![...arrPlayers.flat()].find((el) => el.index === user.index);
  }

  createRoom(user: IRoomUser): IRoom {
    const room: IRoom = {
      roomId: this.index,
      roomUsers: [user],
    };

    this.index += 1;

    this.rooms.push(room);

    return room;
  }

  getRoomByIndex(indexRoom: number): IRoom | undefined {
    return this.rooms.find((el) => el.roomId === indexRoom);
  }

  getFreeRooms(): IRoom[] {
    return this.rooms.filter((el) => el.roomUsers.length === 1);
  }

  joinRoom(user: IRoomUser, indexRoom: number): void {
    if (this.checkUser(user)) {
      this.rooms.splice(
        this.rooms.findIndex((el) => el.roomUsers.some((player) => player.name === user.name)),
        1,
      );
    }

    this.rooms.find((el) => el.roomId === indexRoom)?.roomUsers.push(user);
  }

  checkSameUserJoinRoom(user: IRoomUser, indexRoom: number): boolean | undefined {
    const roomUsers = this.rooms.find((el) => el.roomId === indexRoom)?.roomUsers;
    return roomUsers?.some((el) => el.index === user.index);
  }
}

export const rooms = new Rooms();
