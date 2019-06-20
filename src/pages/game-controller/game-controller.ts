import { Component } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { NavController, NavParams, AlertController, LoadingController, PopoverController } from 'ionic-angular';

import { UserProfile } from '../../models/user-profile';
import { QuestionType } from '../../models/question';

/*import { Quiz } from '../../models/quiz';

import { QuizsProvider } from '../../providers/quizs/quizs';*/

import { GameControllerMenu } from './menu';

@Component({
  selector: 'page-game-controller',
  templateUrl: 'game-controller.html'
})

export class GameControllerPage {
  private QuestionType = QuestionType; //for use in Angular html

  private profile: UserProfile;
  private type: QuestionType;
  private answer: number;

  constructor(
    public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private popoverCtrl: PopoverController,
    private sanitizer:DomSanitizer,
    params: NavParams) {
      if (!params.data.profile) {
        alert("error");
      } else {
        this.profile = JSON.parse(JSON.stringify(params.data.profile));
      }

      this.type = QuestionType.pictures;
      this.answer = -1;
  }

  openMenu(event) {
    let popover = this.popoverCtrl.create(GameControllerMenu);
    popover.present(({ev: event}));

    popover.onDidDismiss((data) => {
      if (data) {
        if (data.index === 0) {
          this.navCtrl.pop();
        }
      }
    });
  }

  setAnswer(index: number) {
    if (this.answer === -1) {
      this.answer = index;
      alert(index);
    }
  }

  renderPicture(base64: string) {
    return this.sanitizer.bypassSecurityTrustStyle(`url('${base64}')`);
  }
}
