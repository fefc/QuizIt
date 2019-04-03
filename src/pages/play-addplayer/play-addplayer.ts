import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';

import { Player } from '../../models/player';

@Component({
  selector: 'page-play-addplayer',
  templateUrl: 'play-addplayer.html'
})
export class PlayAddPlayerPage {
  private newPlayer: Player = {
    uuid: '',
    nickname: '',
    avatar: '',
    initialPosition: -1,
    actualPosition: -1,
    previousPosition: -1,
    answer: -1
  };

  constructor(public viewCtrl: ViewController) {

  }

  enableAddButton() {
    let enable: boolean = false;
    /*if (this.newQuiz.title) {
      if (this.newQuiz.title.length > 0) {
        enable = true;
      }
    }*/
    return enable || true;
  }

  add() {
    /*if (this.enableCreateButton()) {
      this.newQuiz.creationDate = Math.floor(Date.now() / 1000);
      this.viewCtrl.dismiss(this.newQuiz);
    }*/
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

}
