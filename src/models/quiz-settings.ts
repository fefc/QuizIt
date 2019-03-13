export namespace DefaultQuizSettings {
    export const COMMON_ANIMATION_DURATION: number = 600;
    export const TIMEBAR_ANIMATION_DURATION: number = 20000;
    export const PLAYER_ANSWER_ANIMATION_DURATION: number = 300;
    export const SHOW_NEXT_DELAY: number = 4000;
    export const AMOUNT_OF_PICUTRES_TO_SHOW: number = 8;
    export const AUTO_PLAY: boolean = true;
}

export interface QuizSettings {
  commonAnimationDuration?: number,
  timeBarAnimationDuration?: number,
  playerAnswerAnimationDuration?: number,
  showNextDelay?: number,
  amountOfPicturesToShow?: number,
  autoPlay?: boolean
}
