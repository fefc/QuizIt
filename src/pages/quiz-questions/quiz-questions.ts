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
    let modal = this.modalCtrl.create(QuestionPage);
    modal.present();
    /*modal.onDidDismiss(data => {
      if (data) {
        let loading = this.loadingCtrl.create({
          content: 'Creating Quiz...'
        });

        loading.present();

        this.quizsProv.saveToStorage(data).then(() => {
          loading.dismiss();
        }).catch(() => {
          loading.dismiss();
          alert('Unable to create Quiz.');
        });
      }
    });*/
  }
}
