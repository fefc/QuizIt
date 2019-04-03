import { Component, NgZone } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Platform, AlertController, ActionSheetController, NavController, ToastController, NavParams } from 'ionic-angular';
import { File } from '@ionic-native/file';
import { Httpd, HttpdOptions } from '@ionic-native/httpd';
import { trigger, keyframes, style, animate, transition } from '@angular/animations';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import { Subscription } from "rxjs/Subscription";
import { AndroidFullScreen } from '@ionic-native/android-full-screen';
import { ScreenOrientation } from '@ionic-native/screen-orientation';

declare var WifiWizard2: any;

import { Quiz } from '../../models/quiz';
import { QuizSettings } from '../../models/quiz-settings';
import { DefaultQuizSettings } from '../../models/quiz-settings';
import { Category } from '../../models/category';
import { QuestionType } from '../../models/question';
import { Question } from '../../models/question';
import { Player } from '../../models/player';

import { Buzzer } from '../../models/buzzers';
import { BuzzersConstants } from '../../models/buzzers';

enum ScreenStateType {
  start,
  playersJoining,
  displayTitle,
  loadNextCategory,
  displayCategoryTitle,
  loadNextQuestion,
  displayQuestion,
  displayPlayersAnswer,
  hideQuestion,
  end,
}

@Component({
  selector: 'page-play',
  animations: [
    trigger(
      'titleAnimation', [
        transition(':enter', [
          style({transform: 'scale(0)', opacity: 0}),
          animate('{{time}}ms', style({transform: 'scale(1)', opacity: 1}))
        ], { params: { time: 600 } }),
        transition(':leave', [
          style({transform: 'scale(1)', opacity: 1}),
          animate('{{time}}ms', style({transform: 'scale(0)', opacity: 0}))
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
          animate('{{time}}ms', style({width: 0}))
        ], { params: { time: 20000 } })
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
          style({transform: 'rotate3d(1, 1, 0, -90deg)', transformOrigin: "0 92.5vh", opacity: 0}),
          animate('{{time}}ms', style({transform: 'none', opacity: 1}))
        ], { params: { time: 600 } }),
        transition(':leave', [
          style({transform: 'none', transformOrigin: "72vw 92.5vh", opacity: 1}),
          animate('{{time}}ms', style({transform: 'rotate3d(1, 0, 1, -90deg)', opacity: 0}))
        ], { params: { time: 600 } }),
      ]),
      trigger(
      'pictureTransitionAnimation', [
        transition(':increment', [
          style({transform: 'rotate3d(0, 0, 0, 0) scale(1)', transformOrigin: "50%"}),
          animate('{{time}}ms',
            keyframes([
              style({transform: 'rotate3d(0, 1, 0, 0deg) scale(1)'}),
              style({transform: 'rotate3d(0, 1, 0, 90deg) scale(0.5)'}),
              style({transform: 'rotate3d(0, 1, 0, 0deg) scale(1)'}),
            ])
          )
        ], { params: { time: 600 } }),
        transition(':decrement', [
          style({transform: 'rotate3d(0, 0, 0, 180deg) scale(1)', transformOrigin: "50%"}),
          animate('{{time}}ms',
            keyframes([
              style({transform: 'rotate3d(0, 1, 0, 0deg) scale(1)'}),
              style({transform: 'rotate3d(0, 1, 0, 90deg) scale(0.5)'}),
              style({transform: 'rotate3d(0, 1, 0, 0deg) scale(1)'}),
            ])
          )
        ],  { params: { time: 600 } }),
      ]),
      trigger(
      'playersContainerAnimation', [
        transition(':enter', [
          style({transform: 'scale(0)', opacity: 0}),
          animate('250ms', style({transform: 'scale(1)', opacity: 1})
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
      'playerPointsAnimation', [
        transition(':increment', [
          style({transform: 'scale(1)', transformOrigin: "0 50%"}),
          animate('{{time}}ms',
            keyframes([
              style({transform: 'scale(1)', offset: 0}),
              style({transform: 'scale(1.5)', offset: 0.3}),
              style({transform: 'scale(1)', offset: 1}),
            ])
          )
        ], { params: { time: 600 } }),
        transition(':decrement', [
          style({transform: 'scale(1)', transformOrigin: "0 50%"}),
          animate('{{time}}ms',
            keyframes([
              style({transform: 'scale(1)', offset: 0}),
              style({transform: 'scale(0.5)', offset: 0.3}),
              style({transform: 'scale(1)', offset: 1}),
            ])
          )
        ],  { params: { time: 600 } }),
      ]),
      trigger(
      'playerPositionAnimation', [
        transition(':increment', [
          style({transform: 'translateY({{previousYTranslation}}px) scale(1)'}),
          animate('{{time}}ms',
            keyframes([
              style({transform: 'translateY({{previousYTranslation}}px) scale(1)'}),
              style({transform: 'translateY({{actualYTranslationHalf}}px) scale(0.9)'}),
              style({transform: 'translateY({{actualYTranslation}}px) scale(1)'}),
            ])
          )
        ], { params: { time: 600, previousYTranslation: 0, actualYTranslationHalf: 0, actualYTranslation: 0 } }),
        transition(':decrement', [
          style({transform: 'translateY({{previousYTranslation}}px) scale(1)'}),
          animate('{{time}}ms',
            keyframes([
              style({transform: 'translateY({{previousYTranslation}}px) scale(1)'}),
              style({transform: 'translateY({{actualYTranslationHalf}}px) scale(1.1)'}),
              style({transform: 'translateY({{actualYTranslation}}px) scale(1)'}),
            ])
          )
        ],  { params: { time: 600, previousYTranslation: 0, actualYTranslationHalf: 0, actualYTranslation: 0 } }),
      ]),
  ],
  templateUrl: 'play.html'
})

export class PlayPage {
  private menuTapMessageDuration: number = 6000;
  private commonAnimationDuration: number = DefaultQuizSettings.COMMON_ANIMATION_DURATION;
  private timeBarAnimationDuration: number = DefaultQuizSettings.TIMEBAR_ANIMATION_DURATION;
  private playerAnswerAnimationDuration: number = DefaultQuizSettings.PLAYER_ANSWER_ANIMATION_DURATION;
  private currentPictureStayDuration: number = (this.timeBarAnimationDuration / DefaultQuizSettings.AMOUNT_OF_PICUTRES_TO_SHOW); //The dividing number is the number of picture I want to see
  private showNextDelay: number = DefaultQuizSettings.SHOW_NEXT_DELAY;

  private autoPlay: boolean = DefaultQuizSettings.AUTO_PLAY;
  private startMessage: string = DefaultQuizSettings.START_MESSAGE; //for use in Angular html
  private endMessage: string = DefaultQuizSettings.END_MESSAGE; //for use in Angular html
  private backgroundImage: string = DefaultQuizSettings.BACKGROUND_IMAGE; //for use in Angular html

  private ScreenStateType = ScreenStateType; //for use in Angluar html
  private QuestionType = QuestionType; //for use in Angular html

  private screenState: ScreenStateType;
  private displayTimeBar: boolean;
  private displayAnswers: boolean;
  private displayPictures: boolean;
  private displayPlayers: boolean;

  private showNext: boolean; //for use in Angular html
  private showMenu: boolean; //for use in Angular html
  private showExit: boolean; //for use in Angular html
  private showMenuCounter: number;
  private pause: boolean;

  private currentWifi: string; //for use in Angular html
  private currentIp: string; //for use in Angular html

  private players: Array<Player>;

  private quiz: Quiz;
  private currentCategory: number;
  private currentQuestion: number;
  private currentQuestions: Array<Question>;

  private currentQuestionStartDate: number;

  private currentPicture: number;
  private currentPictureCounter: number;
  private currentPictures: Array<SafeUrl>;

  private httpdOptions: HttpdOptions = {
            www_root: 'httpd', // relative path to app's www directory
            port: 8080,
            localhost_only: false };

  private httpdSubscription: Subscription;
  private remoteButtonsRequestsSubscription: Subscription;

  constructor(private platform: Platform,
              private navCtrl: NavController,
              private alertCtrl: AlertController,
              private actionSheetCtrl: ActionSheetController,
              private toastCtrl: ToastController,
              private ngZone: NgZone,
              private file: File,
              private httpd: Httpd,
              private androidFullScreen: AndroidFullScreen,
              private screenOrientation: ScreenOrientation,
              private sanitizer:DomSanitizer,
              params: NavParams) {

    this.screenState = ScreenStateType.start;
    this.displayAnswers = false;
    this.displayPictures = false;
    this.displayPlayers = false;

    this.showNext = false;
    this.showMenu = false;
    this.showExit = false;
    this.showMenuCounter = 0;
    this.pause = false;

    this.currentWifi = '';
    this.currentIp = '';

    this.players = [];

    this.players = [{uuid: "0", nickname: "Zero", avatar: "Dog.png",        initialPosition: 0, previousPosition: 0, actualPosition: 0, points: null, answer: -1},
                    {uuid: "1", nickname: "One", avatar: "Bunny.png",       initialPosition: 1, previousPosition: 1, actualPosition: 1, points: null, answer: -1},
                    {uuid: "2", nickname: "Two", avatar: "Duck_Guy.png",    initialPosition: 2, previousPosition: 2, actualPosition: 2, points: null, answer: -1},
                    {uuid: "3", nickname: "Three", avatar: "Frankie.png",   initialPosition: 3, previousPosition: 3, actualPosition: 3, points: null, answer: -1},
                    {uuid: "4", nickname: "Four", avatar: "Happy_Girl.png", initialPosition: 4, previousPosition: 4, actualPosition: 4, points: null, answer: -1},
                    {uuid: "5", nickname: "Five", avatar: "Mad_Guy.png",    initialPosition: 5, previousPosition: 5, actualPosition: 5, points: null, answer: -1},
                    {uuid: "6", nickname: "Six", avatar: "Proog.png",       initialPosition: 6, previousPosition: 6, actualPosition: 6, points: null, answer: -1},
                    {uuid: "7", nickname: "Seven", avatar: "Sintel.png",    initialPosition: 7, previousPosition: 7, actualPosition: 7, points: null, answer: -1},];

    this.quiz = params.data.quiz;

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

        this.currentPicture = 0;
        this.currentPictureCounter = 0;
        this.currentPictures = [];

        //Get Quiz settings
        if (this.quiz.settings) {
          if (this.quiz.settings.commonAnimationDuration !== undefined) {
            this.commonAnimationDuration = this.quiz.settings.commonAnimationDuration;
          }

          if (this.quiz.settings.timeBarAnimationDuration !== undefined) {
            this.timeBarAnimationDuration = this.quiz.settings.timeBarAnimationDuration;
            this.currentPictureStayDuration = (this.timeBarAnimationDuration / DefaultQuizSettings.AMOUNT_OF_PICUTRES_TO_SHOW);
          }

          if (this.quiz.settings.playerAnswerAnimationDuration !== undefined) {
            this.playerAnswerAnimationDuration = this.quiz.settings.playerAnswerAnimationDuration;
          }

          if (this.quiz.settings.showNextDelay !== undefined) {
            this.showNextDelay = this.quiz.settings.showNextDelay;
          }

          if (this.quiz.settings.amountOfPicturesToShow !== undefined) {
            this.currentPictureStayDuration = (this.timeBarAnimationDuration / this.quiz.settings.amountOfPicturesToShow);
          }

          if (this.quiz.settings.autoPlay !== undefined) {
            this.autoPlay = this.quiz.settings.autoPlay;
          }

          if (this.quiz.settings.startMessage !== undefined) {
            this.startMessage = this.quiz.settings.startMessage;
          }

          if (this.quiz.settings.backgroundImage !== undefined) {
            this.backgroundImage = this.quiz.settings.backgroundImage;
          }
        }

        if (this.platform.is('android')) {
          /* First lets go fullScreenMode if possible */
          this.goFullScreen();

          /* Lock screen orientation to landscape */
          this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.LANDSCAPE);

          /* Get Wifi infos if possible */
          this.getWifiInfos();

          /* Setup httpd stuff */
          this.remoteButtonsRequestsSubscription = this.httpd.attachRequestsListener().subscribe((data: any) => this.handleHttpdEvent(data), (error) => {
            console.log("Could not attach request listener.");
          });

          this.httpdSubscription = this.httpd.startServer(this.httpdOptions).subscribe((data) => {console.log("Successfully started server.");}, (error) => {
            console.log("Could not sstart server.");
          });

        } else {
          //We are one a web browser so it is intended to be used with buzz buzzers, so we need to listen to keyboard events
          this.remoteButtonsRequestsSubscription = Observable.fromEvent(document, 'keypress').subscribe((e: any) => this.handleKeyboardEvent(e), (error) => {
            console.log("Could not attach request listener.");});
        }

        this.screenState = ScreenStateType.playersJoining;
        this.displayPlayers = true;

        let toast = this.toastCtrl.create({
          message: 'Click screen twice to open menu',
          duration: this.menuTapMessageDuration
        });

        toast.present();

        setTimeout(() => this.setShowNext(), this.menuTapMessageDuration);
      }
    }
  }

  next() {
    var player: Player;
    this.showNext = false;

    if (this.screenState === ScreenStateType.playersJoining) {
      this.currentCategory = -1;

      for (player of this.players) {
        player.points = 0;
      }

      this.screenState = ScreenStateType.displayTitle;
      this.displayPlayers = false;
      this.handleNextStep();
    }
    else if (this.screenState === ScreenStateType.displayTitle) {
      this.screenState = ScreenStateType.loadNextCategory;
      setTimeout(() => this.next(), this.commonAnimationDuration);
    }
    else if (this.screenState === ScreenStateType.loadNextCategory) {
      this.currentCategory++;

      if (this.currentCategory < this.quiz.categorys.length) {
        this.screenState = ScreenStateType.displayCategoryTitle;
        this.handleNextStep();
      }
      else {
        this.screenState = ScreenStateType.end;
        setTimeout(() => this.setShowExit(), this.showNextDelay);
      }
    }
    else if (this.screenState === ScreenStateType.displayCategoryTitle) {
      this.currentQuestion = -1;
      this.currentQuestions = this.getQuestionsFromCategory(this.quiz.categorys[this.currentCategory]);

      this.screenState = ScreenStateType.loadNextQuestion;
      this.next();
    }
    else if (this.screenState === ScreenStateType.loadNextQuestion) {
      this.currentQuestion++;

      for (player of this.players) {
        player.answer = -1;
      }

      if (this.currentQuestion < this.currentQuestions.length) {
        var promises = [];

        if (this.currentQuestions[this.currentQuestion].type == QuestionType.rightPicture) {

          this.currentPicture = 0;
          this.currentPictureCounter = 0;
          this.currentPictures = [];

          for (let i: number = 0; i < this.currentQuestions[this.currentQuestion].answers.length; i++) {
            promises.push(this.file.readAsDataURL(this.file.dataDirectory, this.getPicturePath(this.currentQuestions[this.currentQuestion], i)));
          }
        }

        Promise.all(promises).then((pictures) => {
          for (let picture of pictures) {
            this.currentPictures.push(this.sanitizer.bypassSecurityTrustStyle(`url('${picture}')`));
          }

          this.screenState = ScreenStateType.displayQuestion;
          setTimeout(() => this.displayTimeBar = true, this.commonAnimationDuration);

          this.displayPlayers = true;
          this.currentQuestionStartDate = Date.now();
          setTimeout(() => this.next(), this.timeBarAnimationDuration + this.commonAnimationDuration);

          if (this.currentQuestions[this.currentQuestion].type == QuestionType.rightPicture) {
            this.displayPictures = true;
            setTimeout(() => this.currentPictureSwitch(), this.currentPictureStayDuration + (this.commonAnimationDuration / 2));
          } else {
            this.displayAnswers = true;
          }
        }).catch(() => {
          console.log("Something went wrong when reading pictures.");

          this.screenState = ScreenStateType.loadNextCategory;
          if (this.currentCategory + 1 < this.quiz.categorys.length) {
            this.displayPlayers = false;
          }
          setTimeout(() => this.next(), this.commonAnimationDuration);
        });
      }
      else {
        this.screenState = ScreenStateType.loadNextCategory;
        if (this.currentCategory + 1 < this.quiz.categorys.length) {
          this.displayPlayers = false;
        }
        setTimeout(() => this.next(), this.commonAnimationDuration);
      }
    }
    else if (this.screenState === ScreenStateType.displayQuestion) {
      this.screenState = ScreenStateType.displayPlayersAnswer;
      this.displayTimeBar = false;

      if (this.currentQuestions[this.currentQuestion].type == QuestionType.rightPicture
          && this.currentPicture !== this.currentQuestions[this.currentQuestion].rightAnswer) {
        this.currentPictureSwitch(); //This will switch to the right answer picture
      }

      setTimeout(() => this.updatePlayersPointsAndPosition(), this.playerAnswerAnimationDuration * 2);
      this.handleNextStep();
    }
    else if (this.screenState === ScreenStateType.displayPlayersAnswer) {
      this.screenState = ScreenStateType.hideQuestion;
      this.displayAnswers = false;
      this.displayPictures = false;
      setTimeout(() => this.next(), this.commonAnimationDuration);
    }
    else if (this.screenState === ScreenStateType.hideQuestion) {
      this.screenState = ScreenStateType.loadNextQuestion;
      setTimeout(() => this.next(), this.commonAnimationDuration);
    }
  }

  handleNextStep() {
    if (this.autoPlay) {
      setTimeout(() => this.next(), this.showNextDelay + this.commonAnimationDuration);
    } else {
      setTimeout(() => this.setShowNext(), this.showNextDelay);
    }
  }

  addPlayer(nickname: string, avatar: string) {
    if (this.screenState === ScreenStateType.playersJoining) {
      if (this.players.findIndex((p) => p.nickname === nickname) === -1) {
        let newPlayer: Player;
        let uuid: string = this.uuidv4();

        while (this.players.findIndex((p) => p.uuid === uuid) !== -1) {
          uuid = this.uuidv4();
        }

        newPlayer = {
          uuid: uuid,
          nickname: nickname,
          avatar: avatar,
          initialPosition: this.players.length,
          previousPosition: this.players.length,
          actualPosition: this.players.length,
          answer: undefined
        };

        return newPlayer;
      }
    }

    return undefined;
  }

  getAnsweringPlayer(uuid: string) {
    if (this.screenState === ScreenStateType.displayQuestion) {
      let player: Player = this.players.find((p) => p.uuid === uuid);

      if (player) {
        if (player.answer === -1) {
          return player;
        }
      }
    }

    return undefined;
  }

  checkIfRightRemoteButtonUsed(button: number) {
    if (this.currentQuestions[this.currentQuestion].type == QuestionType.rightPicture) {
      if (button >= 4) {
        return true;
      }
    } else {
      if (button > -1 && button < this.currentQuestions[this.currentQuestion].answers.length) {
        return true;
      }
    }
  }

  updatePlayersPointsAndPosition() {
    for (var player of this.players) {
      if (player.answer === this.currentQuestions[this.currentQuestion].rightAnswer) {
        player.points += 100; //TODO set settings
      }
    }

    //JSON usefull to make a quick and dirty depp copy
    let sortedPlayers = JSON.parse(JSON.stringify(this.players)).sort((pOne, pTwo) => {
      return pTwo.points - pOne.points;
    });;

    for (let newPlayerPosition = 0; newPlayerPosition < sortedPlayers.length; newPlayerPosition++) {
      let realPlayer = this.players.find((player) => player.uuid === sortedPlayers[newPlayerPosition].uuid);
      realPlayer.previousPosition = realPlayer.actualPosition;
      realPlayer.actualPosition = newPlayerPosition;
    }
  }

  currentPictureSwitch() {
    this.currentPictureCounter++;

    setTimeout(() => {
      //This picture switch occurs in the middle of the rotation animation so no one can se
      if (this.screenState === ScreenStateType.displayPlayersAnswer) {
        this.currentPicture = this.currentQuestions[this.currentQuestion].rightAnswer;
      } else {
        this.currentPicture = this.currentPictureCounter % this.currentQuestions[this.currentQuestion].answers.length;
      }

    }, this.commonAnimationDuration / 2);

    if ((this.currentPictureCounter + 1) * this.currentPictureStayDuration < this.timeBarAnimationDuration) {
      setTimeout(() => this.currentPictureSwitch(), this.currentPictureStayDuration);
    }
  }

  saveActualYTranslation(e, i) {
      e.element.setAttribute('style',
        "transform: translateY(" + (this.players[i].actualPosition - this.players[i].initialPosition)  * this.getPlayerHeight() +"px)");
  }

  getPlayerHeight() {
    let player = <HTMLElement> document.querySelector(".player");
    return player.offsetHeight;
  }

  getPlayerActualYTranslation(player: Player) {
    return (player.actualPosition - player.initialPosition) * this.getPlayerHeight();
  }

  getPlayerPreviousYTranslation(player: Player) {
    return (player.previousPosition - player.initialPosition) * this.getPlayerHeight();
  }

  removePlayer(player: Player, index: number) {
    if (index > -1) {
       this.players.splice(index, 1);
    }
  }

  getQuestionsFromCategory(category: Category) {
    return this.quiz.questions.filter((question) => question.category.name === category.name);
  }

  getPicturePath(question: Question, answerIndex: number) {
    return this.quiz.uuid + '/' + question.uuid + '/' + question.answers[answerIndex];
  }

  getAvatarWidth() {
    let avatar = <HTMLElement> document.querySelector(".avatar");
    return avatar.offsetWidth;
  }

  getNicknameFontSize() {
    let avatar = <HTMLElement> document.querySelector(".avatar");
    return avatar.offsetWidth / 3.5;
  }

  getPointsFontSize() {
    let avatar = <HTMLElement> document.querySelector(".avatar");
    return avatar.offsetWidth / 5.0;
  }

  setShowNext() {
    this.showNext = true;
  }

  setShowExit() {
    this.showExit = true;
  }

  exit() {
    this.navCtrl.pop();
  }

  setShowMenu() {
    if (this.showMenuCounter === 0) {
      setTimeout(() => { this.showMenuCounter = 0; }, 600);
    }

    this.showMenuCounter++;

    if ( this.showMenuCounter >= 2 ) {
      this.showMenuCounter = 0;

      let actionSheet = this.actionSheetCtrl.create({
        buttons: [
          {
            text: this.pause === false ? 'Pause' : 'Play',
            icon: !this.platform.is('ios') ? this.pause === false ? 'pause' : 'play' : null,
            handler: () => {
              this.pause = !this.pause;
            }
          },{
            text: 'Exit',
            icon: !this.platform.is('ios') ? 'square' : null,
            handler: () => {
              this.exit();
            }
          },{
            text: 'Close',
            icon: !this.platform.is('ios') ? 'close' : null,
            role: 'cancel',
          }
        ]
      });
      actionSheet.present();
    }
  }

  /* this will be executed when view is poped, either by exit() or by back button */
  ionViewWillUnload() {
    this.remoteButtonsRequestsSubscription.unsubscribe();

    if (this.platform.is('android')) {
      /* disable httpd */
      this.httpdSubscription.unsubscribe();

      /* Unlock screen orientation */
      this.screenOrientation.unlock();

      /* Exit immersiveMode */
      this.androidFullScreen.isSupported().then(() => {
          this.androidFullScreen.showSystemUI().catch((err) => {
            console.log("Could not disable immersiveMode: " + err);
          });
      }).catch((err) => {
        console.log("AndroidFullScreen is not supported: " + err);
      });
    }
  }

  getWifiInfos() {
    /* Lets try to find out if Wifi is enabled and configure the welcome message */
    WifiWizard2.getConnectedSSID().then((ssid) => {
        this.currentWifi  = ssid;
        /* Once wifi is done, lets find ip address of the device over wifi and configure the welcome message */
        WifiWizard2.getWifiIP().then((ip) => {
          this.currentIp = ip;
        })
        .catch((error) => {
          this.currentIp  = "unknown";

          let alert = this.alertCtrl.create({
            title: 'Error',
            message: 'There has been an error getting the device ip address. Please enter device ip here.',
            inputs: [
              {
                name: 'ip',
                placeholder: 'Ip address'
              }
            ],
            buttons: [
              {
                text: 'Cancel',
                role: 'cancel',
              },
              {
                text: 'Save',
                handler: data => {
                  this.currentIp = data.ip;
                }
              }
            ]
          });
          alert.present();
        });
      }).catch((error) => {
        this.currentWifi  = "unknown";

        let alert = this.alertCtrl.create({
          title: 'Error',
          message: 'There has been an error getting the Wifi name, please check that you are connected to a Wifi. If your device is an Access Point, pleace enter the Wifi name and device ip here.',
          enableBackdropDismiss: false,
          inputs: [
            {
              name: 'ssid',
              placeholder: 'Wifi name'
            },
            {
              name: 'ip',
              placeholder: 'Ip address'
            }
          ],
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: 'Save',
              handler: data => {
                this.currentWifi = data.ssid;
                this.currentIp = data.ip;
              }
            }
          ]
        });
        alert.present();
      });
  }

  goFullScreen() {
    this.androidFullScreen.isSupported().then(() => {
      this.androidFullScreen.isImmersiveModeSupported().then(() => {
        this.androidFullScreen.immersiveMode().catch((err) => {
          console.log("Could not enable immersiveMode: " + err);
        })
      }).catch(err => {
        console.log("ImmersiveMode is not supported: " + err);
      });
    }).catch((err) => {
      console.log("AndroidFullScreen is not supported: " + err);
    });
  }

  handleHttpdEvent(data: any) {
    if (data.uri === "/addPlayer") {
      let newPlayer: Player = this.addPlayer(data.nickname, data.avatar);

      this.httpd.setRequestResponse({uuid: newPlayer ? newPlayer.uuid : undefined }).catch(() => {
        console.log("Could not setRequestResponse for /addPlayer.");
      });

      if (newPlayer) {
        this.ngZone.run(() => {
          this.players.push(newPlayer);
        });
      }
    } else if (data.uri === "/answer") {
      let answeringPlayer: Player = this.getAnsweringPlayer(data.uuid);
      let remainingMillis: number = (this.timeBarAnimationDuration + this.commonAnimationDuration) - (Date.now() - this.currentQuestionStartDate);

      this.httpd.setRequestResponse({success: answeringPlayer ? true : false, remainingMillis: remainingMillis }).catch(() => {
        console.log("Could not setRequestResponse for /answer.");
      });

      if (answeringPlayer && this.checkIfRightRemoteButtonUsed(data.answer)) {

        if (data.answer >= 4) {
          //This is buzzer
          data.answer = this.currentPicture;
        }

        this.ngZone.run(() => {
          answeringPlayer.answer = Number(data.answer);
        });
      }
    } else {
      this.httpd.setRequestResponse({msg: "I don't know what you're looking for."}).catch(() => {
        console.log("Could not setRequestResponse for some useless case.");
      });
    }
  }

  handleKeyboardEvent(event: any) {
    var buzzer: Buzzer = BuzzersConstants.KEYSETS.find((x) => x.keys.indexOf(event.key) > -1);
    let answeringPlayer: Player;
    var answer: number;

    if (buzzer) {
      answer = buzzer.keys.indexOf(event.key);
      answeringPlayer = this.getAnsweringPlayer(buzzer.uuid);

      if (answeringPlayer  && this.checkIfRightRemoteButtonUsed(answer)) {
        if (answer >= buzzer.keys.length - 1) {
          //This is buzzer
          answer = this.currentPicture;
        }

        this.ngZone.run(() => {
          console.log(answer);
          answeringPlayer.answer = answer;
        });
      }
    }
  }

  //From https://stackoverflow.com/a/2117523
  uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
