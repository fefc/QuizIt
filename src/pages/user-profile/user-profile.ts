import { Component, ViewChild } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Platform, ViewController, NavParams } from 'ionic-angular';
import { ImagePicker } from '@ionic-native/image-picker';
import { AndroidPermissions } from '@ionic-native/android-permissions';

import { UserProfile } from '../../models/user-profile';

const MAX_PICTURE_WIDTH: number = 512;
const MAX_PICTURE_HEIGHT: number = 512;

@Component({
  selector: 'page-user-profile',
  templateUrl: 'user-profile.html'
})

export class UserProfilePage {
  private profile: UserProfile;

  @ViewChild('fileInput') fileInput: ElementRef; //Picture selector for browser

  constructor(private platform: Platform,
              public viewCtrl: ViewController,
              private imagePicker: ImagePicker,
              private sanitizer:DomSanitizer,
              private androidPermissions: AndroidPermissions,
              params: NavParams) {
    //lets make deep copies, so that we don't modfiy anything before user confirmation
    if (!params.data.profile) {
      this.profile = {
        uuid: '',
        nickname: '',
        avatar : ''
      }
    } else {
      this.profile = JSON.parse(JSON.stringify(params.data.profile));
    }
  }

  openImagePicker() {
    if (this.platform.is('android')) {
      /*this.androidPermissions.hasPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE)
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
      });*/
    } else {
      this.openBrowserImagePicker();
    }
  }

  openBrowserImagePicker(){
    this.fileInput.nativeElement.click();
  };

  getBrowserImage() {
    let file: any = this.fileInput.nativeElement.files[0];

    this.resizeBrowserImage(file).then((e: any) => {
      this.profile.avatar = e;
      /*var filename: string = this.uuidv4() + '.jpg';

      this.file.writeFile(this.file.cacheDirectory, filename, e.target.result, { replace: true }).then(() => {
        this.question.answers[this.replacePictureIndex] = this.file.cacheDirectory + filename;
        this.renderPicture(this.file.cacheDirectory, filename, this.replacePictureIndex);
      }).catch((error) => {
        alert(error);
      });*/
    }).catch(() => {
      alert('Could not resize image');
    });
  }

  resizeBrowserImage(file: any) {
    return new Promise((resolve, reject) => {
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e: any) => {
        //First resize the image
        //https://zocada.com/compress-resize-images-javascript-browser/
        let img = new Image();
        img.src = e.target.result;
        img.onload = (pic: any) => {
          let canvas = document.createElement('canvas');

          if (img.height > MAX_PICTURE_HEIGHT || img.width > MAX_PICTURE_WIDTH) {
            if ((img.height / MAX_PICTURE_HEIGHT) > (img.width / MAX_PICTURE_WIDTH)) {
              canvas.width = img.width / (img.height / MAX_PICTURE_HEIGHT)
              canvas.height = MAX_PICTURE_HEIGHT;
            } else {
              canvas.width = MAX_PICTURE_WIDTH
              canvas.height = img.height / (img.width / MAX_PICTURE_WIDTH) ;
            }
          } else {
            canvas.width = img.width;
            canvas.height = img.height;
          }

          let ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(ctx.canvas.toDataURL('image/jpeg', 0.8));
        };
      };
    });
  }

  renderPicture(base64: string) {
    return this.sanitizer.bypassSecurityTrustUrl(base64);
  }

  enableSaveButton() {
    let enable: boolean = false;
    if (this.profile.nickname) {
      if (this.profile.nickname.length > 2) {
        enable = true;
      }
    }
    return enable;
  }

  save() {
    if (this.enableSaveButton()) {
      this.viewCtrl.dismiss(this.profile);
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
}
