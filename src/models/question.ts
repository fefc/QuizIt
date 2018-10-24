enum Type {
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
  answerOne: string,
  answerTwo: string,
  answerThree: string,
  answerFour: string,
  extra: string,
  authorId: number
}
