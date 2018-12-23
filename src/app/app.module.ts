import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { IonicStorageModule } from '@ionic/storage';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MyApp } from './app.component';

import { QuizsProvider } from '../providers/quizs/quizs';

import { HomePage } from '../pages/home/home';
import { QuizNewPage } from '../pages/quiz-new/quiz-new';
import { QuizQuestionsPage } from '../pages/quiz-questions/quiz-questions';
import { QuestionPage } from '../pages/question/question';

import { PlayPage } from '../pages/play/play';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    QuizNewPage,
    QuizQuestionsPage,
    QuestionPage,
    PlayPage
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
    QuizNewPage,
    QuizQuestionsPage,
    QuestionPage,
    PlayPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    QuizsProvider
  ]
})
export class AppModule {}
