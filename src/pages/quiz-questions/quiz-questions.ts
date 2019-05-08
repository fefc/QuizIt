import { Component, ViewChild } from '@angular/core';
import { NavController, ModalController, LoadingController, AlertController, PopoverController, NavParams, Navbar, reorderArray } from 'ionic-angular';

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
          this.openNewQuestionPage();
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
          //Delete
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
      title: 'Rename category',
      inputs: [
        {
          name: 'categoryName',
          placeholder: 'Economics',
          value: category.name
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
            if (data.categoryName.length > 3 && this.quiz.categorys.findIndex((category) => category.name === data.categoryName) === -1 ) {

              // renaome questions reference first
              let questionIndex: number = this.quiz.questions.findIndex((question) => question.category.name === category.name);

              while (questionIndex !== -1) {
                this.quiz.questions[questionIndex].category.name = data.categoryName;
                questionIndex = this.quiz.questions.findIndex((question) => question.category.name === category.name);
              }

              category.name = data.categoryName;

              let loading = this.loadingCtrl.create({
                content: 'Saving...'
              });

              this.quizsProv.saveToStorage(this.quiz).then(() => {
                loading.dismiss();
              }).catch(() => {
                loading.dismiss();
                alert('Unable to save Quiz.');
              });

            }
            else {
              let error = this.alertCtrl.create({
                title: 'Error creating category',
                message: 'Category name must be more than 3 characters long and should not already exist',
                buttons: [
                  {
                    text: 'Ok',
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
    this.quiz.categorys = reorderArray(this.quiz.categorys, indexes);

    let loading = this.loadingCtrl.create({
      content: 'Saving changes...'
    });

    loading.present();

    this.quizsProv.saveToStorage(this.quiz).then(() => {
      loading.dismiss();
    }).catch(() => {
      loading.dismiss();
      alert('Unable to save Quiz.');
    });
  }

  reorderQuestions(indexes:any, category: Category) {
    let realFrom: number = this.quiz.questions.indexOf(this.getQuestionsFromCategory(category)[indexes.from]);
    let realTo: number = indexes.from < indexes.to ? realFrom + indexes.to : realFrom - (indexes.from - indexes.to);

    this.quiz.questions = reorderArray(this.quiz.questions, {from: realFrom, to: realTo});

    let loading = this.loadingCtrl.create({
      content: 'Saving changes...'
    });

    loading.present();

    this.quizsProv.saveToStorage(this.quiz).then(() => {
      loading.dismiss();
    }).catch(() => {
      loading.dismiss();
      alert('Unable to save Quiz.');
    });
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

  deleteSelected() {
    this.quiz.questions = this.quiz.questions.filter((q) => q.selected !== true);
    this.selectedQuestions = 0;

    let loading = this.loadingCtrl.create({
      content: 'Saving changes...'
    });

    loading.present();

    this.quizsProv.saveToStorage(this.quiz).then(() => {
      loading.dismiss();
    }).catch(() => {
      loading.dismiss();
      alert('Unable to save Quiz.');
    });
  }

  openQuestionPage(question: Question) {
    if (this.selectedQuestions === 0) {
      let modal = this.modalCtrl.create(QuestionPage, {quizUuid: this.quiz.uuid, categorys: this.quiz.categorys, question: question});
      modal.present();
      modal.onDidDismiss(data => {
        if (data) {
          this.saveChanges(data.question);
        }
      });
    } else {
      this.selectQuestion(question);
    }
  }

  openNewQuestionPage() {
    let modal = this.modalCtrl.create(QuestionPage, {quizUuid: this.quiz.uuid, categorys: this.quiz.categorys});
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        this.saveChanges(data.question);
      }
    });
  }

  saveChanges(question: Question){
    let loading = this.loadingCtrl.create({
      content: 'Saving changes...'
    });

    loading.present();

    //Make sure the category exists, if not add it
    if (this.quiz.categorys.findIndex((category) => category.name === question.category.name) === -1) {
      this.quiz.categorys.push({
        name: question.category.name
      });
    }

    //Make sure question exists, if not add it
    let questionIndex: number = this.quiz.questions.findIndex((q) => q.uuid === question.uuid);
    if ( questionIndex === -1) {
      this.quiz.questions.push(question);
    }
    else {
      this.quiz.questions[questionIndex].question = question.question;
      this.quiz.questions[questionIndex].type = question.type;
      this.quiz.questions[questionIndex].rightAnswer = question.rightAnswer;
      this.quiz.questions[questionIndex].answers = question.answers;
      this.quiz.questions[questionIndex].extras = question.extras;
      this.quiz.questions[questionIndex].category = question.category;
      this.quiz.questions[questionIndex].authorId = question.authorId;
    }

    this.quizsProv.saveToStorage(this.quiz).then(() => {
      loading.dismiss();
    }).catch(() => {
      loading.dismiss();
      alert('Unable to save Quiz.');
    });
  }

  getQuestionsFromCategory(category: Category) {
    return this.quiz.questions.filter((question) => question.category.name === category.name);
  }


  openQuizSettingsPage() {
    let modal = this.modalCtrl.create(QuizSettingsPage, {title: this.quiz.title, settings: this.quiz.settings});
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        let loading = this.loadingCtrl.create({
          content: 'Saving settings...'
        });

        loading.present();

        this.quiz.title = data.title;
        this.quiz.settings = data.settings;

        this.quizsProv.saveToStorage(this.quiz).then(() => {
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
