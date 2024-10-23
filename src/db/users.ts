import { IUser, IRegRequest, IRegResponse, IRoomUser } from '../models/index.ts';

class Users {
  private users: IUser[] = [];

  checkUsers(data: IRegRequest): IRegResponse | boolean {
    const userIndex = this.users.findIndex((el) => el.name === data.name.trim());

    if (userIndex !== -1) {
      const user = this.users[userIndex];
      if (user.login) {
        return this.createResponse(user.name, 'User is already logged in', userIndex, true);
      } else {
        if (user.password !== data.password.trim()) {
          return this.createResponse(user.name, 'Incorrect password or name', userIndex, true);
        }
      }
    }
    return true;
  }

  logIn(data: IRegRequest, port: number): IRegResponse {
    const userIndex = this.users.findIndex((el) => el.name === data.name.trim());

    if (userIndex !== -1) {
      this.users[userIndex].login = true;
      this.users[userIndex].port = port;
      return this.createResponse(data.name.trim(), '', userIndex, false);
    }
    return this.createUser(data, port);
  }

  private createUser(data: IRegRequest, port: number): IRegResponse {
    const user: IUser = {
      login: true,
      name: data.name.trim(),
      password: data.password.trim(),
      wins: 0,
      port,
    };
    this.users.push(user);
    return this.createResponse(user.name, '', this.users.length - 1, false);
  }

  logOut(port: number): void {
    const userIndex = this.users.findIndex((el) => el.port === port);
    if (userIndex !== -1) {
      this.users[userIndex].port = -1;
      this.users[userIndex].login = false;
    }
  }

  private createResponse(name: string, errorText: string, index: number, error: boolean): IRegResponse {
    return {
      name,
      error,
      errorText,
      index,
    };
  }

  getUserByPort(port: number): IRoomUser {
    const userIndex = this.users.findIndex((el) => el.port === port);
    const userName = this.users[userIndex].name;
    const result = {
      index: userIndex,
      name: userName,
    };

    return result;
  }
}

export const users = new Users();
