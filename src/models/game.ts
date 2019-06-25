import { QuestionType } from './question';

export enum GameState {
  playersJoining = 0,
  questionDisplayed = 1,
  loading = 2,
  ended = 3,
  connectionLost = 4
}

export interface Game {
  readonly uuid: string,
  readonly title: string,
  readonly host: string,
  state: GameState,
  currentQuestionType?: QuestionType,
  address?: string
}
