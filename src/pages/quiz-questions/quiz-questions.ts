import { Component } from '@angular/core';
import { NavController, ModalController, LoadingController, AlertController, NavParams } from 'ionic-angular';

import { Quiz } from '../../models/quiz';
import { Category } from '../../models/category';
import { QuestionType } from '../../models/question';
import { Question } from '../../models/question';

import { QuizsProvider } from '../../providers/quizs/quizs';

import { QuestionPage } from '../question/question';
import { PlayPage } from '../play/play';



@Component({
  selector: 'page-quiz-questions',
  templateUrl: 'quiz-questions.html'
})
export class QuizQuestionsPage {
  quiz: Quiz;

  constructor(
    public navCtrl: NavController,
    public modalCtrl: ModalController,
    public loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private quizsProv: QuizsProvider,
    params: NavParams) {
      this.quiz = params.data.quiz;
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

  openQuestionPage(question: Question) {
    let categoryNames = new Array<string>();

    for (let category of this.quiz.categorys) {
      categoryNames.push(category.name);
    }

    let modal = this.modalCtrl.create(QuestionPage, {categoryNames: categoryNames, selecteCategoryName: categoryNames[0], question});
    modal.present();


  }

  openNewQuestionPage() {
    let categoryNames = new Array<string>();
    let newQuestion: Question = {
        question: '',
        type: QuestionType.classic,
        rightAnswer: -1,
        answers: ['','','',''],
        extras: [],
        authorId: -1
      };

    for (let category of this.quiz.categorys) {
      categoryNames.push(category.name);
    }

    let modal = this.modalCtrl.create(QuestionPage, {categoryNames: categoryNames, selecteCategoryName: categoryNames[0], question: newQuestion});
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        let loading = this.loadingCtrl.create({
          content: 'Creating Question...'
        });

        loading.present();

        console.log(String(data.categoryName));
        console.log(this.quiz.categorys);

        let index = this.quiz.categorys.findIndex((category) => category.name === data.categoryName);

        console.log(index);

        if (index === -1) {
          this.quiz.categorys.push({
            name: data.categoryName,
            questions: [data.question]
          });
        }
        else {
          this.quiz.categorys[index].questions.push(data.question);
        }

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
}
