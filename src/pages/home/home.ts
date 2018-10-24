import { Component } from '@angular/core';
import { NavController, ModalController } from 'ionic-angular';

import { QuizNewPage } from '../quiz-new/quiz-new';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController, public modalCtrl: ModalController) {

  }

  openQuizNewPage() {
    let modal = this.modalCtrl.create(QuizNewPage);
    modal.present();
  }
}
