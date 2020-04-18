import { Component } from '@angular/core';
import { Platform, ViewController, AlertController, NavParams } from 'ionic-angular';
import { ImagePicker } from '@ionic-native/image-picker';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { TranslateService } from '@ngx-translate/core';

import { ExtraType } from '../../models/question';

import { ConnectionProvider } from '../../providers/connection/connection';

const MAX_PICTURE_WIDTH: number = 1920;
const MAX_PICTURE_HEIGHT: number = 1080;
const MAX_FILE_SIZE: number = 27000000; //OCTETS

@Component({
  selector: 'page-question-extra',
  templateUrl: 'question-extra.html'
})

export class QuestionExtraPage {
  private ExtraType = ExtraType; //for use in Angular html

  private title: string;
  private extras: Array<string>;
  private extrasUrl: Array<any>;

  private currentExtraType: ExtraType;

  constructor(private platform: Platform,
              public viewCtrl: ViewController,
              private alertCtrl: AlertController,
              private imagePicker: ImagePicker,
              private androidPermissions: AndroidPermissions,
              private connProv: ConnectionProvider,
              private translate: TranslateService,
              params: NavParams) {

    this.currentExtraType = ExtraType.none;
    this.extrasUrl = [];

    if (params.data) {
      this.title = params.data.title;
      this.extras = JSON.parse(JSON.stringify(params.data.extras));
      if (params.data.extrasUrl) {
        this.extrasUrl = JSON.parse(JSON.stringify(params.data.extrasUrl));
      } else {
        this.extrasUrl = [];
      }

      console.log(this.extras, ' urls ', this.extrasUrl);

      if (this.extras.length > 0) {
        if (['file:///', 'filesystem:'].some(extension => this.extras[0].startsWith(extension))) {
          setTimeout(async () =>  {
            this.extrasUrl.push(await this.connProv.getLocalFileUrl(this.extras[0]));

            if (['.mp4', '.webm', '.ogg'].some(extension => this.extras[0].endsWith(extension))) {
              this.currentExtraType = ExtraType.video;
            } else {
              this.currentExtraType = ExtraType.picture;
            }
          }, 0); //Constructor can't get aysnc so let's do it my way.
        } else {
          if (['.mp4', '.webm', '.ogg'].some(extension => this.extras[0].endsWith(extension))) {
            this.currentExtraType = ExtraType.video;
          } else {
            this.currentExtraType = ExtraType.picture;
          }
        }
      }
    }
  }

  openImagePicker() {
    if (this.platform.is('android')) {
      this.androidPermissions.hasPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE)
      .then(status => {
        if (status.hasPermission) {
          this.openMobileImagePicker();
        } else {
          this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE)
          .then(status => {
            if(status.hasPermission) {
              this.openMobileImagePicker();
            }
          });
        }
      });
    } else {
      this.openMobileImagePicker();
    }
  }

  //https://stackoverflow.com/a/52970316
  openMobileImagePicker() {
    this.imagePicker.getPictures({maximumImagesCount: 1, width: MAX_PICTURE_WIDTH, height: MAX_PICTURE_HEIGHT, quality: 90, allow_video: true}).then(async (results) => {
      if (results.length > 0) {
        this.currentExtraType = ExtraType.none;

        this.extras = [];
        this.extrasUrl = [];

        let decodedURI = decodeURIComponent(results[0]);

        if (await this.connProv.isFileSizeValid(decodedURI, MAX_FILE_SIZE)) {
          this.extras.push(decodedURI);
          this.extrasUrl.push(await this.connProv.getLocalFileUrl(decodedURI));

          if (['.mp4', '.webm', '.ogg'].some(extension => this.extras[0].endsWith(extension))) {
            this.currentExtraType = ExtraType.video;
          } else {
            this.currentExtraType = ExtraType.picture;
          }
        } else {
          this.showFileToBigAlert();
        }
      }
    }).catch(() => {
      alert('Could not get images.');
    });
  }

  deleteExtras() {
    this.currentExtraType = ExtraType.none;
    this.extras = [];
    this.extrasUrl = [];
  }

  save() {
    this.viewCtrl.dismiss({extras: this.extras});
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  showFileToBigAlert() {
    let error = this.alertCtrl.create({
      title: this.translate.instant('ERROR_FILE_TOO_BIG'),
      message: this.translate.instant('ERROR_FILE_TOO_BIG_INFO') + ' ' + (MAX_FILE_SIZE / 1000000) + 'MB.',
      buttons: [
        {
          text: this.translate.instant('OK'),
          role: 'ok',
        }
      ]
    });
    error.present();
  }
}
