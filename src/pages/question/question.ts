import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';

import { Type } from '../../models/question';
import { Question } from '../../models/question';

@Component({
  selector: 'page-question',
  templateUrl: 'question.html'
})
export class QuestionPage {
  private newQuestion: Question = {
    question: '',
    type: Type.classic,
    rightAnswer: -1,
    answers: ['','','',''],
    extras: [],
    authorId: -1
  };

  constructor(public viewCtrl: ViewController) {

  }

  indexTracker(index: number, obj: any) {
    return index;
  }

  enableCreateButton() {
    let enable: boolean = true;
    if (this.newQuestion.question) {
      if (this.newQuestion.question.length > 0) {
        if (this.newQuestion.rightAnswer !== -1) {
          for (let answer of this.newQuestion.answers) {
            if (answer.length === 0) {
              enable = false;
            }
          }
        }
        else {
          enable = false;
        }
      }
      else {
        enable = false;
      }
    }
    else {
      enable = false;
    }
    return enable;
  }

  create() {
    if (this.enableCreateButton()) {
      this.viewCtrl.dismiss(this.newQuestion);
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

}
