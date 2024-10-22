export interface IReg {
  type: 'reg';
  data: IRegRequest | IRegResponse;
  id: 0;
}

export interface IRegRequest {
  name: string;
  password: string;
}
export interface IRegResponse {
  name: string;
  index: number | string;
  error: boolean;
  errorText: string;
}
