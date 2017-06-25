export interface ILabel {
  id: number;
  url: string;
  name: string;
  color: string;
  default: boolean;
  number?: number; // Does not exist
}
