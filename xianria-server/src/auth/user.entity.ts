export interface User {
  uid: string;
  username: string | null;
  passwordHash: string | null;
  isGuest: boolean;
  coins: number;
  createdAt: number;
}
