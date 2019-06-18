import { Component } from '@angular/core';
import { NavController, ModalController, AlertController, LoadingController, PopoverController } from 'ionic-angular';

import { UserProfilesProvider } from '../../providers/user-profiles/user-profiles';

import { GameControllerPage } from '../game-controller/game-controller';


/*import { Quiz } from '../../models/quiz';
import { QuestionType } from '../../models/question';


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
    private popoverCtrl: PopoverController,
    private profilesProv: UserProfilesProvider) {

  }

  openGameControllerPage() {
    this.navCtrl.push(GameControllerPage, { profile: this.profilesProv.profiles[0] });
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
