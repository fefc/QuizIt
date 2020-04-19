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

/* All arguments with ? are faculatative and are
 * not meant to be saved on any permanent storage (local or online)
 */
export interface Question {
  readonly uuid: string,
  afterQuestionUuid: string,
  question: string,
  type: QuestionType,
  rightAnswer: number,
  answers: Array<string>,
  extras: Array<string>,
  answersUrl?: Array<any>,
  extrasUrl?: Array<any>,
  categoryUuid: string,
  authorId: number,
  selected?: boolean,
  hide: boolean,
  draft: boolean
}
