import { Component } from '@angular/core';
import { Platform, NavController, ModalController, LoadingController, AlertController, NavParams, reorderArray } from 'ionic-angular';
import { File } from '@ionic-native/file';
import { AndroidPermissions } from '@ionic-native/android-permissions';

import { Quiz } from '../../models/quiz';
import { Category } from '../../models/category';
import { QuestionType } from '../../models/question';
import { Question } from '../../models/question';

import { QuizsProvider } from '../../providers/quizs/quizs';

import { QuizSettingsPage } from '../quiz-settings/quiz-settings';
import { QuestionPage } from '../question/question';
import { PlayPage } from '../play/play';

@Component({
  selector: 'page-quiz-questions',
  templateUrl: 'quiz-questions.html'
})
export class QuizQuestionsPage {
  private QuestionType = QuestionType; //for use in Angular html

  private quiz: Quiz;

  private showReorderCategorys: boolean;

  constructor(
    private platform: Platform,
    public navCtrl: NavController,
    public modalCtrl: ModalController,
    public loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private file: File,
    private androidPermissions: AndroidPermissions,
    private quizsProv: QuizsProvider,
    params: NavParams) {
      this.quiz = params.data.quiz;
      this.showReorderCategorys = false;
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

  openQuestionPage(question: Question) {
    let modal = this.modalCtrl.create(QuestionPage, {quizUuid: this.quiz.uuid, categorys: this.quiz.categorys, question: question});
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        this.saveChanges(data.question);
      }
    });
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
    let modal = this.modalCtrl.create(QuizSettingsPage, {settings: this.quiz.settings});
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        let loading = this.loadingCtrl.create({
          content: 'Saving settings...'
        });

        loading.present();

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

  export() {
    let loading = this.loadingCtrl.create({
      content: 'Exporting...'
    });

    loading.present();

    this.quizsProv.zip(this.quiz).then((data: any) => {
      if (this.platform.is('core')) {
        this.file.readAsDataURL(data.cordovaFilePath, data.filePath).then((data) => {
          var toto = window.location.href = "data:application/zip;" + data;
          loading.dismiss();
          alert("Be a bit more patient, a download popup should show up.");
        }).catch((error) => {
          loading.dismiss();
          alert("Something went wrong while exporting the quiz.");
        });

      } else if (this.platform.is('android')) {
        this.androidPermissions.hasPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE)
          .then(status => {
            if (status.hasPermission) {
              this.exportFileToAndroidDownload(data).then((url) => {
                loading.dismiss();
              }).catch((error) => {
                loading.dismiss();
                alert(error);
              });
            }
            else {
              this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE)
                .then(status => {
                  if(status.hasPermission) {
                    this.exportFileToAndroidDownload(data).then((url) => {
                      loading.dismiss();
                    }).catch((error) => {
                      loading.dismiss();
                      alert(error);
                    });
                  }
                });
            }
          });
      } else {
        loading.dismiss();
        alert("Export function is not supported.");
      }
    }).catch((err) => {
      alert(err);
    })
  }

  exportFileToAndroidDownload(data) {
    return new Promise((resolve, reject) => {
      this.file.moveFile(data.cordovaFilePath,  data.filePath, this.file.externalRootDirectory, data.filePath).then(() => {
        let message = this.alertCtrl.create({
          title: 'Exported quiz to',
          message: this.file.externalRootDirectory + data.filePath,
          buttons: [
            {
              text: 'Ok',
              role: 'ok',
            }
          ]
        });
        
        message.present();

        resolve();
      }).catch(() => {
        reject("Something went wrong while export the quiz.");
      })
    });


  }
}
