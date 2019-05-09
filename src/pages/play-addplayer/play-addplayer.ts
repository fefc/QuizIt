import { Component, ViewChild } from '@angular/core';
import { ViewController, AlertController, LoadingController, NavParams, Slides } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { Subscription } from "rxjs/Subscription";
import 'rxjs/add/observable/fromEvent';

import { Player } from '../../models/player';
import { Buzzer } from '../../models/buzzers';
import { BuzzersConstants } from '../../models/buzzers';

@Component({
  selector: 'page-play-addplayer',
  templateUrl: 'play-addplayer.html'
})
export class PlayAddPlayerPage {
  private avatars: Array<string> = ['Bunny.png',
                                    'Dog.png',
                                    'Duck_Guy.png',
                                    'Frankie.png',
                                    'Happy_Girl.png',
                                    'Mad_Guy.png',
                                    'Proog.png',
                                    'Sintel.png'];

  private uuid: string = '';
  private nickname: string =  '';
  private avatar: string = 'Bunny.png';

  private currentPlayers: Array<Player>;

  private loading:  any;
  private remoteButtonsRequestsSubscription: Subscription;

  @ViewChild(Slides) slides: Slides;

  constructor(private viewCtrl: ViewController,
              private alertCtrl: AlertController,
              private loadingCtrl: LoadingController,
              params: NavParams) {
    this.currentPlayers = params.data.currentPlayers;

    if (!this.currentPlayers) {
      this.currentPlayers = [];
    }
  }

  enableAddButton() {
    let enable: boolean = false;
    if (this.nickname.length > 2 && this.avatar) {
      if (!this.currentPlayers.some((x) => x.nickname === this.nickname || x.avatar === this.avatar)) {
        enable = true;
      }
    }
    return enable;
  }

  slideChanged() {
    this.avatar = this.avatars[this.slides.getActiveIndex()];
  }


  add() {
    if (this.enableAddButton()) {
      this.uuid = '';

      this.loading = this.loadingCtrl.create({
        spinner: 'dots',
        content: 'Please take a Buzzer and press any button to attribute it to this player',
        duration: 10000
      });

      this.loading.onDidDismiss((data) => {
        if (this.remoteButtonsRequestsSubscription) {
          this.remoteButtonsRequestsSubscription.unsubscribe();

          if (this.uuid.length > 0) {
            this.viewCtrl.dismiss({uuid: this.uuid, nickname: this.nickname, avatar: this.avatar});
          } else {
            let alert = this.alertCtrl.create({
              title: 'Could not attribute Buzzer',
              subTitle: 'Did you pressed a button? If yes, you buzzer is already used.',
              buttons: ['Close']
            });
            alert.present();
          }
        }
      });

      this.loading.present();

      this.remoteButtonsRequestsSubscription = Observable.fromEvent(document, 'keypress').subscribe((e: any) => this.handleKeyboardEvent(e), (error) => {
        alert("Could not attach request listener.");
        this.loading.dismiss();
      });
    }
  }

  handleKeyboardEvent(event: any) {
    var buzzer: Buzzer = BuzzersConstants.KEYSETS.find((x) => x.keys.indexOf(event.key) > -1);

    if (buzzer) {
      if (!this.currentPlayers.some((x) => x.uuid === buzzer.uuid)) {
        this.uuid = buzzer.uuid;
        this.loading.dismiss();
      }
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

}
