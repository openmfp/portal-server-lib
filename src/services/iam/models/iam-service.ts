export interface IAMService {
  addUser(token: string): Promise<void>;
}
