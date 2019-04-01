import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { QuizsProvider } from '../providers/quizs/quizs';

import { HomePage } from '../pages/home/home';

@Component({
  templateUrl: 'app.html',
  providers: [QuizsProvider]
})
export class MyApp {
  rootPage:any = HomePage;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen,
    private quizsProv: QuizsProvider) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.

      //Shitty workaround
      splashScreen.hide();

      this.quizsProv.loadFromStorage().then(() => {
        //statusBar.styleDefault();
        splashScreen.hide();
      });
    });
  }
}
