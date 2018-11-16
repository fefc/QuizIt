import { Category } from './category';
import { Participant } from './participant';


export interface Quiz {
  readonly id: number,
  title: string,
  creationDate: number,
  categorys: Array<Category>,
  selected?: boolean
}
