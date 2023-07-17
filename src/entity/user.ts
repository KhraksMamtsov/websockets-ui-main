export interface User {
  name: string;
  password: string;
  id: number;
  connectionId: (message: string) => void;
  answer: (message: string) => void;
}
