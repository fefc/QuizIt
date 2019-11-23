import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NavController, NavParams, AlertController, LoadingController, PopoverController } from 'ionic-angular';
import { Insomnia } from '@ionic-native/insomnia';
import { TranslateService } from '@ngx-translate/core';

import { GameState } from '../../models/game';

import { GameControllerMenu } from './menu';
import { GameControllerProvider } from '../../providers/game-controller/game-controller';

@Component({
  selector: 'page-game-controller',
  templateUrl: 'game-controller.html'
})

export class GameControllerPage {
  private GameState = GameState; //for use in Angluar html

  constructor(
    public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private popoverCtrl: PopoverController,
    private sanitizer:DomSanitizer,
    private insomnia: Insomnia,
    private gameControllerProv: GameControllerProvider,
    private translate: TranslateService,
    params: NavParams) {

      this.insomnia.keepAwake().then(() => {
        console.log("Device will be keept awake");
      }).catch(() => {
        console.log("Could not set keepAwake.");
      });
  }

  setAnswer(index: number) {
    if (this.gameControllerProv.player.answer === -1) {
      this.gameControllerProv.setPlayerAnswer(index).catch(() => {
        this.showSetAnswerErrorAlert();
      });
    }
  }

  showSetAnswerErrorAlert() {
    let message = this.alertCtrl.create({
      title: this.translate.instant('SET_ANSWER_ERROR'),
      message: this.translate.instant('TRY_AGAIN'),
      buttons: [
        {
          text: this.translate.instant('CLOSE'),
          role: 'ok',
        }
      ]
    });

    message.present();
  }

  openMenu(event) {
    let popover = this.popoverCtrl.create(GameControllerMenu);
    popover.present(({ev: event}));

    popover.onDidDismiss((data) => {
      if (data) {
        if (data.index === 0) {
          this.exit();
        }
      }
    });
  }

  renderPicture(base64: string) {
    return this.sanitizer.bypassSecurityTrustStyle(`url('${base64}')`);
  }

  exit() {
    this.navCtrl.pop();
  }

  /* this will be executed when view is poped, either by exit() or by back button */
  ionViewWillUnload() {
    this.insomnia.allowSleepAgain().then(() => {
      console.log("Device can go sleep again.");
    }).catch(() => {
      console.log("Device could not be allowed to sleep again.");
    });
    
    this.gameControllerProv.leaveGame().catch(() => {
      console.log("Could not leave game properly");
    });
  }
}
