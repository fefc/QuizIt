import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { IonicStorageModule } from '@ionic/storage';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ImagePicker } from '@ionic-native/image-picker';
import { File } from '@ionic-native/file';
import { AndroidFullScreen } from '@ionic-native/android-full-screen';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { FileChooser } from '@ionic-native/file-chooser';
import { FileOpener } from '@ionic-native/file-opener';
import { FilePath } from '@ionic-native/file-path';
import { Insomnia } from '@ionic-native/insomnia';
import { AppVersion } from '@ionic-native/app-version';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Globalization } from '@ionic-native/globalization';

import { AppComponent } from './app.component';

import { UserProfilesProvider } from '../providers/user-profiles/user-profiles';
import { QuizsProvider } from '../providers/quizs/quizs';
import { GameProvider } from '../providers/game/game';
import { GameControllerProvider } from '../providers/game-controller/game-controller';

import { UserProfilePage } from '../pages/user-profile/user-profile';

import { StartPage } from '../pages/start/start';
import { AboutPage } from '../pages/about/about';

import { HomePage } from '../pages/home/home';
import { HomeMenu } from '../pages/home/menu';
import { QuizNewPage } from '../pages/quiz-new/quiz-new';
import { QuizQuestionsPage } from '../pages/quiz-questions/quiz-questions';
import { QuizQuestionsMenu } from '../pages/quiz-questions/menu';
import { QuizQuestionsMenuCategory } from '../pages/quiz-questions/menu-category';

import { QuizSettingsPage } from '../pages/quiz-settings/quiz-settings';

import { QuestionPage } from '../pages/question/question';

import { PlayPage } from '../pages/play/play';

import { GameControllerPage } from '../pages/game-controller/game-controller';
import { GameControllerMenu } from '../pages/game-controller/menu';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    StartPage,
    AboutPage,
    UserProfilePage,
    HomePage,
    HomeMenu,
    QuizNewPage,
    QuizQuestionsPage,
    QuizQuestionsMenu,
    QuizQuestionsMenuCategory,
    QuizSettingsPage,
    QuestionPage,
    PlayPage,
    GameControllerPage,
    GameControllerMenu
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    IonicModule.forRoot(AppComponent),
    IonicStorageModule.forRoot(),
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    StartPage,
    AboutPage,
    UserProfilePage,
    HomePage,
    HomeMenu,
    QuizNewPage,
    QuizQuestionsPage,
    QuizQuestionsMenu,
    QuizQuestionsMenuCategory,
    QuizSettingsPage,
    QuestionPage,
    PlayPage,
    GameControllerPage,
    GameControllerMenu
  ],
  providers: [
    StatusBar,
    SplashScreen,
    ImagePicker,
    File,
    AndroidFullScreen,
    ScreenOrientation,
    AndroidPermissions,
    FileChooser,
    FileOpener,
    FilePath,
    Insomnia,
    AppVersion,
    BarcodeScanner,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    UserProfilesProvider,
    QuizsProvider,
    GameProvider,
    GameControllerProvider,
    Globalization
  ]
})
export class AppModule {}
