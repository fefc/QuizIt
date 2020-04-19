import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, ModalController, LoadingController, PopoverController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

import { Quiz } from '../../models/quiz';
import { QuestionType } from '../../models/question';

import { QuizsProvider } from '../../providers/quizs/quizs';

import { HomeMenu } from './menu';
import { QuizNewPage } from '../quiz-new/quiz-new';
import { QuizQuestionsPage } from '../quiz-questions/quiz-questions';
import { PlayPage } from '../play/play';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})

export class HomePage {
  private QuestionType = QuestionType; //for use in Angular html

  private selectedQuizs: number;

  @ViewChild('fileInput') fileInput: ElementRef; //Picture selector for browser

  constructor(
    public navCtrl: NavController,
    public modalCtrl: ModalController,
    public loadingCtrl: LoadingController,
    private popoverCtrl: PopoverController,
    private quizsProv: QuizsProvider,
    private translate: TranslateService) {

      this.selectedQuizs = 0;
  }

  openMenu(event) {
    let popover = this.popoverCtrl.create(HomeMenu);
    popover.present(({ev: event}));

    popover.onDidDismiss((data) => {
      if (data) {
        if (data.index === 0) {
          this.openQuizNewPage();
        }
      }
    });
  }

  openQuizNewPage() {
    let modal = this.modalCtrl.create(QuizNewPage);
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        let loading = this.loadingCtrl.create({
          content: this.translate.instant('CREATING')
        });

        loading.present();

        this.quizsProv.createQuizOnline(data).then((quizUuid) => {
          loading.dismiss();

          let newQuiz: Quiz = this.quizsProv.quizs.find((q) => q.uuid === quizUuid);

          if (newQuiz) {
            this.openQuizQuestionsPage(undefined, newQuiz);
          }
        }).catch((error) => {
          loading.dismiss();
          alert('Unable to create Quiz.');
        });
      }
    });
  }

  openQuizQuestionsPage(event: Event, quiz: Quiz) {
    //Workaround for stopPropagation on tap events
    //https://github.com/ionic-team/ionic/issues/12569#issuecomment-426269026
    if (event && (<HTMLElement>event.target).matches('[data-stop-propagation], [data-stop-propagation] *')) {
      return;
    }
    if (this.selectedQuizs === 0) {
      this.navCtrl.push(QuizQuestionsPage, {quiz: quiz});
    } else {
      this.selectQuiz(quiz);
    }
  }

  getQuestionTypeCount(quiz: Quiz, type: QuestionType) {
    return quiz.questions.filter((question) => question.type === type).length;
  }

  startQuiz(quiz: Quiz) {
    this.navCtrl.push(PlayPage, {quiz: quiz});
  }

  selectQuiz(quiz: Quiz) {
    if (!quiz.selected) {
      quiz.selected = true;
      this.selectedQuizs += 1;
    }
    else {
      quiz.selected = false;
      if (this.selectedQuizs > 0) {
        this.selectedQuizs -= 1;
      }
    }
  }

  deselectAll() {
    for (let selectedQuiz of this.quizsProv.quizs) {
      selectedQuiz.selected = null;
    }
    this.selectedQuizs = 0;
  }

  deleteSelected() {
    let deleting = this.loadingCtrl.create({
      content: this.translate.instant('DELETING')
    });

    deleting.present();

    this.quizsProv.deleteQuizsOnline().then(() => {
      this.selectedQuizs = 0;
      deleting.dismiss();

    }).catch(() => {
      for (let selectedQuiz of this.quizsProv.quizs) {
        selectedQuiz.selected = false;
      }
      this.selectedQuizs = 0;
      deleting.dismiss();
      alert('Unable to delete selected quizs.');
    });
  }
}
