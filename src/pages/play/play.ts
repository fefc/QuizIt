import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { Quiz } from '../../models/quiz';
import { Category } from '../../models/category';
import { QuestionType } from '../../models/question';
import { Question } from '../../models/question';

enum ScreenStateType {
  displayTitle = 0,
  displayCategoryTitle = 1,
  displayQuestion = 2,
}

@Component({
  selector: 'page-play',
  templateUrl: 'play.html'
})

export class PlayPage {
  private ScreenStateType = ScreenStateType; //for use in Angluar html
  private quiz: Quiz;
  private currentCategory: number;
  private currentQuestion: number;
  private screenState: ScreenStateType;

  constructor(public navCtrl: NavController,params: NavParams) {
    this.quiz = params.data.quiz;

    this.currentCategory = 0;
    this.currentQuestion = 0;

    this.screenState = ScreenStateType.displayTitle;
  }

  next() {
    if (this.screenState === ScreenStateType.displayTitle) {
      this.screenState = ScreenStateType.displayCategoryTitle;
    }
    else if (this.screenState === ScreenStateType.displayCategoryTitle) {
      this.screenState = ScreenStateType.displayQuestion;
    }
    else if (this.screenState === ScreenStateType.displayQuestion) {
      if (this.currentQuestion < this.quiz.categorys[this.currentCategory].questions.length - 1) {
        this.currentQuestion++;
      }
      else {
        if (this.currentCategory < this.quiz.categorys.length - 1) {
          this.currentCategory++;
          this.currentQuestion = 0;
          this.screenState = ScreenStateType.displayCategoryTitle;
        }
        else {
          this.navCtrl.pop();
        }
      }
    }

  }

}
