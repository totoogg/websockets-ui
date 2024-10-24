import { IRoom, IRoomUser, IShip } from '../models/index.ts';

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
      roomUsers: [
        {
          name: user.name,
          index: user.index,
          field: new Array(10).fill(new Array(10).fill(0)),
          ships: false,
          answerShip: { currentPlayerIndex: user.index, ships: [] },
        },
      ],
    };

    this.index += 1;

    this.rooms.push(room);

    return room;
  }

  getRoomByIndex(indexRoom: number): IRoom | undefined {
    return this.rooms.find((el) => el.roomId === indexRoom);
  }

  getFreeRooms(): IRoom[] {
    const arrFreeRooms = this.rooms.filter((el) => el.roomUsers.length === 1);
    return arrFreeRooms.map((el) => ({
      roomId: el.roomId,
      roomUsers: el.roomUsers.map((user) => ({ index: user.index, name: user.name })),
    }));
  }

  joinRoom(user: IRoomUser, indexRoom: number): void {
    if (this.checkUser(user)) {
      this.rooms.splice(
        this.rooms.findIndex((el) => el.roomUsers.some((player) => player.name === user.name)),
        1,
      );
    }

    const roomIndex = this.rooms.findIndex((el) => el.roomId === indexRoom);
    this.rooms[roomIndex].roomUsers.push({
      name: user.name,
      index: user.index,
      field: new Array(10).fill(new Array(10).fill(0)),
      ships: false,
      answerShip: { currentPlayerIndex: user.index, ships: [] },
    });
  }

  checkSameUserJoinRoom(user: IRoomUser, indexRoom: number): boolean | undefined {
    const roomUsers = this.rooms.find((el) => el.roomId === indexRoom)?.roomUsers;
    return roomUsers?.some((el) => el.index === user.index);
  }

  fillField(gameId: number, indexPlayer: number, ships: IShip[]) {
    const roomIndex = this.rooms.findIndex((el) => el.roomId === Number(gameId));
    const playerIndex = this.rooms[roomIndex].roomUsers.findIndex((el) => el.index === indexPlayer);

    ships.forEach((el) => {
      if (el.direction) {
        for (let index = 0; index < el.length; index++) {
          if (this.rooms[roomIndex].roomUsers[playerIndex].field) {
            this.rooms[roomIndex].roomUsers[playerIndex].field[el.position.y + index][el.position.x] = 2;
          }
        }
      } else {
        for (let index = 0; index < el.length; index++) {
          if (this.rooms[roomIndex].roomUsers[playerIndex].field) {
            this.rooms[roomIndex].roomUsers[playerIndex].field[el.position.y][el.position.x + index] = 2;
          }
        }
      }
    });

    if (this.rooms[roomIndex].roomUsers[playerIndex].answerShip) {
      this.rooms[roomIndex].roomUsers[playerIndex].answerShip.ships = ships;
      this.rooms[roomIndex].roomUsers[playerIndex].answerShip.currentPlayerIndex = indexPlayer;
    }

    if ('ships' in this.rooms[roomIndex].roomUsers[playerIndex]) {
      this.rooms[roomIndex].roomUsers[playerIndex].ships = true;
    }
  }

  checkPlayersReady(gameId: number): boolean {
    const room = this.rooms.find((el) => el.roomId === Number(gameId));

    if (room) {
      return room.roomUsers.every((el) => el.ships === true);
    }

    return false;
  }

  getInfoPlayersStartGame(gameId: number) {
    const room = this.rooms.find((el) => el.roomId === Number(gameId));

    if (room) {
      return room.roomUsers.map((el) => el.answerShip);
    }

    return false;
  }
}

export const rooms = new Rooms();
