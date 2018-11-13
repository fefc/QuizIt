import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';

import { Quiz } from '../../models/quiz';

@Component({
  selector: 'page-quiz-new',
  templateUrl: 'quiz-new.html'
})
export class QuizNewPage {
  private newQuiz: Quiz = {
    id: -1,
    title: '',
    creationDate: -1,
    categorys: [
      {
        name: 'uncategorized',
        questions: []
      }
    ]
  };

  constructor(public viewCtrl: ViewController) {

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
