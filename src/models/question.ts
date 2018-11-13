export enum Type {
  classic = 0,
  time = 1,
  rightPicture = 2,
  video = 3,
  pictures = 4
}

export interface Question {
  question: string,
  type: Type,
  rightAnswer: number,
  answers: Array<string>,
  extras: Array<string>,
  authorId: number
}
