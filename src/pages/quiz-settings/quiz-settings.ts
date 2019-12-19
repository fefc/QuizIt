import { Component } from '@angular/core';
import { ViewController, ToastController, NavParams } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

import { QuizSettings } from '../../models/quiz-settings';
import { DefaultQuizSettings } from '../../models/quiz-settings';

@Component({
  selector: 'page-quiz-settings',
  templateUrl: 'quiz-settings.html'
})
export class QuizSettingsPage {
  private title: string;
  private settings: QuizSettings;
  private showAdvancedCounter: number;

  constructor(public viewCtrl: ViewController,
              public toastCtrl: ToastController,
              private translate: TranslateService,
              params: NavParams) {
    this.showAdvancedCounter = 0;

    if (params.data.title) {
      this.title = JSON.parse(JSON.stringify(params.data.title));
    } else {
      this.title = '';
    }

    if (params.data.settings) {
      //lets make deep copies, so that we don't modfiy anything before user confirmation
      this.settings = JSON.parse(JSON.stringify(params.data.settings));
    } else {
      this.settings = {
        commonAnimationDuration: DefaultQuizSettings.COMMON_ANIMATION_DURATION,
        timeBarAnimationDuration: DefaultQuizSettings.TIMEBAR_ANIMATION_DURATION,
        playerAnswerAnimationDuration: DefaultQuizSettings.PLAYER_ANSWER_ANIMATION_DURATION,
        showNextDelay: DefaultQuizSettings.SHOW_NEXT_DELAY,
        amountOfPicturesToShow: DefaultQuizSettings.AMOUNT_OF_PICUTRES_TO_SHOW,
        autoPlay: DefaultQuizSettings.AUTO_PLAY,
        startMessage: DefaultQuizSettings.START_MESSAGE,
        endMessage: DefaultQuizSettings.END_MESSAGE,
        backgroundImage: DefaultQuizSettings.BACKGROUND_IMAGE,
        extraDisplayDuration: DefaultQuizSettings.EXTRA_DISPLAY_DURATION
      };
    }
  }

  enableSaveButton() {
    let enable: boolean = true;

    if (this.title.length < 3) {
      enable = false;
    }

    if (this.settings.commonAnimationDuration < 1 || this.settings.commonAnimationDuration > DefaultQuizSettings.COMMON_ANIMATION_DURATION * 4) {
      enable = false;
    }

    if (this.settings.timeBarAnimationDuration < 1 || this.settings.timeBarAnimationDuration > DefaultQuizSettings.TIMEBAR_ANIMATION_DURATION * 4) {
      enable = false;
    }

    if (this.settings.playerAnswerAnimationDuration < 1 || this.settings.playerAnswerAnimationDuration > DefaultQuizSettings.PLAYER_ANSWER_ANIMATION_DURATION * 4) {
      enable = false;
    }

    if (this.settings.showNextDelay < 1 || this.settings.showNextDelay > DefaultQuizSettings.SHOW_NEXT_DELAY * 4) {
      enable = false;
    }

    if (this.settings.amountOfPicturesToShow < 1 || this.settings.amountOfPicturesToShow > DefaultQuizSettings.AMOUNT_OF_PICUTRES_TO_SHOW * 4) {
      enable = false;
    }

    if (this.settings.extraDisplayDuration < 1 || this.settings.extraDisplayDuration > DefaultQuizSettings.EXTRA_DISPLAY_DURATION * 4) {
      enable = false;
    }

    return enable;
  }

  save() {
    if (this.enableSaveButton()) {
      let newSettings: QuizSettings = {
        commonAnimationDuration: Number(this.settings.commonAnimationDuration),
        timeBarAnimationDuration: Number(this.settings.timeBarAnimationDuration),
        playerAnswerAnimationDuration: Number(this.settings.playerAnswerAnimationDuration),
        showNextDelay: Number(this.settings.showNextDelay),
        amountOfPicturesToShow: Number(this.settings.amountOfPicturesToShow),
        autoPlay: Boolean(this.settings.autoPlay),
        startMessage: this.settings.startMessage,
        endMessage: this.settings.endMessage,
        backgroundImage: this.settings.backgroundImage,
        extraDisplayDuration: Number(this.settings.extraDisplayDuration)
      };

      this.viewCtrl.dismiss({title: this.title, settings: newSettings});
    }
  }

  setDefaultValues() {
      this.settings.commonAnimationDuration = DefaultQuizSettings.COMMON_ANIMATION_DURATION;
      this.settings.timeBarAnimationDuration = DefaultQuizSettings.TIMEBAR_ANIMATION_DURATION;
      this.settings.playerAnswerAnimationDuration = DefaultQuizSettings.PLAYER_ANSWER_ANIMATION_DURATION;
      this.settings.showNextDelay = DefaultQuizSettings.SHOW_NEXT_DELAY;
      this.settings.amountOfPicturesToShow = DefaultQuizSettings.AMOUNT_OF_PICUTRES_TO_SHOW;
      this.settings.autoPlay = DefaultQuizSettings.AUTO_PLAY;
      this.settings.startMessage = DefaultQuizSettings.START_MESSAGE;
      this.settings.autoPlay = DefaultQuizSettings.AUTO_PLAY;
      this.settings.endMessage = DefaultQuizSettings.END_MESSAGE;
      this.settings.backgroundImage = DefaultQuizSettings.BACKGROUND_IMAGE;
      this.settings.extraDisplayDuration = DefaultQuizSettings.EXTRA_DISPLAY_DURATION;
  }

  showAdvanced() {
    if (this.showAdvancedCounter < 2) {
      let toast = this.toastCtrl.create({
        message: this.translate.instant('CLICK') + ' ' + (2 - this.showAdvancedCounter) + ' ' + this.translate.instant('TIMES_TO_SHOW_ADVANCED_SETTINGS'),
        duration: 2000
      });
      toast.present();
    }

    this.showAdvancedCounter += 1;
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

}
