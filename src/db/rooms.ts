import { IPosition, IRoom, IRoomUser, IShip } from '../models/index.ts';
import { botFields } from './fields.ts';

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
          field: new Array(10).fill(0).map(() => new Array(10).fill(0)),
          ships: false,
          answerShip: { currentPlayerIndex: user.index, ships: [] },
          turn: false,
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
      field: new Array(10).fill(0).map(() => new Array(10).fill(0)),
      ships: false,
      answerShip: { currentPlayerIndex: user.index, ships: [] },
      turn: false,
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

  getInfoPlayersStartGame(gameId: number, startGame: boolean = false) {
    const indexRoom = this.rooms.findIndex((el) => el.roomId === Number(gameId));
    const room = this.rooms[indexRoom];

    if (room) {
      const players = room.roomUsers;

      if (startGame) {
        if (players[1].bot) {
          this.rooms[indexRoom].roomUsers[0].turn = true;
        } else {
          const turnIndex = Math.random() > 0.5 ? players[0].index : players[1].index;
          const playerIndex = players.findIndex((el) => el.index === turnIndex);
          this.rooms[indexRoom].roomUsers[playerIndex].turn = true;
        }
      }

      return room.roomUsers.map((el) => ({
        turn: el.turn,
        index: el.index,
        answerShip: el.answerShip,
      }));
    }

    return false;
  }

  private checkKill(gameId: number, indexPlayer: number, position: IPosition) {
    const roomIndex = this.rooms.findIndex((el) => el.roomId === Number(gameId));
    const playerIndex = this.rooms[roomIndex].roomUsers.findIndex((el) => el.index !== indexPlayer);
    const field = this.rooms[roomIndex].roomUsers[playerIndex].field || [[]];

    const positionShip = [{ ...position, status: 'shot' }];

    for (let i = 0; i < 4; i++) {
      if (i === 0) {
        const x = position.x;
        let y = position.y;
        while (field[y - 1] && (field[y - 1][x] === 3 || field[y - 1][x] === 2)) {
          const position = {
            x,
            y: y - 1,
            status: field[y - 1][x] === 2 ? 'live' : 'shot',
          };
          positionShip.push(position);
          y -= 1;
        }
      }
      if (i === 1) {
        let x = position.x;
        const y = position.y;
        while (field[y][x + 1] && (field[y][x + 1] === 3 || field[y][x + 1] === 2)) {
          const position = {
            x: x + 1,
            y,
            status: field[y][x + 1] === 2 ? 'live' : 'shot',
          };
          positionShip.push(position);
          x += 1;
        }
      }
      if (i === 2) {
        const x = position.x;
        let y = position.y;
        while (field[y + 1] && (field[y + 1][x] === 3 || field[y + 1][x] === 2)) {
          const position = {
            x,
            y: y + 1,
            status: field[y + 1][x] === 2 ? 'live' : 'shot',
          };
          positionShip.push(position);
          y += 1;
        }
      }
      if (i === 3) {
        let x = position.x;
        const y = position.y;
        while (field[y][x - 1] && (field[y][x - 1] === 3 || field[y][x - 1] === 2)) {
          const position = {
            x: x - 1,
            y,
            status: field[y][x - 1] === 2 ? 'live' : 'shot',
          };
          positionShip.push(position);
          x -= 1;
        }
      }
    }

    if (positionShip.every((el) => el.status === 'shot')) {
      const positionNear: IPosition[] = [];
      positionShip.forEach((el) => {
        if (field[el.y - 1]) {
          if (field[el.y - 1][el.x] === 0) {
            field[el.y - 1][el.x] = 1;
            positionNear.push({ x: el.x, y: el.y - 1 });
          }

          if (typeof field[el.y - 1][el.x + 1] === 'number' && field[el.y - 1][el.x + 1] === 0) {
            field[el.y - 1][el.x + 1] = 1;
            positionNear.push({ x: el.x + 1, y: el.y - 1 });
          }

          if (typeof field[el.y - 1][el.x - 1] === 'number' && field[el.y - 1][el.x - 1] === 0) {
            field[el.y - 1][el.x - 1] = 1;
            positionNear.push({ x: el.x - 1, y: el.y - 1 });
          }
        }

        if (field[el.y + 1]) {
          if (field[el.y + 1][el.x] === 0) {
            field[el.y + 1][el.x] = 1;
            positionNear.push({ x: el.x, y: el.y + 1 });
          }

          if (typeof field[el.y + 1][el.x + 1] === 'number' && field[el.y + 1][el.x + 1] === 0) {
            field[el.y + 1][el.x + 1] = 1;
            positionNear.push({ x: el.x + 1, y: el.y + 1 });
          }

          if (typeof field[el.y + 1][el.x - 1] === 'number' && field[el.y + 1][el.x - 1] === 0) {
            field[el.y + 1][el.x - 1] = 1;
            positionNear.push({ x: el.x - 1, y: el.y + 1 });
          }
        }

        if (typeof field[el.y][el.x - 1] === 'number' && field[el.y][el.x - 1] === 0) {
          field[el.y][el.x - 1] = 1;
          positionNear.push({ x: el.x - 1, y: el.y });
        }

        if (typeof field[el.y][el.x + 1] === 'number' && field[el.y][el.x + 1] === 0) {
          field[el.y][el.x + 1] = 1;
          positionNear.push({ x: el.x + 1, y: el.y });
        }
      });

      return { positionNear, positionShip };
    } else {
      return false;
    }
  }

  attack(gameId: number, indexPlayer: number, position: IPosition) {
    const roomIndex = this.rooms.findIndex((el) => el.roomId === Number(gameId));
    const playerIndex = this.rooms[roomIndex].roomUsers.findIndex((el) => el.index !== indexPlayer);
    const playerIndexTurn = this.rooms[roomIndex].roomUsers.findIndex((el) => el.index === indexPlayer);
    const field = this.rooms[roomIndex].roomUsers[playerIndex].field || [[]];
    const cell = field[position.y][position.x];

    if (this.rooms[roomIndex].roomUsers[playerIndexTurn].turn) {
      if (cell === 1 || cell === 3) {
        return false;
      }

      if (this.rooms[roomIndex].roomUsers[playerIndex].field) {
        if (cell === 2) {
          this.rooms[roomIndex].roomUsers[playerIndex].field[position.y][position.x] = 3;

          const checkKill = this.checkKill(gameId, indexPlayer, position);

          if (checkKill) {
            const finish = this.rooms[roomIndex].roomUsers[playerIndex].field.flat().filter((el) => el === 3);

            return {
              positionShip: checkKill.positionShip,
              currentPlayer: indexPlayer,
              position,
              positionNear: checkKill.positionNear,
              status: 'killed',
              finish: { status: finish.length === 20, winPlayer: indexPlayer },
            };
          }
          return { currentPlayer: indexPlayer, position, status: 'shot' };
        }

        if (cell === 0) {
          this.rooms[roomIndex].roomUsers[playerIndex].field[position.y][position.x] = 1;

          this.rooms[roomIndex].roomUsers[playerIndex].turn = true;
          this.rooms[roomIndex].roomUsers[playerIndexTurn].turn = false;

          return { currentPlayer: indexPlayer, position, status: 'miss' };
        }
      }
    }

    return false;
  }

  randomAttack(gameId: number, indexPlayer: number) {
    const roomIndex = this.rooms.findIndex((el) => el.roomId === Number(gameId));
    const playerIndex = this.rooms[roomIndex].roomUsers.findIndex((el) => el.index !== indexPlayer);
    const field = structuredClone(this.rooms[roomIndex].roomUsers[playerIndex].field) || [[]];

    for (let i = 0; i < field.length; i++) {
      for (let x = 0; x < field[i].length; x++) {
        if (field[i][x] === 1 || field[i][x] === 3) {
          field[i][x] = -1;
        }
        if (field[i][x] === 0 || field[i][x] === 2) {
          field[i][x] = x + i * 10;
        }
      }
    }

    const arrAttack = field.flat().filter((el) => el !== -1);

    const randomAttack = arrAttack[this.randomNumber(0, arrAttack.length - 1)];

    const position = {
      x: randomAttack % 10,
      y: Math.floor(randomAttack / 10),
    };

    return this.attack(gameId, indexPlayer, position);
  }

  private randomNumber(min: number, max: number) {
    return Math.floor(min + Math.random() * (max + 1 - min));
  }

  deleteRoom(gameId: number) {
    const roomIndex = this.rooms.findIndex((el) => el.roomId === Number(gameId));
    this.rooms.splice(roomIndex, 1);
  }

  leaveRoom(user: IRoomUser) {
    const indexRoom = this.rooms.findIndex((el) => el.roomUsers.some((player) => player.index === user.index));
    const playerRemained = this.rooms[indexRoom].roomUsers.find((el) => el.index !== user.index);
    const indexPlayer = playerRemained?.index;

    this.deleteRoom(this.rooms[indexRoom].roomId);

    return indexPlayer;
  }

  createRoomWithBot(user: IRoomUser): IRoom {
    if (this.checkUser(user)) {
      this.rooms.splice(
        this.rooms.findIndex((el) => el.roomUsers.some((player) => player.name === user.name)),
        1,
      );
    }

    const room: IRoom = {
      roomId: this.index,
      roomUsers: [
        {
          name: user.name,
          index: user.index,
          field: new Array(10).fill(0).map(() => new Array(10).fill(0)),
          ships: false,
          answerShip: { currentPlayerIndex: user.index, ships: [] },
          turn: false,
        },
        {
          name: 'bot',
          index: user.index + 1,
          field: botFields[this.randomNumber(0, botFields.length - 1)],
          ships: true,
          answerShip: { currentPlayerIndex: user.index + 1, ships: [] },
          turn: false,
          bot: true,
        },
      ],
    };

    this.index += 1;

    this.rooms.push(room);

    return room;
  }

  botTurn(indexPlayer: number) {
    const indexRoom = this.rooms.findIndex((el) => el.roomUsers.some((player) => player.index === indexPlayer));
    const bot = this.rooms[indexRoom].roomUsers[1];
    const gameId = this.rooms[indexRoom].roomId;

    if (bot.turn) {
      return {
        attack: this.randomAttack(gameId, bot.index),
        gameId,
      };
    }

    return false;
  }
}

export const rooms = new Rooms();
