import { Component, ViewChild } from '@angular/core';
import { ViewController, Slides } from 'ionic-angular';

import { Quiz } from '../../models/quiz';
import { DefaultQuizSettings } from '../../models/quiz-settings';
import { QuizSettings } from '../../models/quiz-settings';

@Component({
  selector: 'page-quiz-new',
  templateUrl: 'quiz-new.html'
})
export class QuizNewPage {
  private backgrounds: Array<string> = ['0.jpg',
                                        '1.jpg'];

  private newQuiz: Quiz = {
    uuid: '',
    title: '',
    creationDate: -1,
    settings: {
      commonAnimationDuration: DefaultQuizSettings.COMMON_ANIMATION_DURATION,
      timeBarAnimationDuration: DefaultQuizSettings.TIMEBAR_ANIMATION_DURATION,
      playerAnswerAnimationDuration: DefaultQuizSettings.PLAYER_ANSWER_ANIMATION_DURATION,
      showNextDelay: DefaultQuizSettings.SHOW_NEXT_DELAY,
      amountOfPicturesToShow: DefaultQuizSettings.AMOUNT_OF_PICUTRES_TO_SHOW,
      autoPlay: DefaultQuizSettings.AUTO_PLAY,
      startMessage: DefaultQuizSettings.START_MESSAGE,
      endMessage: DefaultQuizSettings.END_MESSAGE,
      backgroundImage: DefaultQuizSettings.BACKGROUND_IMAGE,
      extraDisplayDuration: DefaultQuizSettings.EXTRA_DISPLAY_DURATION,
    },
    categorys: [
      {
        uuid: '',
        name: 'uncategorized',
      }
    ],
    questions: [],
  };

  @ViewChild(Slides) slides: Slides;

  constructor(public viewCtrl: ViewController) {

  }

  slideChanged() {
    this.newQuiz.settings.backgroundImage = this.backgrounds[this.slides.getActiveIndex()];
  }

  enableCreateButton() {
    let enable: boolean = false;
    if (this.newQuiz.title) {
      if (this.newQuiz.title.length > 0) {
        enable = true;
      }
    }
    return enable;
  }

  create() {
    if (this.enableCreateButton()) {
      this.newQuiz.creationDate = Math.floor(Date.now() / 1000);
      this.viewCtrl.dismiss(this.newQuiz);
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

}
