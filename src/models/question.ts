export enum QuestionType {
  classic = 0,
  time = 1,
  rightPicture = 2,
  video = 3,
  pictures = 4
}

export interface Question {
  question: string,
  type: QuestionType,
  rightAnswer: number,
  answers: Array<string>,
  extras: Array<string>,
  authorId: number
}
