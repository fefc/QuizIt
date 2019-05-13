import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { IonicStorageModule } from '@ionic/storage';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ImagePicker } from '@ionic-native/image-picker';
import { File } from '@ionic-native/file';
import { Httpd } from '@ionic-native/httpd';
import { AndroidFullScreen } from '@ionic-native/android-full-screen';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { FileChooser } from '@ionic-native/file-chooser';
import { FilePath } from '@ionic-native/file-path';
import { Insomnia } from '@ionic-native/insomnia';

import { MyApp } from './app.component';

import { QuizsProvider } from '../providers/quizs/quizs';

import { HomePage } from '../pages/home/home';
import { HomeMenu } from '../pages/home/menu';
import { QuizNewPage } from '../pages/quiz-new/quiz-new';
import { QuizQuestionsPage } from '../pages/quiz-questions/quiz-questions';
import { QuizQuestionsMenu } from '../pages/quiz-questions/menu';
import { QuizQuestionsMenuCategory } from '../pages/quiz-questions/menu-category';

import { QuizSettingsPage } from '../pages/quiz-settings/quiz-settings';

import { QuestionPage } from '../pages/question/question';

import { PlayPage } from '../pages/play/play';
import { PlayAddPlayerPage } from '../pages/play-addplayer/play-addplayer';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    HomeMenu,
    QuizNewPage,
    QuizQuestionsPage,
    QuizQuestionsMenu,
    QuizQuestionsMenuCategory,
    QuizSettingsPage,
    QuestionPage,
    PlayPage,
    PlayAddPlayerPage
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    HomeMenu,
    QuizNewPage,
    QuizQuestionsPage,
    QuizQuestionsMenu,
    QuizQuestionsMenuCategory,
    QuizSettingsPage,
    QuestionPage,
    PlayPage,
    PlayAddPlayerPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    ImagePicker,
    File,
    Httpd,
    AndroidFullScreen,
    ScreenOrientation,
    AndroidPermissions,
    FileChooser,
    FilePath,
    Insomnia,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    QuizsProvider
  ]
})
export class AppModule {}
