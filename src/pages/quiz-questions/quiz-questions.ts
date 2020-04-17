import { Component, ViewChild } from '@angular/core';
import { NavController, ModalController, LoadingController, AlertController, PopoverController, NavParams, Navbar, reorderArray } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

import { Quiz } from '../../models/quiz';
import { Category } from '../../models/category';
import { QuestionType } from '../../models/question';
import { Question } from '../../models/question';

import { QuizsProvider } from '../../providers/quizs/quizs';

import { QuizQuestionsMenu } from './menu';
import { QuizQuestionsMenuCategory } from './menu-category';
import { QuizSettingsPage } from '../quiz-settings/quiz-settings';
import { QuestionPage } from '../question/question';
import { PlayPage } from '../play/play';

@Component({
  selector: 'page-quiz-questions',
  templateUrl: 'quiz-questions.html'
})
export class QuizQuestionsPage {
  private QuestionType = QuestionType; //for use in Angular html

  @ViewChild(Navbar) navBar: Navbar;

  private quiz: Quiz;

  private showReorderCategorys: boolean;

  private selectedQuestions: number;

  constructor(
    public navCtrl: NavController,
    public modalCtrl: ModalController,
    public loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private popoverCtrl: PopoverController,
    private quizsProv: QuizsProvider,
    private translate: TranslateService,
    params: NavParams) {
      this.quiz = params.data.quiz;
      this.showReorderCategorys = false;
      this.selectedQuestions = 0;
  }

  ionViewDidLoad() {
    this.navBar.backButtonClick = () => {
      this.backButtonAction();
    }
  }


  openMenu(event) {
    let popover = this.popoverCtrl.create(QuizQuestionsMenu);
    popover.present(({ev: event}));

    popover.onDidDismiss((data) => {
      if (data) {
        if (data.index === 0) {
          this.openQuestionPage();
        } else if (data.index === 1) {
          this.showReorderCategorys = !this.showReorderCategorys;
        } else if (data.index === 2) {
          this.openQuizSettingsPage();
        }
      }
    });
  }

  openMenuCategory(event: Event, category: Category) {
    let popover = this.popoverCtrl.create(QuizQuestionsMenuCategory);
    popover.present(({ev: event}));

    popover.onDidDismiss((data) => {
      if (data) {
        if (data.index === 0) {
          this.renameCategory(category);
        } else if (data.index === 1) {
          this.showReorderCategorys = !this.showReorderCategorys;
        } else if (data.index === 2) {
          this.deleteCategoryWithDialog(category);
        }
      }
    });
  }

  backButtonAction(){
    if (this.showReorderCategorys) {
      this.showReorderCategorys = false;
    } else if(this.selectedQuestions > 0) {
      for (let question of this.quiz.questions.filter((q) => q.selected)) {
        this.selectQuestion(question);
      }
    } else {
      this.navCtrl.pop();
    }
  }

  renameCategory(category: Category) {
    let renameAlert = this.alertCtrl.create({
      title: this.translate.instant('RENAME_CATEGORY'),
      inputs: [
        {
          name: 'categoryName',
          placeholder: this.translate.instant('RENAME_CATEGORY_PLACEHOLDER'),
          value: category.name
        }
      ],
      buttons: [
        {
          text: this.translate.instant('CANCEL'),
          role: 'cancel',
        },
        {
          text: this.translate.instant('SAVE'),
          handler: data => {
            if (data.categoryName.length > 3 && this.quiz.categorys.findIndex((category) => category.name === data.categoryName) === -1) {
              let newCategoryData: Category = JSON.parse(JSON.stringify(category));
              newCategoryData.name = data.categoryName;

              let loading = this.loadingCtrl.create({
                content: this.translate.instant('SAVING')
              });

              loading.present();

              this.quizsProv.saveCategorysOnline(this.quiz, [newCategoryData]).then(() => {
                loading.dismiss();
              }).catch(() => {
                loading.dismiss();
                alert('Unable to save Quiz.');
              });

            }
            else {
              let error = this.alertCtrl.create({
                title: this.translate.instant('ERROR_CREATING_CATEGORY'),
                message: this.translate.instant('ERROR_CREATING_CATEGORY_INFO'),
                buttons: [
                  {
                    text: this.translate.instant('OK'),
                    role: 'ok',
                  }
                ]
              });
              error.present();
            }
          }
        }
      ]
    });
    renameAlert.present();
  }

  reorderCategorys(indexes:any) {
    if (this.quiz.categorys.length > 1) {
      let copyOfCategorys: Array<Category>;
      copyOfCategorys = JSON.parse(JSON.stringify(reorderArray(this.quiz.categorys, indexes)));

      copyOfCategorys[0].afterCategoryUuid = 'first';

      for (let i = 1; i < copyOfCategorys.length; i++) {
        copyOfCategorys[i].afterCategoryUuid = copyOfCategorys[i - 1].uuid;
      }

      let loading = this.loadingCtrl.create({
        content: this.translate.instant('SAVING')
      });

      loading.present();

      this.quizsProv.saveCategorysOnline(this.quiz, copyOfCategorys).then(() => {
        loading.dismiss();
      }).catch((error) => {
        loading.dismiss();
        console.log(error);
        alert('Unable to save Quiz. ' + error);
      });
    }
  }

  deleteCategoryWithDialog(category: Category) {
    if (this.quiz.categorys.length > 1) {
      if (this.quiz.questions.filter((q) => q.categoryUuid === category.uuid).length > 0) {
        let deleteAlert = this.alertCtrl.create({
          title: this.translate.instant('DELETE_CATEGORY'),
          message: this.translate.instant('DELETE_CATEGORY_INFO'),
          buttons: [
            {
              text: this.translate.instant('CANCEL'),
              role: 'cancel',
            },
            {
              text: this.translate.instant('DELETE'),
              handler: () => {
                this.deleteCategory(category);
              }
            }
          ]
        });

        deleteAlert.present();
      } else {
        this.deleteCategory(category);
      }
    } else {
      let deleteAlert = this.alertCtrl.create({
        title: this.translate.instant('ERROR_DELETING_CATEGORY'),
        message: this.translate.instant('ERROR_DELETING_CATEGORY_INFO'),
        buttons: [
          {
            text: this.translate.instant('OK'),
            role: 'ok',
          }
        ]
      });

      deleteAlert.present();
    }
  }

  deleteCategory(category: Category) {
    let loading = this.loadingCtrl.create({
      content: this.translate.instant('SAVING')
    });

    loading.present();

    this.quizsProv.deleteCategoryOnline(this.quiz, category).then(() => {
      loading.dismiss();
    }).catch((error) => {
      loading.dismiss();
      console.log(error);
      alert('Unable to save Quiz.');
    });
  }

  reorderQuestions(indexes:any, category: Category) {
    if (this.quiz.questions.length > 1) {
      let realFrom: number = this.quiz.questions.indexOf(this.getQuestionsFromCategory(category)[indexes.from]);
      let realTo: number = this.quiz.questions.indexOf(this.getQuestionsFromCategory(category)[indexes.to])

      let copyOfQuestions: Array<Question>;
      copyOfQuestions = JSON.parse(JSON.stringify(reorderArray(this.quiz.questions, {from: realFrom, to: realTo})));

      copyOfQuestions[0].afterQuestionUuid = 'first';

      for (let i = 1; i < copyOfQuestions.length; i++) {
        copyOfQuestions[i].afterQuestionUuid = copyOfQuestions[i - 1].uuid;
      }

      let loading = this.loadingCtrl.create({
        content: this.translate.instant('SAVING')
      });

      loading.present();

      this.quizsProv.saveQuestionsOnline(this.quiz, copyOfQuestions).then(() => {
        loading.dismiss();
      }).catch(() => {
        loading.dismiss();
        alert('Unable to save Quiz.');
      });
    }
  }

  selectQuestion(question: Question) {
    if (!question.selected) {
      question.selected = true;
      this.selectedQuestions += 1;
    }
    else {
      question.selected = false;
      if (this.selectedQuestions > 0) {
        this.selectedQuestions -= 1;
      }
    }
  }

  enableUnhideIcon() {
    return this.quiz.questions.some((q) => q.selected === true && q.hide === true) && !this.quiz.questions.some((q) => q.selected === true && !q.hide);
  }

  hideOrUnhideSelected() {
    let newState: boolean = this.enableUnhideIcon() ? false : true;
    let copyOfQuestions: Array<Question> = JSON.parse(JSON.stringify(this.quiz.questions));

    for (let question of copyOfQuestions.filter((q) => q.selected === true)) {
      question.hide = newState;
      this.selectQuestion(question);
    }

    let loading = this.loadingCtrl.create({
      content: this.translate.instant('SAVING')
    });

    loading.present();

    this.quizsProv.saveQuestionsOnline(this.quiz, copyOfQuestions).then(() => {
      loading.dismiss();
    }).catch(() => {
      loading.dismiss();
      alert('Unable to save Quiz.');
    });
  }

  deleteSelected() {
    this.selectedQuestions = 0;

    let loading = this.loadingCtrl.create({
      content: this.translate.instant('SAVING')
    });

    loading.present();

    this.quizsProv.deleteQuestionsOnline(this.quiz).then(() => {
      loading.dismiss();
    }).catch(() => {
      loading.dismiss();
      alert('Unable to save Quiz.');
    });
  }

  openQuestionPage(question?: Question) {
    if (this.selectedQuestions === 0) {
      let modal;

      if (question) modal = this.modalCtrl.create(QuestionPage, {quizUuid: this.quiz.uuid, categorys: this.quiz.categorys, question: question});
      else modal = this.modalCtrl.create(QuestionPage, {quizUuid: this.quiz.uuid, categorys: this.quiz.categorys});

      modal.present();
      modal.onDidDismiss(data => {
        if (data) {
          let loading = this.loadingCtrl.create({
            content: this.translate.instant('SAVING')
          });

          loading.present();

          if (data.question.afterQuestionUuid === '') {
            data.question.afterQuestionUuid = (this.quiz.questions.length > 0 ? this.quiz.questions[this.quiz.questions.length - 1].uuid : 'first');
          }

          this.quizsProv.saveQuestionOnline(this.quiz, data.question, data.newCategory, true).then(() => {
            loading.dismiss();
          }).catch((error) => {
            loading.dismiss();
            console.log(error);
            alert('Unable to save Quiz.');
          });
        }
      });
    } else {
      this.selectQuestion(question);
    }
  }

  getQuestionsFromCategory(category: Category) {
    return this.quiz.questions.filter((question) => question.categoryUuid === category.uuid);
  }

  openQuizSettingsPage() {
    let modal = this.modalCtrl.create(QuizSettingsPage, {title: this.quiz.title, settings: this.quiz.settings});
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        let loading = this.loadingCtrl.create({
          content: this.translate.instant('SAVING')
        });

        loading.present();

        this.quizsProv.saveSettingsOnline(this.quiz, data.title, data.settings).then(() => {
          loading.dismiss();
        }).catch(() => {
          loading.dismiss();
          alert('Unable to save Quiz.');
        });
      }
    });
  }

  startQuiz() {
    this.navCtrl.push(PlayPage, {quiz: this.quiz});
  }

  getIconForQuestion(type: QuestionType) {
    if (type === QuestionType.classic) {
      return 'list';
    } else if (type === QuestionType.stopwatch) {
      return 'stopwatch';
    } else if (type === QuestionType.rightPicture) {
      return 'images';
    } else {
      return 'close';
    }
  }
}
