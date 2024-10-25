export interface IRoom {
  roomId: number;
  roomUsers: IRoomUser[];
}

export interface IRoomUser {
  name: string;
  index: number;
  field?: number[][];
  ships?: boolean;
  answerShip?: {
    ships: IShip[];
    currentPlayerIndex: number;
  };
  turn?: boolean;
}

export interface IShip {
  position: IPosition;
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
}

export interface IPosition {
  x: number;
  y: number;
}
