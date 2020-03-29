import { Component, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Platform, MenuController, ModalController, LoadingController, AlertController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { BarcodeScanner, BarcodeScannerOptions } from '@ionic-native/barcode-scanner';
import { TranslateService } from '@ngx-translate/core';
import { Globalization } from '@ionic-native/globalization';
import { Subscription } from "rxjs/Subscription";
import * as firebase from "firebase/app";
import 'firebase/storage';

import { UserProfilesProvider } from '../providers/user-profiles/user-profiles';
import { QuizsProvider } from '../providers/quizs/quizs';
import { GameProvider } from '../providers/game/game';
import { GameControllerProvider } from '../providers/game-controller/game-controller';
import { AuthenticationProvider } from '../providers/authentication/authentication';
import { ConnectionProvider } from '../providers/connection/connection';

import { StartPage } from '../pages/start/start';
import { AboutPage } from '../pages/about/about';
import { GeneralErrorPage } from '../pages/general-error/general-error';

import { UserProfilePage } from '../pages/user-profile/user-profile';
import { HomePage } from '../pages/home/home';
import { GameControllerPage } from '../pages/game-controller/game-controller';

const BARECODE_SCANNER_OPTIONS: BarcodeScannerOptions = {
    preferFrontCamera : false, // iOS and Android
    showFlipCameraButton : false, // iOS and Android
    showTorchButton : false, // iOS and Android
    torchOn: false, // Android, launch with the torch switched on (if available)
    prompt : "Scan the QR code to join the game", // Android
    resultDisplayDuration: 0, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
    formats : "DATA_MATRIX,UPC_A,UPC_E,EAN_8,EAN_13,CODE_39,CODE_93,CODE_128,CODABAR,ITF,RSS14,PDF_417,RSS_EXPANDED,MSI,AZTEC", //Allow only QR_CODE
    orientation : "portrait", // Android only (portrait|landscape), default unset so it rotates with the device
    disableAnimations : false, // iOS
    disableSuccessBeep: true // iOS and Android
};

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDmh327-FUVK-AMc92f4p7cR5ze4D7SoeE",
  authDomain: "quizpaddev.firebaseapp.com",
  databaseURL: "https://quizpaddev.firebaseio.com",
  projectId: "quizpaddev",
  storageBucket: "quizpaddev.appspot.com",
  messagingSenderId: "362454844307",
  appId: "1:362454844307:web:eb20bf8206ae88a4"
};

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  providers: [UserProfilesProvider, QuizsProvider, GameProvider, GameControllerProvider, AuthenticationProvider, ConnectionProvider]
})
export class AppComponent {
  @ViewChild('content') nav;

  private authStateChangesSubscription: Subscription;
  private connectionStateChangesSubscription: Subscription;

  constructor(private platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen,
    public menuCtrl: MenuController,
    public modalCtrl: ModalController,
    public loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private screenOrientation: ScreenOrientation,
    private sanitizer:DomSanitizer,
    private barcodeScanner: BarcodeScanner,
    private profilesProv: UserProfilesProvider,
    private quizsProv: QuizsProvider,
    private gameControllerProv: GameControllerProvider,
    private authProv: AuthenticationProvider,
    private connProv: ConnectionProvider,
    private translate: TranslateService,
    private globalization: Globalization) {

    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      translate.addLangs(['en', 'fr', 'de']); //Set available languages

      // Set default language
      this.globalization.getPreferredLanguage().then((res) => {
        res.value = res.value.toLowerCase();

        if (res.value.includes('-')) res.value = res.value.split('-')[0];

        if (translate.getLangs().indexOf(res.value) !== -1) {
          translate.setDefaultLang(res.value);
        } else {
          translate.setDefaultLang('en');
        }
      }).catch((error) => {
        translate.setDefaultLang('en');
      });

      //Eventually lock screen orientation on some devices
      if (platform.is('android')) {
        //width is dependent on screen orientation
        //if (Math.min(platform.width(), platform.height()) < 800) {
        //There is a bug with ImagePicker so force portrait anytime for now
        this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
        //}
      }

      //Initialize root element
      this.nav.setRoot(HomePage);

      //Initialize Firebase
      firebase.initializeApp(FIREBASE_CONFIG);
      firebase.storage().setMaxOperationRetryTime(1);
      firebase.storage().setMaxUploadRetryTime(1);

      firebase.firestore().enablePersistence().then(() => {

        this.connProv.init().then(() => {
          this.authStateChangesSubscription = this.authProv.authStateChanges().subscribe((loggedIn) => {
            if (loggedIn) {
              this.connectionStateChangesSubscription = this.connProv.connectionStateChanges().subscribe((connected) => {
                let promises = [];

                promises.push(this.profilesProv.sync(this.authProv.getUser().uid));
                promises.push(this.quizsProv.sync(this.authProv.getUser().uid));

                Promise.all(promises).then((results) => {
                  splashScreen.hide(); //This should only happen once please!

                  //setTimeout(() => this.quizsProv.stopSync(), 5000);
                }).catch((errors) => {
                  this.openGeneralErrorPage(errors);
                  splashScreen.hide();
                });
              }, (error) => {
                console.log(error);
              });
            } else {
              if (this.connectionStateChangesSubscription) this.connectionStateChangesSubscription.unsubscribe();
              this.profilesProv.stopSync();
              this.quizsProv.stopSync();

              this.openStartPage();
              splashScreen.hide();
            }
          }, (error) => {
            this.openGeneralErrorPage(error);
            splashScreen.hide();
          });
        });
      }).catch((error) => {
        this.openGeneralErrorPage(error);
        splashScreen.hide();
      });
    });
  }

  openUserProfilePage() {
    this.menuCtrl.close('menu-one');

    let modal = this.modalCtrl.create(UserProfilePage, {profile: this.profilesProv.profile});
    modal.present();
    modal.onDidDismiss((data) => {
      if (data) {
        let loading = this.loadingCtrl.create({
          content: this.translate.instant('SAVING')
        });

        loading.present();

        this.profilesProv.saveToOnline(data).then(() => {
          loading.dismiss();
        }).catch(() => {
          loading.dismiss();
          alert('Unable to save User profile.');
        });
      }
    });
  }

  openHomePage() {
    this.menuCtrl.close('menu-one');

    if (this.nav.getActive().component !== HomePage) {
      this.nav.setRoot(HomePage);
    }
  }

  openStartPage() {
    this.menuCtrl.close('menu-one');
    this.menuCtrl.enable(false, 'menu-one');

    if (this.nav.getActive().component !== StartPage) {
      this.nav.setRoot(StartPage);
    }
  }

  openBarcodeScannerPage() {
    //this.menuCtrl.close('menu-one');
    //To not close menu, so that if barcode scanning is cancelled it does not close the app
    //But closes the menu instead
    this.startScanning();
  }

  openAboutPage() {
    this.menuCtrl.close('menu-one');

    let modal = this.modalCtrl.create(AboutPage);
    modal.present();
  }

  openGeneralErrorPage(message: string) {
    this.menuCtrl.close('menu-one');
    this.menuCtrl.enable(false, 'menu-one');
    this.nav.setRoot(GeneralErrorPage, {message: message});
  }

  startScanning() {
    this.barcodeScanner.scan(BARECODE_SCANNER_OPTIONS).then((data) => {
     if (data.cancelled === false) {
       if (data.text.startsWith('https://quizpadapp.com/controller?id=')) {
         this.menuCtrl.close('menu-one');
         this.joinGame(data.text.replace('https://quizpadapp.com/controller?id=', ''));
       } else {
         this.menuCtrl.close('menu-one');
         this.showGeneralErrorAlert(this.translate.instant('INVALID_QR_CODE'), this.translate.instant('INVALID_QR_CODE_INFO'));
       }
     }
    }).catch((err) => {
      this.menuCtrl.close('menu-one');
      this.showGeneralErrorAlert(this.translate.instant('INVALID_SCANNER'), this.translate.instant('INVALID_SCANNER_INFO'));
    });
  }

  joinGame(gameID: string, alternativeNickname?: string) {
    //// TODO: Not going to work with new avatar
    let loading = this.loadingCtrl.create({
      content: this.translate.instant('JOINING')
    });

    loading.present();

    this.resizeAvatar().then((resizedAvatar) => {
      this.gameControllerProv.joinGame(gameID, alternativeNickname ? alternativeNickname : this.profilesProv.profile.nickname, resizedAvatar).then(() => {
        loading.dismiss();
        this.nav.push(GameControllerPage);
      }).catch((error) => {
        loading.dismiss();
        if (error === 20) {
          this.showNicknameAlreadyUsedAlert(gameID);
        } else {
          this.showGeneralErrorAlert(this.translate.instant('GENERAL_ERROR'), this.translate.instant('JOIN_GAME_ERROR') + ': ' + error + '.');
        }
      });
    }).catch((error) => {
      loading.dismiss();
      this.showGeneralErrorAlert(this.translate.instant('GENERAL_ERROR'), this.translate.instant('RESIZE_AVATAR_ERROR'));
    });
  }

  showNicknameAlreadyUsedAlert(gameID: string) {
    let alertMsg = this.alertCtrl.create({
      title: this.translate.instant('NICKNAME_ALREADY_USED'),
      message: this.translate.instant('NICKNAME_ALREADY_USED_INFO'),
      enableBackdropDismiss: false,
      inputs: [
        {
          name: 'nickname',
          placeholder: this.translate.instant('NICKNAME_NEW')
        }
      ],
      buttons: [
        {
          text: this.translate.instant('CANCEL'),
          role: 'cancel',
        },
        {
          text: this.translate.instant('JOIN'),
          handler: data => {
            this.joinGame(gameID, data.nickname);
          }
        }
      ]
    });
    alertMsg.present();
  }

  showGeneralErrorAlert(title: string, content: string) {
    let message = this.alertCtrl.create({
      title: title,
      message: content,
      buttons: [
        {
          text: this.translate.instant('CLOSE'),
          role: this.translate.instant('OK'),
        }
      ]
    });

    message.present();
  }

  resizeAvatar() {
    return new Promise<string>((resolve, reject) => {
      //First resize the image
      //The zoom it like avatar displayed
      //https://zocada.com/compress-resize-images-javascript-browser/
      //https://stackoverflow.com/a/28048865/7890583

      if (this.profilesProv.profile.avatarUrl) {
        let img = <HTMLImageElement> document.getElementById('avatar');

        let canvas = document.createElement('canvas');
        let imgRatio: number = img.width / img.height;
        let zoom: number;
        let newImgHeight: number;
        let newImgWidth: number;
        let heightMargin: number = 0;
        let widthMargin: number = 0;

        canvas.width = 200;
        canvas.height = 200;

        if (imgRatio > 1) {
          zoom = img.height / canvas.height;
          newImgHeight = canvas.height;
          newImgWidth = img.width / zoom;
          widthMargin = -(newImgWidth / 2) + (canvas.width / 2);
        } else {
          zoom = img.width / canvas.width;
          newImgHeight = img.height / zoom;
          newImgWidth = canvas.width;
          heightMargin = -(newImgHeight / 2) + (canvas.height / 2);
        }

        let ctx = canvas.getContext('2d');
        ctx.drawImage(img, widthMargin, heightMargin, newImgWidth, newImgHeight);
        resolve(ctx.canvas.toDataURL('image/jpeg', 0.8));
      } else {
        resolve('');
      }
    });
  }
}
