import { rooms } from '../../db/rooms.ts';
import { users } from '../../db/users.ts';
import { IPosition, IRoom, IShip } from '../../models/index.ts';

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
  const players = rooms
    .getRoomByIndex(Number(indexRoom))
    ?.roomUsers.map((el) => el.index)
    .map((el) => ({
      index: el,
      port: users.getUserByIndex(el)?.port || -1,
    }));

  return players;
}

export function addShips(indexRoom: number, indexPlayer: number, ships: IShip[]) {
  rooms.fillField(indexRoom, indexPlayer, ships);

  if (rooms.checkPlayersReady(indexRoom)) {
    return rooms.getInfoPlayersStartGame(indexRoom, true);
  }
  return false;
}

export function getInfoTurn(indexRoom: number) {
  return rooms.getInfoPlayersStartGame(indexRoom);
}

export function attack(indexRoom: number, indexPlayer: number, position: IPosition) {
  const attack = rooms.attack(indexRoom, indexPlayer, position);

  if (attack && attack.finish?.status) {
    updateWin(indexPlayer);
  }

  return attack;
}

export function randomAttack(indexRoom: number, indexPlayer: number) {
  const attack = rooms.randomAttack(indexRoom, indexPlayer);

  if (attack && attack.finish?.status) {
    updateWin(indexPlayer);
  }

  return attack;
}

export function updateWin(indexPlayer: number) {
  users.updateWin(indexPlayer);
}

export function getWins() {
  return users.getInfoWins();
}

export function deleteRoom(indexRoom: number) {
  rooms.deleteRoom(indexRoom);
}

export function leaveRoom(port: number) {
  if (checkUserByPort(port)) {
    const user = users.getUserByPort(port);
    const indexPlayer = rooms.leaveRoom(user);
    if (typeof indexPlayer === 'number') {
      const player = users.getUserByIndex(indexPlayer);
      updateWin(indexPlayer);
      return {
        dataWins: JSON.stringify(getWins()),
        player,
        index: indexPlayer,
      };
    }
  }
  return '';
}

export function createRoomWithBot(port: number) {
  const user = users.getUserByPort(port);
  const result = {
    idPlayer: user.index,
    idGame: rooms.createRoomWithBot(user).roomId,
  };

  return result;
}

export function botTurn(indexPlayer: number) {
  const attack = rooms.botTurn(indexPlayer);

  if (attack) {
    const result = {
      players: JSON.stringify(getUsersInRoom(attack.gameId)),
      dataTurn: JSON.stringify(getInfoTurn(attack.gameId)),
      dataWins: JSON.stringify(getWins()),
      dataGame: JSON.stringify(attack.attack),
    };

    return result;
  }
  return attack;
}

export function checkUserByPort(port: number): boolean {
  return users.checkUserByPort(port);
}
