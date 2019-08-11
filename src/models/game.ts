export enum GameState {
  playersJoining = 1,
  loading = 2,
  ended = 3,
  connectionLost = 4,
  quickedOut = 5,
  classicQuestionDisplayed = 100,
  pictureQuestionDisplayed = 101
}

export interface Game {
  readonly uuid: string,
  state: GameState
}
