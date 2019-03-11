import { Category } from './category';
import { Question } from './question';
import { QuizSettings } from './quizSettings';
//import { Participant } from './participant';


export interface Quiz {
  readonly uuid: string;
  title: string,
  creationDate: number,
  selected?: boolean,
  settings?: QuizSettings,
  categorys: Array<Category>,
  questions: Array<Question>
}
