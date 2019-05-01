import { Component } from '@angular/core';
import { Platform, NavController, ModalController, LoadingController } from 'ionic-angular';
import { FileChooser } from '@ionic-native/file-chooser';
import { FilePath } from '@ionic-native/file-path';
import { File } from '@ionic-native/file';

import { Quiz } from '../../models/quiz';

import { QuizsProvider } from '../../providers/quizs/quizs';

import { QuizNewPage } from '../quiz-new/quiz-new';
import { QuizQuestionsPage } from '../quiz-questions/quiz-questions';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  private selectedQuizs: number;

  constructor(
    private platform: Platform,
    public navCtrl: NavController,
    public modalCtrl: ModalController,
    public loadingCtrl: LoadingController,
    private fileChooser: FileChooser,
    private filePath: FilePath,
    private file: File,
    private quizsProv: QuizsProvider) {

      this.selectedQuizs = 0;
  }

  openQuizNewPage() {
    let modal = this.modalCtrl.create(QuizNewPage);
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        let loading = this.loadingCtrl.create({
          content: 'Creating Quiz...'
        });

        loading.present();

        this.quizsProv.saveToStorage(data).then(() => {
          loading.dismiss();
        }).catch(() => {
          loading.dismiss();
          alert('Unable to create Quiz.');
        });
      }
    });
  }

  openQuizQuestionsPage(quiz: Quiz) {
    if (this.selectedQuizs === 0) {
      this.navCtrl.push(QuizQuestionsPage, {quiz: quiz});
    }
  }

  selectQuiz(quiz: Quiz) {
    if (!quiz.selected) {
      quiz.selected = true;
      this.selectedQuizs += 1;
    }
    else {
      quiz.selected = false;
      this.selectedQuizs -= 1;
    }
  }

  deleteSelected() {
    this.quizsProv.deleteSelectedFromStorage().then(() => {
      this.selectedQuizs = 0;
    }).catch(() => {
      for (let selectedQuiz of this.quizsProv.quizs) {
        selectedQuiz.selected = false;
      }
      this.selectedQuizs = 0;
      alert('Unable to delete selected quizs.');
    });
  }

  import() {
    if(this.platform.is('android')) {
      this.fileChooser.open().then((uri) => {
        this.filePath.resolveNativePath(uri).then((nativePath) => {
          var relativePath: string = nativePath.replace(this.file.externalRootDirectory, ''); //TODO this is buggy and only allows zip from internal root storage
          var fileName: string = nativePath.split("/").pop();
          this.file.copyFile(this.file.externalRootDirectory, relativePath, this.file.cacheDirectory, fileName).then(() => {
            let loading = this.loadingCtrl.create({
              content: 'Importing Quiz...'
            });

            loading.present();

            this.quizsProv.unzip(this.file.cacheDirectory, fileName).then(() => {
              loading.dismiss();
            }).catch((error) => {
              loading.dismiss();
              alert(error);
            });
          }).catch((error) => {
            alert(error);
          })

        }).catch((err) => {
          console.log(err);
        });
      }).catch((e) => {
        console.log(e);
      });
    } else {
      alert("Import is not supported on the platform yet.");
    }
  }
}
