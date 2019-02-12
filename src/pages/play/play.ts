import { Component, NgZone } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { File } from '@ionic-native/file';
import { Httpd, HttpdOptions } from '@ionic-native/httpd';
import { trigger, keyframes, style, animate, transition } from '@angular/animations';

import { Quiz } from '../../models/quiz';
import { Category } from '../../models/category';
import { QuestionType } from '../../models/question';
import { Question } from '../../models/question';
import { Player } from '../../models/player';

enum ScreenStateType {
  playersJoining = 0,
  displayTitle = 1,
  displayCategoryTitle = 2,
  displayQuestion = 3,
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
      'pictureAnimation' , [
        transition(':enter', [
          style({transform: 'rotate3d(1, 1, 0.5, -360deg)', opacity: 1}),
          animate('12000ms', style({transform: 'none', opacity: 1}))
        ]),
        transition(':leave', [
          style({transform: 'none', opacity: 1}),
          animate('12000ms', style({transform: 'rotate3d(0, 1, 0, -360deg)', opacity: 1}))
        ]),
      ]),
  ],
  templateUrl: 'play.html'
})

export class PlayPage {
  private ScreenStateType = ScreenStateType; //for use in Angluar html
  private QuestionType = QuestionType; //for use in Angular html
  private quiz: Quiz;
  private currentCategory: number;
  private currentQuestions: Array<Question>;
  private currentQuestion: number;

  private players: Array<Player>;

  private screenState: ScreenStateType;

  constructor(public navCtrl: NavController, private ngZone: NgZone, private file: File, private httpd: Httpd, params: NavParams) {
    this.quiz = params.data.quiz;

    this.players = [];


    this.players = [{nickname: "Totggfjggfgfgfdgdfo", avatar:"Dog.png"},
                    {nickname: "Totgg", avatar:"Bunny.png"},
                  {nickname: "Totgg", avatar:"Duck_Guy.png"},
                {nickname: "Totgg", avatar:"Frankie.png"},
              {nickname: "Totgg", avatar:"Happy_Girl.png"},
            {nickname: "Totgg", avatar:"Mad_Guy.png"},
          {nickname: "Totgg", avatar:"Proog.png"},
        {nickname: "Totgg", avatar:"Sintel.png"},];

    if (!this.quiz) {
      this.navCtrl.pop();
    }
    else {
      if (this.quiz.categorys.length < 1 || this.quiz.questions.length < 1) {
        this.navCtrl.pop();
      }
      else {
        this.currentCategory = 0;
        this.currentQuestion = 0;
        this.currentQuestions = this.getQuestionsFromCategory(this.quiz.categorys[this.currentCategory]);

        this.screenState = ScreenStateType.playersJoining;

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
        })

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
    if (this.screenState === ScreenStateType.playersJoining) {
      this.screenState = ScreenStateType.displayTitle;
    }
    else if (this.screenState === ScreenStateType.displayTitle) {
      this.screenState = ScreenStateType.displayCategoryTitle;
    }
    else if (this.screenState === ScreenStateType.displayCategoryTitle) {
      this.screenState = ScreenStateType.displayQuestion;
    }
    else if (this.screenState === ScreenStateType.displayQuestion) {
      if (this.currentQuestion < this.currentQuestions.length - 1) {
        this.currentQuestion++;
      }
      else {
        if (this.currentCategory < this.quiz.categorys.length - 1) {
          this.currentCategory++;
          this.screenState = ScreenStateType.displayCategoryTitle;

          this.currentQuestion = 0;
          this.currentQuestions = this.getQuestionsFromCategory(this.quiz.categorys[this.currentCategory]);
        }
        else {
          this.navCtrl.pop();
        }
      }
    }
  }

  showNext() {
    if (this.screenState === ScreenStateType.playersJoining) {
      return this.players.length > 0;
    }
    else {
      return false;
    }
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
}
