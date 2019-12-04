import { Component } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Platform, ViewController, NavParams } from 'ionic-angular';
import { ImagePicker } from '@ionic-native/image-picker';
import { File } from '@ionic-native/file';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { TranslateService } from '@ngx-translate/core';

import { ExtraType } from '../../models/question';

const MAX_PICTURE_WIDTH: number = 1920;
const MAX_PICTURE_HEIGHT: number = 1080;

@Component({
  selector: 'page-question-extra',
  templateUrl: 'question-extra.html'
})

export class QuestionExtraPage {
  private ExtraType = ExtraType; //for use in Angular html

  private title: string;
  private extras: Array<string>;
  private attachementDir: string;

  private currentExtraType: ExtraType;
  private renderedExtra: SafeUrl;

  constructor(private platform: Platform,
              public viewCtrl: ViewController,
              private file: File,
              private imagePicker: ImagePicker,
              private sanitizer: DomSanitizer,
              private androidPermissions: AndroidPermissions,
              private translate: TranslateService,
              params: NavParams) {

    this.currentExtraType = undefined;
    this.renderedExtra = undefined;

    if (params.data) {
      this.title = params.data.title;
      this.extras = JSON.parse(JSON.stringify(params.data.extras));
      this.attachementDir = params.data.attachementDir;

      if (this.extras.length > 0) {
        if (this.extras[0].startsWith(this.file.cacheDirectory)) {
          //It might be an extra that has not already been saved to dataDirectory
          this.renderExtra(this.file.cacheDirectory, this.extras[0].replace(this.file.cacheDirectory, ''));
        } else {
          //Or it might be an extra that has already been saved to dataDirectory
          this.renderExtra(this.file.dataDirectory, this.attachementDir + this.extras[0]);
        }
      } else {
        this.currentExtraType = ExtraType.none;
      }
    } else {
      this.currentExtraType = ExtraType.none;
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
    this.imagePicker.getPictures({maximumImagesCount: 1, width: MAX_PICTURE_WIDTH, height: MAX_PICTURE_HEIGHT, quality: 90, allow_video: true}).then((results) => {
      let decodedCacheDirectoryURI: string = decodeURIComponent(this.file.cacheDirectory);
      let decodedURI: string = '';

      if (results.length > 0) {
        decodedURI = decodeURIComponent(results[0]);

        this.extras = [];
        this.extras.push(decodedURI);

        this.renderExtra(this.file.cacheDirectory, decodedURI.replace(decodedCacheDirectoryURI, ''));
      }
    }).catch(() => {
      alert('Could not get images.');
    });
  }

  deleteExtras() {
    this.currentExtraType = ExtraType.none;
    this.renderedExtra = undefined;

    this.extras = [];
  }

  save() {
    this.viewCtrl.dismiss({extras: this.extras});
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  renderExtra(directory: string, fileName: string) {
    this.file.readAsDataURL(directory, fileName).then((picture) => {
      if (['.mp4', '.webm', '.ogg'].some(extension => fileName.endsWith(extension))) {
        this.currentExtraType = ExtraType.video;
        this.renderedExtra = this.sanitizer.bypassSecurityTrustUrl(picture);
      } else {
        this.currentExtraType = ExtraType.picture;
        this.renderedExtra = this.sanitizer.bypassSecurityTrustStyle(`url('${picture}')`);
      }
    }).catch((error) => {
      console.log("Something went wrong when reading pictures.", error);
    });
  }
}
