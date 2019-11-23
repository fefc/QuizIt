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
      this.settings = {};
    }

    if (this.settings.commonAnimationDuration === undefined) {
      this.settings.commonAnimationDuration = DefaultQuizSettings.COMMON_ANIMATION_DURATION;
    }

    if (this.settings.timeBarAnimationDuration === undefined) {
      this.settings.timeBarAnimationDuration = DefaultQuizSettings.TIMEBAR_ANIMATION_DURATION;
    }

    if (this.settings.playerAnswerAnimationDuration === undefined) {
      this.settings.playerAnswerAnimationDuration = DefaultQuizSettings.PLAYER_ANSWER_ANIMATION_DURATION;
    }

    if (this.settings.showNextDelay === undefined) {
      this.settings.showNextDelay = DefaultQuizSettings.SHOW_NEXT_DELAY;
    }

    if (this.settings.amountOfPicturesToShow === undefined) {
      this.settings.amountOfPicturesToShow = DefaultQuizSettings.AMOUNT_OF_PICUTRES_TO_SHOW;
    }

    if (this.settings.autoPlay === undefined) {
      this.settings.autoPlay = DefaultQuizSettings.AUTO_PLAY;
    }

    if (this.settings.startMessage === undefined) {
      this.settings.startMessage = DefaultQuizSettings.START_MESSAGE;
    }

    if (this.settings.endMessage === undefined) {
      this.settings.endMessage = DefaultQuizSettings.END_MESSAGE;
    }

    if (this.settings.backgroundImage === undefined) {
      this.settings.backgroundImage = DefaultQuizSettings.BACKGROUND_IMAGE;
    }

    if (this.settings.extraDisplayDuration === undefined) {
      this.settings.extraDisplayDuration = DefaultQuizSettings.EXTRA_DISPLAY_DURATION;
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
      let newSettings: QuizSettings = {};

      if (this.settings.commonAnimationDuration !== DefaultQuizSettings.COMMON_ANIMATION_DURATION) {
        newSettings.commonAnimationDuration = Number(this.settings.commonAnimationDuration);
      }

      if (this.settings.timeBarAnimationDuration !== DefaultQuizSettings.TIMEBAR_ANIMATION_DURATION) {
        newSettings.timeBarAnimationDuration = Number(this.settings.timeBarAnimationDuration);
      }

      if (this.settings.playerAnswerAnimationDuration !== DefaultQuizSettings.PLAYER_ANSWER_ANIMATION_DURATION) {
        newSettings.playerAnswerAnimationDuration = Number(this.settings.playerAnswerAnimationDuration);
      }

      if (this.settings.showNextDelay !== DefaultQuizSettings.SHOW_NEXT_DELAY) {
        newSettings.showNextDelay = Number(this.settings.showNextDelay);
      }

      if (this.settings.amountOfPicturesToShow !== DefaultQuizSettings.AMOUNT_OF_PICUTRES_TO_SHOW) {
        newSettings.amountOfPicturesToShow = Number(this.settings.amountOfPicturesToShow);
      }

      if (this.settings.autoPlay !== DefaultQuizSettings.AUTO_PLAY) {
        newSettings.autoPlay = Boolean(this.settings.autoPlay);
      }

      if (this.settings.startMessage !== DefaultQuizSettings.START_MESSAGE) {
        newSettings.startMessage = this.settings.startMessage;
      }

      if (this.settings.endMessage !== DefaultQuizSettings.END_MESSAGE) {
        newSettings.endMessage = this.settings.endMessage;
      }

      if (this.settings.backgroundImage !== DefaultQuizSettings.BACKGROUND_IMAGE) {
        newSettings.backgroundImage = this.settings.backgroundImage;
      }

      if (this.settings.extraDisplayDuration !== DefaultQuizSettings.EXTRA_DISPLAY_DURATION) {
        newSettings.extraDisplayDuration = Number(this.settings.extraDisplayDuration);
      }

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
