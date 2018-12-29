import { Category } from './category';
import { Question } from './question';
import { Participant } from './participant';


export interface Quiz {
  readonly uuid: string;
  title: string,
  creationDate: number,
  selected?: boolean,
  categorys: Array<Category>,
  questions: Array<Question>
}
