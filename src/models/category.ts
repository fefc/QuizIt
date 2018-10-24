import { Question } from './question';

export interface Category {
  name: string,
  questions: Array<Question>
}
