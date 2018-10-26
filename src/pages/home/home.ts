import { Component } from '@angular/core';
import { NavController, ModalController, LoadingController } from 'ionic-angular';

import { QuizsProvider } from '../../providers/quizs/quizs';

import { QuizNewPage } from '../quiz-new/quiz-new';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(
    public navCtrl: NavController,
    public modalCtrl: ModalController,
    public loadingCtrl: LoadingController,
    private quizsProv: QuizsProvider) {

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
}
