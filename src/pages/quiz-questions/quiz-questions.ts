import { Component } from '@angular/core';
import { NavController, ModalController, LoadingController, NavParams } from 'ionic-angular';

import { Quiz } from '../../models/quiz';

import { QuizsProvider } from '../../providers/quizs/quizs';

import { QuestionPage } from '../question/question';

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
    private quizsProv: QuizsProvider,
    params: NavParams) {
      this.quiz = params.data.quiz;
  }

  openNewQuestionPage() {
    let categoryNames = new Array<string>();

    for (let category of this.quiz.categorys) {
      categoryNames.push(category.name);
    }

    let modal = this.modalCtrl.create(QuestionPage, {categoryNames: categoryNames});
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
}
