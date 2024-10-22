import { IRegRequest, IRegResponse } from '../../models/index.ts';
import { users } from '../../db/users.ts';

export function registration(action: IRegRequest, port: number): IRegResponse {
  const answerDb = users.checkUsers(action);
  if (typeof answerDb === 'boolean') {
    return users.logIn(action, port);
  } else {
    return answerDb;
  }
}

export function logOut(port: number): void {
  users.logOut(port);
}
