import { Category } from './category';

export enum QuestionType {
  classic = 1,
  stopwatch = 2,
  rightPicture = 3
}

export enum ExtraType {
  none,
  picture,
  video
}

export interface Question {
  readonly uuid: string,
  question: string,
  type: QuestionType,
  rightAnswer: number,
  answers: Array<string>,
  extras: Array<string>,
  categoryUuid: string,
  authorId: number,
  selected?: boolean,
  hide: boolean,
  draft: boolean
}
