import { Component, ViewChild, ElementRef } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Platform, ActionSheetController, ModalController, NavController, ToastController, NavParams } from 'ionic-angular';
import { trigger, keyframes, style, animate, transition } from '@angular/animations';
import { File } from '@ionic-native/file';
import { AndroidFullScreen } from '@ionic-native/android-full-screen';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { Insomnia } from '@ionic-native/insomnia';
import { Subscription } from "rxjs/Subscription";
import { TranslateService } from '@ngx-translate/core';

declare var BarcodeGenerator: any;

import { Quiz } from '../../models/quiz';
import { DefaultQuizSettings } from '../../models/quiz-settings';
import { Category } from '../../models/category';
import { QuestionType } from '../../models/question';
import { Question } from '../../models/question';
import { Player } from '../../models/player';

import { GameState } from '../../models/game';

import { GameProvider } from '../../providers/game/game';

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
  displayExtra,
}

enum ExtraType {
  none,
  picture,
  video
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
          style({transform: 'scaleX(1)', transformOrigin: 'left'}),
          animate('{{time}}ms', style({transform: 'scaleX(0)'}))
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
      trigger(
      'extraAnimation' , [
        transition(':enter', [
          style({transform: 'rotate3d(1, 1, 0, -90deg)', transformOrigin: "0 92.5vh", opacity: 0}),
          animate('{{time}}ms', style({transform: 'none', opacity: 1}))
        ], { params: { time: 600 } }),
        transition(':leave', [
          style({transform: 'none', transformOrigin: "72vw 92.5vh", opacity: 1}),
          animate('{{time}}ms', style({transform: 'rotate3d(1, 0, 1, -90deg)', opacity: 0}))
        ], { params: { time: 600 } }),
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
  private extraDisplayDuration: number = DefaultQuizSettings.EXTRA_DISPLAY_DURATION;
  private showNextDelay: number = DefaultQuizSettings.SHOW_NEXT_DELAY;

  private autoPlay: boolean = DefaultQuizSettings.AUTO_PLAY;
  private startMessage: string = DefaultQuizSettings.START_MESSAGE; //for use in Angular html
  private endMessage: string = DefaultQuizSettings.END_MESSAGE; //for use in Angular html
  private backgroundImage: string = DefaultQuizSettings.BACKGROUND_IMAGE; //for use in Angular html

  private ScreenStateType = ScreenStateType; //for use in Angluar html
  private QuestionType = QuestionType; //for use in Angular html
  private ExtraType = ExtraType; //for use in Angular html

  private screenState: ScreenStateType;
  private displayTimeBar: boolean;
  private displayAnswers: boolean;
  private displayPictures: boolean;
  private displayPlayers: boolean;
  private displayExtras: boolean;

  private showNext: boolean; //for use in Angular html
  private showMenu: boolean; //for use in Angular html
  private showExit: boolean; //for use in Angular html
  private showMenuCounter: number;
  private pause: boolean;

  private allPlayersAnsweredSubscription: Subscription;

  private displayQuestionTimer: any;
  private switchPicturesTimer: any;

  private quiz: Quiz;
  private currentCategory: number;
  private currentCategories: Array<Category>;
  private currentQuestion: number;
  private currentQuestions: Array<Question>;

  private currentPictureCounter: number;
  private currentPictures: Array<SafeUrl>;
  private currentExtras: Array<SafeUrl>;
  private currentExtraType: ExtraType;

  private qrCode: string;

  @ViewChild('extraVideo') extraVideo: ElementRef; //Video reference to control play and video duration

  constructor(private platform: Platform,
              private navCtrl: NavController,
              private actionSheetCtrl: ActionSheetController,
              public modalCtrl: ModalController,
              private toastCtrl: ToastController,
              private file: File,
              private androidFullScreen: AndroidFullScreen,
              private screenOrientation: ScreenOrientation,
              private sanitizer:DomSanitizer,
              private insomnia: Insomnia,
              private gameProv: GameProvider,
              public translate: TranslateService,
              params: NavParams) {

    this.screenState = ScreenStateType.start;
    this.currentExtraType = ExtraType.none;

    this.displayAnswers = false;
    this.displayPictures = false;
    this.displayPlayers = false;
    this.displayExtras = false;

    this.showNext = false;
    this.showMenu = false;
    this.showExit = false;
    this.showMenuCounter = 0;
    this.pause = false;

    //To avoid warings on ionic build
    this.startMessage = this.startMessage;
    this.endMessage = this.endMessage;

    this.displayAnswers = this.displayAnswers;
    this.displayPictures = this.displayPictures;
    this.displayPlayers = this.displayPlayers;
    this.displayExtras = this.displayExtras;

    this.showNext = this.showNext;
    this.showMenu = this.showMenu;
    this.showExit = this.showExit;

    this.qrCode = '';

    this.quiz = params.data.quiz;

    if (!this.quiz) {
      this.navCtrl.pop();
    }
    else {
      this.currentCategory = 0;
      this.currentCategories = [];

      //We only take the non empty categories
      for (let category of this.quiz.categorys) {
        if (this.getQuestionsFromCategory(category).length > 0) {
          this.currentCategories.push(category);
        }
      }

      if (this.currentCategories.length === 0) {
        this.navCtrl.pop();
      }
      else {
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

          if (this.quiz.settings.extraDisplayDuration !== undefined) {
            this.extraDisplayDuration = this.quiz.settings.extraDisplayDuration;
          }
        }

        if (this.platform.is('android')) {
          /* First lets go fullScreenMode if possible */
          this.goFullScreen();

          /* Lock screen orientation to landscape */
          this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.LANDSCAPE);
        }

        this.gameProv.createGame().then(() => {
          BarcodeGenerator.generate(
            { content: 'https://quizpadapp.com/controller?id=' + this.gameProv.game.uuid,
              height: 256,
              width: 256,
              format: 11,
              foregroundColor: '#000000',
              backgroundColor: '#FFFFFF'},
            (base64: string) => {
            //The barcode has been Successfully created, everything is ready now
            this.qrCode = "data:image/png;base64, " + base64;

            this.currentQuestion = 0;
            this.currentQuestions = this.getQuestionsFromCategory(this.currentCategories[this.currentCategory]);

            this.gameProv.currentPicture = 0;
            this.currentPictureCounter = 0;
            this.currentPictures = [];
            this.currentExtras = [];

            this.screenState = ScreenStateType.playersJoining;
            this.displayPlayers = true;

            this.allPlayersAnsweredSubscription = this.gameProv.allPlayersAnswered$.subscribe((data) => {
              if(this.displayQuestionTimer) {
                clearTimeout(this.displayQuestionTimer);
                this.displayQuestionTimer = undefined;
              }

              if(this.switchPicturesTimer) {
                clearTimeout(this.switchPicturesTimer);
                this.switchPicturesTimer = undefined;
              }

              this.next();
            });

            this.insomnia.keepAwake().then(() => {
              console.log("Device will be keept awake");
            }).catch(() => {
              console.log("Could not set keepAwake.");
            });

            let toast = this.toastCtrl.create({
              message: 'Click screen twice to open menu',
              duration: this.menuTapMessageDuration
            });

            toast.present();

            setTimeout(() => this.showNext = true, this.menuTapMessageDuration);

            }, (error) => {
              //Unable to generate the QR_CODE, lets say something
              console.log(error);
            }
          );
        });
      }
    }
  }

  async next() {
    this.showNext = false;
    this.showMenuCounter = 0;

    if (this.screenState === ScreenStateType.playersJoining) {
      await this.gameProv.startGame();

      this.currentCategory = -1;
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

      if (this.currentCategory < this.currentCategories.length) {
        this.screenState = ScreenStateType.displayCategoryTitle;
        this.handleNextStep();
      }
      else {
        this.screenState = ScreenStateType.end;

        await this.gameProv.updateState(GameState.ended);

        setTimeout(() => this.showExit = true, this.showNextDelay);
      }
    }
    else if (this.screenState === ScreenStateType.displayCategoryTitle) {
      this.currentQuestion = -1;
      this.currentQuestions = this.getQuestionsFromCategory(this.currentCategories[this.currentCategory]);

      this.screenState = ScreenStateType.loadNextQuestion;
      this.next();
    }
    else if (this.screenState === ScreenStateType.loadNextQuestion) {
      this.currentQuestion++;

      this.displayQuestionTimer = undefined;
      this.switchPicturesTimer  = undefined;

      if (this.currentQuestion < this.currentQuestions.length) {
        var promises = [];

        this.currentExtras = [];
        this.currentExtraType = ExtraType.none;

        //Add extras to be loaded
        for (let i: number = 0; i < this.currentQuestions[this.currentQuestion].extras.length; i++) {
          promises.push(this.file.readAsDataURL(this.file.dataDirectory, this.getExtraPath(this.currentQuestions[this.currentQuestion], i)));
        }

        Promise.all(promises).then((extras) => {
          for (let i: number = 0; i < extras.length; i++) {
            //No need to worry about the order, the order is preserved with Promise.all
            if (['.mp4', '.webm', '.ogg'].some(extension => this.currentQuestions[this.currentQuestion].extras[i].endsWith(extension))) {
              this.currentExtras.push(this.sanitizer.bypassSecurityTrustUrl(extras[i]));
              this.currentExtraType = ExtraType.video;
            } else {
              this.currentExtras.push(this.sanitizer.bypassSecurityTrustStyle(`url('${extras[i]}')`));
              this.currentExtraType = ExtraType.picture;
            }
          }

          promises = [];

          if (this.currentQuestions[this.currentQuestion].type == QuestionType.rightPicture) {

            this.gameProv.currentPicture = 0;
            this.currentPictureCounter = 0;
            this.currentPictures = [];

            for (let i: number = 0; i < this.currentQuestions[this.currentQuestion].answers.length; i++) {
              promises.push(this.file.readAsDataURL(this.file.dataDirectory, this.getPicturePath(this.currentQuestions[this.currentQuestion], i)));
            }
          }

          Promise.all(promises).then((pictures) => {
            for (let picture of pictures) {
              //No need to worry about the order, the order is preserved with Promise.all
              this.currentPictures.push(this.sanitizer.bypassSecurityTrustStyle(`url('${picture}')`));
            }

            this.screenState = ScreenStateType.displayExtra;

            if (this.currentQuestions[this.currentQuestion].extras.length > 0) {
              setTimeout(() => {
                this.displayExtras = true;

                if (this.currentExtraType === ExtraType.video) {
                  setTimeout(() => {
                    this.extraVideo.nativeElement.play(); //Once animation is done, start the video

                    this.extraVideo.nativeElement.onended = () => {
                      this.displayExtras = false;
                      setTimeout(() => this.next(), this.commonAnimationDuration);
                    };

                  }, this.commonAnimationDuration);

                } else {
                  setTimeout(() => {
                    this.displayExtras = false;
                    setTimeout(() => this.next(), this.commonAnimationDuration);

                  }, this.extraDisplayDuration);
                }

              }, this.commonAnimationDuration);

            } else {
              this.next();
            }
          }).catch(() => {
            console.log("Something went wrong when reading pictures.");

            this.screenState = ScreenStateType.loadNextQuestion;
            this.hidePlayers();
          });
        }).catch(() => {
          console.log("Something went wrong when reading extras.");

          this.screenState = ScreenStateType.loadNextQuestion;
          this.hidePlayers();
        });
      }
      else {
        this.screenState = ScreenStateType.loadNextCategory;
        this.hidePlayers();
      }
    }
    else if (this.screenState === ScreenStateType.displayExtra) {
      this.screenState = ScreenStateType.displayQuestion;
      setTimeout(() => this.displayTimeBar = true, this.commonAnimationDuration);

      this.gameProv.updateState(this.currentQuestions[this.currentQuestion].type === QuestionType.rightPicture ? GameState.pictureQuestionDisplayed : GameState.classicQuestionDisplayed).catch(() => {
        console.log("Update game state did not worked properly.");
      });

      this.displayPlayers = true;
      this.displayQuestionTimer = setTimeout(() => this.next(), this.timeBarAnimationDuration + this.commonAnimationDuration);

      if (this.currentQuestions[this.currentQuestion].type == QuestionType.rightPicture) {
        this.displayPictures = true;
        this.switchPicturesTimer = setTimeout(() => this.currentPictureSwitch(), this.currentPictureStayDuration + (this.commonAnimationDuration / 2));
      } else {
        this.displayAnswers = true;
      }
    }
    else if (this.screenState === ScreenStateType.displayQuestion) {
      this.displayTimeBar = false; //First make sure to remove the TimeBar otherwise a small glitch appears

      await this.gameProv.updateState(GameState.loading);

      this.screenState = ScreenStateType.displayPlayersAnswer;

      if (this.currentQuestions[this.currentQuestion].type == QuestionType.rightPicture
          && this.gameProv.currentPicture !== this.currentQuestions[this.currentQuestion].rightAnswer) {
        this.currentPictureSwitch(); //This will switch to the right answer picture
      }

      setTimeout(() => this.gameProv.updatePlayersPointsAndPosition(this.currentQuestions[this.currentQuestion].rightAnswer).catch((error) => {console.log(error)}), this.playerAnswerAnimationDuration * 2);
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
    if (this.autoPlay && !this.pause) {
      setTimeout(() => this.next(), this.showNextDelay + this.commonAnimationDuration);
    } else {
      setTimeout(() => this.showNext = true, this.showNextDelay);
      this.pause = false;
    }
  }

  hidePlayers() {
    if (this.currentCategory + 1 < this.currentCategories.length) {
      this.displayPlayers = false;
    }
    setTimeout(() => this.next(), this.commonAnimationDuration);
  }

  currentPictureSwitch() {
    this.currentPictureCounter++;

    setTimeout(() => {
      //This picture switch occurs in the middle of the rotation animation so no one can se
      if (this.screenState === ScreenStateType.displayPlayersAnswer) {
        this.gameProv.currentPicture = this.currentQuestions[this.currentQuestion].rightAnswer;
      } else {
        this.gameProv.currentPicture = this.currentPictureCounter % this.currentQuestions[this.currentQuestion].answers.length;
      }

    }, this.commonAnimationDuration / 2);

    if (this.screenState === ScreenStateType.displayQuestion && ((this.currentPictureCounter + 1) * this.currentPictureStayDuration) < this.timeBarAnimationDuration) {
      this.switchPicturesTimer = setTimeout(() => this.currentPictureSwitch(), this.currentPictureStayDuration);
    }
  }

  getQuestionsFromCategory(category: Category) {
    return this.quiz.questions.filter((question) => question.category.name === category.name);
  }

  getPicturePath(question: Question, answerIndex: number) {
    return this.quiz.uuid + '/' + question.uuid + '/' + question.answers[answerIndex];
  }

  getExtraPath(question: Question, extraIndex: number) {
    return this.quiz.uuid + '/' + question.uuid + '/' + question.extras[extraIndex];
  }

  getPlayerHeight() {
    let player = <HTMLElement> document.querySelector(".player");
    return player.offsetHeight;
  }

  getPlayerActualYTranslation(player: Player) {
    return (player.animations.actualPosition - player.animations.initialPosition) * this.getPlayerHeight();
  }

  getPlayerPreviousYTranslation(player: Player) {
    return (player.animations.previousPosition - player.animations.initialPosition) * this.getPlayerHeight();
  }

  saveActualYTranslation(e, i) {
    if (this.gameProv.players[i]) {
      e.element.setAttribute('style',
        "transform: translateY(" + (this.gameProv.players[i].animations.actualPosition - this.gameProv.players[i].animations.initialPosition)  * this.getPlayerHeight() +"px)");
    }
  }

  getAvatarWidth() {
    let avatar = <HTMLElement> document.querySelector(".avatar");
    return {'margin-right': avatar.offsetWidth + 'px'};
  }

  getNicknameFontSize() {
    let avatar = <HTMLElement> document.querySelector(".avatar");
    return {'font-size': (avatar.offsetWidth / 3.5) + 'px'};
  }

  getPointsFontSize() {
    let avatar = <HTMLElement> document.querySelector(".avatar");
    return {'font-size': (avatar.offsetWidth / 5.0) + 'px'};
  }

  setShowMenu() {
    if (this.showMenuCounter === 0) {
      setTimeout(() => this.showMenuCounter = 0, 600);
    }

    this.showMenuCounter++;

    if ( this.showMenuCounter >= 2 ) {
      this.showMenuCounter = 0;

      let actionSheet = this.actionSheetCtrl.create({
        buttons: this.getMenuButtons()
      });
      actionSheet.present();
    }
  }

  getMenuButtons() {
    return [
      {
        text: this.pause === false ? this.translate.instant('Pause') : this.translate.instant('PLAY'),
        icon: !this.platform.is('ios') ? this.pause === false ? 'pause' : 'play' : null,
        handler: () => {
          this.pause = !this.pause;
        }
      },{
        text: this.translate.instant('EXIT'),
        icon: !this.platform.is('ios') ? 'square' : null,
        handler: () => {
          this.exit();
        }
      },{
        text: this.translate.instant('CLOSE'),
        icon: !this.platform.is('ios') ? 'close' : null,
        role: 'cancel',
      }
    ];
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

  exit() {
    this.showMenuCounter = 0;
    this.navCtrl.pop();
  }

  /* this will be executed when view is poped, either by exit() or by back button */
  ionViewWillUnload() {
    this.gameProv.deleteGame().then(() => {

    }).catch(error => {

    });

    this.allPlayersAnsweredSubscription.unsubscribe();

    this.insomnia.allowSleepAgain().then(() => {
      console.log("Device can go sleep again.");
    }).catch(() => {
      console.log("Device could not be allowed to sleep again.");
    });

    if (this.platform.is('android')) {
      /* Unlock screen orientation */
      this.screenOrientation.unlock();

      //width is dependent on screen orientation
      //if (Math.min(this.platform.width(), this.platform.height()) < 800) {
      //There is a bug with ImagePicker so force portrait anytime for now
      this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
      //}

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

  renderAvatar(base64: string) {
    if (base64) {
      return this.sanitizer.bypassSecurityTrustStyle(`url('${base64}')`);
    } else {
      return this.sanitizer.bypassSecurityTrustStyle(`url(assets/svgs/icon.svg)`);
    }
  }

  renderQrCode(base64: string) {
    return this.sanitizer.bypassSecurityTrustUrl(base64);
  }
}
