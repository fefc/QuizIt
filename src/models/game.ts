import { QuestionType } from './question';

export enum GameState {
  playersJoining = 1,
  questionDisplayed = 2,
  loading = 3,
  ended = 4,
  connectionLost = 5
}

export interface Game {
  readonly uuid: string,
  readonly title: string,
  readonly host: string,
  state: GameState,
  currentQuestionType?: QuestionType,
  address?: string
}
