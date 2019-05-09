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
    categorys: [
      {
        name: 'uncategorized',
      }
    ],
    questions: [],
  };

  private background: string;

  @ViewChild(Slides) slides: Slides;

  constructor(public viewCtrl: ViewController) {

  }

  slideChanged() {
    this.background = this.backgrounds[this.slides.getActiveIndex()];
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

      if (this.background !== DefaultQuizSettings.BACKGROUND_IMAGE) {
        let settings: QuizSettings = {backgroundImage: this.background};
        this.newQuiz.settings = settings;
      }

      this.viewCtrl.dismiss(this.newQuiz);
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

}
