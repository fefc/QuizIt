import { Category } from './category';

export enum QuestionType {
  classic = 0,
  stopwatch = 1,
  rightPicture = 2,
  video = 3,
  pictures = 4
}

export interface Question {
  readonly uuid: string;
  question: string,
  type: QuestionType,
  rightAnswer: number,
  answers: Array<string>,
  extras: Array<string>,
  category: Category;
  authorId: number
}
