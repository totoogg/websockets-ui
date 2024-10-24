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
}

export interface IShip {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
}
