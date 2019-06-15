import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from 'ionic-angular';

/*import { Quiz } from '../../models/quiz';
import { QuestionType } from '../../models/question';

import { QuizsProvider } from '../../providers/quizs/quizs';

import { HomeMenu } from './menu';*/

@Component({
  selector: 'page-games',
  templateUrl: 'games.html'
})

export class GamesPage {

  constructor(
    public navCtrl: NavController,
    public modalCtrl: ModalController,
    public loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private popoverCtrl: PopoverController) {

  }

  /*openMenu(event) {
    let popover = this.popoverCtrl.create(HomeMenu);
    popover.present(({ev: event}));

    popover.onDidDismiss((data) => {
      if (data) {
        if (data.index === 0) {
          this.openQuizNewPage();
        } else if (data.index === 1) {
          setTimeout(() => this.import(), 0); //Wired trick to make it work in browser
        }
      }
    });
  }

  startQuiz(quiz: Quiz) {
    this.navCtrl.push(PlayPage, {quiz: quiz});
  }*/
}
