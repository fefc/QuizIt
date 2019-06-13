import { Component, ViewChild, ElementRef } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Platform, NavController, MenuController, ViewController, LoadingController, Slides } from 'ionic-angular';

import { UserProfile } from '../../models/user-profile';

import { UserProfilesProvider } from '../../providers/user-profiles/user-profiles';

import { HomePage } from '../../pages/home/home';

const MAX_PICTURE_WIDTH: number = 512;
const MAX_PICTURE_HEIGHT: number = 512;

@Component({
  selector: 'page-start',
  templateUrl: 'start.html'
})
export class StartPage {
  private profile: UserProfile;

  @ViewChild(Slides) slides: Slides;
  @ViewChild('fileInput') fileInput: ElementRef; //Picture selector for browser

  constructor(private platform: Platform,
    public navCtrl: NavController,
    public menuCtrl: MenuController,
    public viewCtrl: ViewController,
    public loadingCtrl: LoadingController,
    private sanitizer:DomSanitizer,
    private profilesProv: UserProfilesProvider) {
    this.profile = {
      uuid: '',
      nickname: '',
      avatar : ''
    }
  }

  gotToCreateProfile() {
    this.slides.slideTo(1);
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

  createProfile() {
    let loading = this.loadingCtrl.create({
      content: 'Creating profile...'
    });

    loading.present();

    this.profilesProv.saveToStorage(this.profile).then(() => {
      loading.dismiss();
      this.navCtrl.setRoot(HomePage);
      this.menuCtrl.enable(true, 'menu-one');
    }).catch(() => {
      loading.dismiss();
      alert('Unable to save User profile.');
    });
  }

  enableCreateButton() {
    let enable: boolean = false;
    if (this.profile.nickname) {
      if (this.profile.nickname.length > 2) {
        enable = true;
      }
    }
    return enable;
  }
}
