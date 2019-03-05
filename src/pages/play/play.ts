import { Component, NgZone } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { File } from '@ionic-native/file';
import { Httpd, HttpdOptions } from '@ionic-native/httpd';
import { trigger, state, keyframes, style, animate, transition } from '@angular/animations';

import { Quiz } from '../../models/quiz';
import { Category } from '../../models/category';
import { QuestionType } from '../../models/question';
import { Question } from '../../models/question';
import { Player } from '../../models/player';

enum ScreenStateType {
  playersJoining,
  displayTitle,
  hideTitle,
  displayCategoryTitle,
  hideCategoryTitle,
  displayQuestion,
  displayPlayersAnswer,
  hideQuestion,
}

@Component({
  selector: 'page-play',
  animations: [
    trigger(
      'titleAnimation', [
        transition(':enter', [
          style({transform: 'scale(0)', opacity: 0}),
          animate('500ms', style({transform: 'scale(1)', opacity: 1}))
        ]),
        transition(':leave', [
          style({transform: 'scale(1)', opacity: 1}),
          animate('500ms', style({transform: 'scale(0)', opacity: 0}))
        ])
      ]),
      trigger(
        'playerAnimation', [
          transition(':enter', [
            style({transform: 'scale(0)', opacity: 0}),
            animate('250ms',
              keyframes([
                style({transform: 'scale(1.1)', opacity: 1, offset: 0.9}),
                style({transform: 'scale(1)', offset: 1}),
              ])
            )
          ]),
          transition(':leave', [
            style({transform: 'scale(1)', opacity: 1}),
            animate('250ms', style({transform: 'scale(0)', opacity: 0}))
          ])
        ]),
        trigger(
          'playerAnswerAnimation', [
            transition(':enter', [
              style({opacity: 0}),
              animate('{{time}}ms', style({opacity: 1}))
            ], { params: { time: 600 } }),
            transition(':leave', [
              style({opacity: 1}),
              animate('{{time}}ms', style({opacity: 0}))
            ], { params: { time: 600 } })
          ]),
      trigger(
      'questionAnimation' , [
        transition(':enter', [
          style({transform: 'rotate3d(1, 1, 1, -90deg)', opacity: 0}),
          animate('{{time}}ms', style({transform: 'none', opacity: 1}))
          ], { params: { time: 600 } }),
        transition(':leave', [
          style({transform: 'none', opacity: 1}),
          animate('{{time}}ms', style({transform: 'rotate3d(0, 0.9, 0.05, 90deg)', opacity: 0}))
        ], { params: { time: 600 } }),
      ]),
      trigger(
      'timeBarAnimation' , [
        transition(':enter', [
          style({opacity: 0}),
          animate('{{time}}ms',
            keyframes([
              style({opacity: 0, offset: 0.029}),
              style({opacity: 1, offset: 0.03}),
              style({width: 0, offset: 1}),
            ])
          )
        ], { params: { time: 20600 } })
      ]),
      trigger(
      'answerAnimation' , [
        transition(':enter', [
          style({transform: 'rotate3d(1, 1, 1, -90deg)', opacity: 0}),
          animate('{{time}}ms', style({transform: 'none', opacity: 1}))
        ], { params: { time: 600 } }),
        transition(':leave', [
          style({transform: 'none', opacity: 1}),
          animate('{{time}}ms', style({transform: 'rotate3d(0, 0.9, 0.05, 90deg)', opacity: 0}))
        ], { params: { time: 600 } }),
      ]),
      trigger(
      'pictureInOutAnimation' , [
        transition(':enter', [
          style({transform: 'rotate3d(1, 1, 0, -90deg)', opacity: 0}),
          animate('600ms', style({transform: 'none', opacity: 1}))
        ]),
        transition(':leave', [
          style({transform: 'none', opacity: 1}),
          animate('600ms', style({transform: 'rotate3d(1, 0.4, 0, -90deg)', opacity: 0}))
        ]),
      ]),
      trigger(
      'pictureTransitionAnimation', [
        transition('0 => 1', [
          style({transform: 'rotate3d(0, 0, 0, 0) scale(1)', transformOrigin: "50%"}),
          animate('600ms',
            keyframes([
              style({transform: 'rotate3d(0, 1, 0, 0deg) scale(1)'}),
              style({transform: 'rotate3d(0, 1, 0, 90deg) scale(0.5)'}),
              style({transform: 'rotate3d(0, 1, 0, 0deg) scale(1)'}),
            ])
          )
        ]),
        transition('1 => 0', [
          style({transform: 'rotate3d(0, 0, 0, 180deg) scale(1)', transformOrigin: "50%"}),
          animate('600ms',
            keyframes([
              style({transform: 'rotate3d(0, 1, 0, 0deg) scale(1)'}),
              style({transform: 'rotate3d(0, 1, 0, 90deg) scale(0.5)'}),
              style({transform: 'rotate3d(0, 1, 0, 0deg) scale(1)'}),
            ])
          )
        ]),
]),
trigger('hideShowAnimatorTwo', [
state('true' , style({ opacity: 1 })),
state('false', style({ opacity: 0 })),
transition('0 => 1', animate('10s')),
transition('1 => 0', animate('10s'))
])
  ],
  templateUrl: 'play.html'
})

export class PlayPage {
  private commonAnimationDuration: number = 600;
  private timeBarAnimationDuration: number = 20000 + this.commonAnimationDuration;
  private showNextDuration: number = 1000;
  private playerAnswerAnimationDuration: number = 300;
  private ScreenStateType = ScreenStateType; //for use in Angluar html
  private QuestionType = QuestionType; //for use in Angular html
  private quiz: Quiz;
  private currentCategory: number;
  private currentQuestions: Array<Question>;
  private currentQuestion: number;

  private currentAnswer: number;
  private currentAnswerCounter: number;
  private currentAnswerStayDuration: number = 4000;

  private players: Array<Player>;

  private screenState: ScreenStateType;

  private showNext: boolean;

  constructor(public navCtrl: NavController, private ngZone: NgZone, private file: File, private httpd: Httpd, params: NavParams) {
    this.quiz = params.data.quiz;

    this.players = [];


    this.players = [{nickname: "Totggfjggfgfgfdgdfo", avatar: "Dog.png", answer: 0},
                    {nickname: "Totgg", avatar: "Bunny.png", answer: null},
                  {nickname: "Totgg", avatar: "Duck_Guy.png", answer: 2},
                {nickname: "Totgg", avatar: "Frankie.png", answer: 3},
              {nickname: "Totgg", avatar: "Happy_Girl.png", answer: 0},
            {nickname: "Totgg", avatar: "Mad_Guy.png", answer: 1},
          {nickname: "Totgg", avatar: "Proog.png", answer: 2},
        {nickname: "Totgg", avatar: "Sintel.png", answer: 3},];

    if (!this.quiz) {
      this.navCtrl.pop();
    }
    else {true
      if (this.quiz.categorys.length < 1 || this.quiz.questions.length < 1) {
        this.navCtrl.pop();
      }
      else {
        this.showNext = false;
        this.currentCategory = 0;
        this.currentQuestion = 0;
        this.currentAnswer = 0;
        this.currentAnswerCounter = 0;
        this.currentQuestions = this.getQuestionsFromCategory(this.quiz.categorys[this.currentCategory]);

        this.screenState = ScreenStateType.playersJoining;
        setTimeout(() => this.setShowNext(), this.showNextDuration);

        /*let options: HttpdOptions = {
          www_root: 'httpd', // relative path to app's www directory
          port: 8080,
          localhost_only: false
        };

        this.httpd.attachRequestsListener().subscribe((data) => {
          let player: Player = JSON.parse(data);
          this.ngZone.run(() => {
             this.players.push(player);
          });
        })true

        this.httpd.startServer(options).subscribe((data) => {
          //alert('Server is live: ' + data);
        });

        //encore non fonctionnel
        /*this.httpd.detachRequestsListener().then((data) => {
          alert(data);
        }).catch((data) => {
          alert(data);
        })*/
      }
    }
  }

  next() {
    this.showNext = false;

    if (this.screenState === ScreenStateType.playersJoining) {
      this.screenState = ScreenStateType.displayTitle;
      setTimeout(() => this.setShowNext(), this.showNextDuration);
    }
    else if (this.screenState === ScreenStateType.displayTitle) {
      this.screenState = ScreenStateType.displayCategoryTitle;
      setTimeout(() => this.next(), this.commonAnimationDuration);
    }
    else if (this.screenState === ScreenStateType.displayCategoryTitle) {
      this.screenState = ScreenStateType.hideCategoryTitle;
      setTimeout(() => this.next(), this.commonAnimationDuration);
    }
    else if (this.screenState === ScreenStateType.hideCategoryTitle) {
      this.screenState = ScreenStateType.displayQuestion;
      setTimeout(() => this.next(), this.timeBarAnimationDuration);

      if (this.currentQuestions[this.currentQuestion].type == QuestionType.rightPicture) {
        setTimeout(() => this.currentAnswerSwitch(), this.currentAnswerStayDuration + this.commonAnimationDuration);
      }
    }
    else if (this.screenState === ScreenStateType.displayQuestion) {
      this.screenState = ScreenStateType.displayPlayersAnswer;
      setTimeout(() => this.setShowNext(), this.showNextDuration);
    }
    else if (this.screenState === ScreenStateType.displayPlayersAnswer) {
      this.screenState = ScreenStateType.hideQuestion;
      setTimeout(() => this.next(), this.commonAnimationDuration * 2);
    }
    else if (this.screenState === ScreenStateType.hideQuestion) {
      if (this.currentQuestion < this.currentQuestions.length - 1) {
        this.currentQuestion++;
        this.screenState = ScreenStateType.displayQuestion;
        setTimeout(() => this.next(), this.timeBarAnimationDuration);
      }
      else {
        if (this.currentCategory < this.quiz.categorys.length - 1) {
          this.currentCategory++;
          this.currentQuestion = 0;
          this.currentQuestions = this.getQuestionsFromCategory(this.quiz.categorys[this.currentCategory]);
          this.screenState = ScreenStateType.displayCategoryTitle;
          setTimeout(() => this.next(), this.commonAnimationDuration);
        }
        else {
          this.navCtrl.pop();
        }
      }
    }
  }

  setShowNext() {
    this.showNext = true;
  }

  currentAnswerSwitch() {
    this.currentAnswerCounter++;
    this.currentAnswer = this.currentAnswerCounter % this.currentQuestions[this.currentQuestion].answers.length;

    if (this.currentAnswerCounter * this.currentAnswerStayDuration < this.timeBarAnimationDuration) {
      setTimeout(() => this.currentAnswerSwitch(), this.currentAnswerStayDuration);
    }
  }

  getPic(index: number) {
    return "assets/imgs/" + (index + 1) + ".png";
  }

  removePlayer(player: Player, index: number) {
    if (index > -1) {
       this.players.splice(index, 1);
    }
  }

  getQuestionsFromCategory(category: Category) {
    return this.quiz.questions.filter((question) => question.category.name === category.name);
  }

  getAttachamentsDir(questionIndex: number) {
    return this.file.dataDirectory + this.quiz.uuid + '/' + this.currentQuestions[questionIndex].uuid + '/';
  }

  getAvatarWidth() {
    let avatar = <HTMLElement> document.querySelector(".avatar");
    return avatar.offsetWidth;
  }

  getInfoFontSize() {
    let avatar = <HTMLElement> document.querySelector(".avatar");
    return avatar.offsetWidth / 3.5;
  }

  displayPlayers() {
    return this.screenState === ScreenStateType.playersJoining
          || this.screenState === ScreenStateType.displayQuestion
          || this.screenState === ScreenStateType.displayPlayersAnswer
          || this.screenState === ScreenStateType.hideQuestion;
  }
}
