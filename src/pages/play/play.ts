import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { trigger, keyframes, style, animate, transition } from '@angular/animations';

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
  animations: [
    trigger(
      'titleAnimation', [
        transition(':enter', [
          style({transform: 'translateX(100%)', opacity: 0}),
          animate('500ms', style({transform: 'translateX(0)', opacity: 1}))
        ]),
        transition(':leave', [
          style({transform: 'translateX(0)', opacity: 1}),
          animate('500ms', style({transform: 'translateX(100%)', opacity: 0}))
        ])
      ]),
      trigger(
      'questionAnimation' , [
        transition(':enter', [
          style({transform: 'rotate3d(1, 1, 1, -90deg)', opacity: 0}),
          animate('600ms', style({transform: 'none', opacity: 1}))
        ]),
        transition(':leave', [
          style({transform: 'none', opacity: 1}),
          animate('600ms', style({transform: 'rotate3d(1, 1, 1, -90deg)', opacity: 0}))
        ]),
      ]),
      trigger(
      'answerAnimation' , [
        transition(':enter', [
          style({transform: 'rotate3d(1, 1, 1, -90deg)', opacity: 0}),
          animate('600ms', style({transform: 'none', opacity: 1}))
        ]),
        transition(':leave', [
          style({transform: 'none', opacity: 1}),
          animate('600ms', style({transform: 'rotate3d(1, 1, 1, -90deg)', opacity: 0}))
        ]),
      ]),
      trigger(
      'timeBarAnimation' , [
        transition(':enter', [
          style({opacity: 0}),
          animate('20600ms',
            keyframes([
              style({opacity: 0, offset: 0.029}),
              style({opacity: 1, offset: 0.03}),
              style({width: 0, offset: 1}),
            ])
          )
        ])
      ]),
  ],
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
