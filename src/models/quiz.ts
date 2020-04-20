import { Category } from './category';
import { Question } from './question';
import { QuizSettings } from './quiz-settings';

/* All arguments with ? are faculatative and are
 * not meant to be saved on any permanent storage (local or online)
 */
export interface Quiz {
  readonly uuid: string,
  title: string,
  creationDate: number,
  settings: QuizSettings,
  categorys: Array<Category>,
  questions: Array<Question>,
  selected?: boolean,
}
