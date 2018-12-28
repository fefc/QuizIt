import { Category } from './category';
import { Participant } from './participant';


export interface Quiz {
  readonly uuid: string;
  title: string,
  creationDate: number,
  categorys: Array<Category>,
  selected?: boolean
}
