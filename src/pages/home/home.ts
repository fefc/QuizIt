import { Component } from '@angular/core';
import { NavController, ModalController, LoadingController } from 'ionic-angular';

import { Quiz } from '../../models/quiz';

import { QuizsProvider } from '../../providers/quizs/quizs';

import { QuizNewPage } from '../quiz-new/quiz-new';
import { QuizQuestionsPage } from '../quiz-questions/quiz-questions';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  private selectedQuizs: number;

  constructor(
    public navCtrl: NavController,
    public modalCtrl: ModalController,
    public loadingCtrl: LoadingController,
    private quizsProv: QuizsProvider) {

      this.selectedQuizs = 0;
  }

  openQuizNewPage() {
    let modal = this.modalCtrl.create(QuizNewPage);
    modal.present();
    modal.onDidDismiss(data => {
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
    });
  }

  openQuizQuestionsPage(quiz: Quiz) {
    if (this.selectedQuizs === 0) {
      this.navCtrl.push(QuizQuestionsPage, {quiz: quiz});
    }
  }

  selectQuiz(quiz: Quiz) {
    if (!quiz.selected) {
      quiz.selected = true;
      this.selectedQuizs += 1;
    }
    else {
      quiz.selected = false;
      this.selectedQuizs -= 1;
    }
  }

  deleteSelected() {
    this.quizsProv.deleteSelectedFromStorage().then(() => {
      this.selectedQuizs = 0;
    }).catch(() => {
      for (let selectedQuiz of this.quizsProv.quizs) {
        selectedQuiz.selected = false;
      }
      this.selectedQuizs = 0;
      alert('Unable to delete selected quizs.');
    });
  }
}
