import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { ScreenOrientation } from '@ionic-native/screen-orientation';

import { QuizsProvider } from '../providers/quizs/quizs';

import { HomePage } from '../pages/home/home';

@Component({
  templateUrl: 'app.html',
  providers: [QuizsProvider]
})
export class MyApp {
  rootPage:any = HomePage;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen,
    private screenOrientation: ScreenOrientation,
    private quizsProv: QuizsProvider) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.

      //Eventually lock screen orientation on some devices
      if (platform.is('android')) {
        //width is dependent on screen orientation
        //if (Math.min(platform.width(), platform.height()) < 800) {
        //There is a bug with ImagePicker so force portrait anytime for now
        this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
        //}
      }

      this.quizsProv.loadFromStorage().then(() => {
        //statusBar.styleDefault();
        splashScreen.hide();
      });
    });
  }
}
