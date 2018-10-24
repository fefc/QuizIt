import { Category } from './category';
import { Participant } from './participant';


export interface Quiz {
  name: string,
  creationDate: number,
  categories: Array<Category>,
  participants: Array<Participant>
}
