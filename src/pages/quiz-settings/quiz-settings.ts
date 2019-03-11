import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';

import { Quiz } from '../../models/quiz';

@Component({
  selector: 'page-quiz-settings',
  templateUrl: 'quiz-settings.html'
})
export class QuizSettingsPage {
  /*private newQuiz: Quiz = {
    uuid: '',
    title: '',
    creationDate: -1,
    categorys: [
      {
        name: 'uncategorized',
      }
    ],
    questions: [],
  };*/

  constructor(public viewCtrl: ViewController) {

  }

  enableSaveButton() {
    let enable: boolean = false;
    /*if (this.newQuiz.title) {
      if (this.newQuiz.title.length > 0) {
        enable = true;
      }
    }*/
    return enable;
  }

  save() {
    if (this.enableSaveButton()) {
      //this.newQuiz.creationDate = Math.floor(Date.now() / 1000);
      //this.viewCtrl.dismiss(this.newQuiz);
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

}
