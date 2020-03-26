import { Component, ViewChild, ElementRef } from '@angular/core';
import { Platform, NavController, ModalController, AlertController, LoadingController, PopoverController } from 'ionic-angular';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { FileChooser } from '@ionic-native/file-chooser';
import { FileOpener } from '@ionic-native/file-opener';
import { FilePath } from '@ionic-native/file-path';
import { File } from '@ionic-native/file';
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
    private platform: Platform,
    public navCtrl: NavController,
    public modalCtrl: ModalController,
    public loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private popoverCtrl: PopoverController,
    private androidPermissions: AndroidPermissions,
    private fileChooser: FileChooser,
    private fileOpener: FileOpener,
    private filePath: FilePath,
    private file: File,
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
        } else if (data.index === 1) {
          setTimeout(() => this.import(), 0); //Wired trick to make it work in browser //DOES NOT WORK!
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

        this.quizsProv.createQuizOnline(data).then(() => {
          loading.dismiss();
          //this.openQuizQuestionsPage(null, newQuiz);
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

  export() {
    let quiz: Quiz = this.quizsProv.quizs.find((q) => q.selected);
    quiz.selected = false;
    this.selectedQuizs -= 1;

    let loading = this.loadingCtrl.create({
      content: this.translate.instant('EXPORTING')
    });

    loading.present();

    this.quizsProv.zip(quiz).then((data: any) => {
      if (this.platform.is('core')) {
        this.fileOpener.open(data.cordovaFilePath + data.filePath, 'application/zip').then(() => {
          loading.dismiss();
        }).catch((error) => {
          loading.dismiss();
          alert("Something went wrong while exporting the quiz. " + error);
        });
      } else if (this.platform.is('android')) {
        this.androidPermissions.hasPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE)
          .then(status => {
            if (status.hasPermission) {
              this.exportFileToAndroidDownload(data).then((url) => {
                loading.dismiss();
              }).catch((error) => {
                loading.dismiss();
                alert(error);
              });
            }
            else {
              this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE)
                .then(status => {
                  if(status.hasPermission) {
                    this.exportFileToAndroidDownload(data).then((url) => {
                      loading.dismiss();
                    }).catch((error) => {
                      loading.dismiss();
                      alert(error);
                    });
                  }
                });
            }
          });
      } else {
        loading.dismiss();
        alert("Export function is not supported.");
      }
    }).catch((err) => {
      alert(err);
    });
  }

  exportFileToAndroidDownload(data) {
    return new Promise((resolve, reject) => {
      this.file.moveFile(data.cordovaFilePath,  data.filePath, this.file.externalRootDirectory, data.filePath).then(() => {
        let message = this.alertCtrl.create({
          title: this.translate.instant('EXPORTED_QUIZ'),
          message: this.file.externalRootDirectory + data.filePath,
          buttons: [
            {
              text: this.translate.instant('OK'),
              role: 'ok',
            }
          ]
        });

        message.present();

        resolve();
      }).catch(() => {
        reject("Something went wrong while export the quiz.");
      })
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
              content: this.translate.instant('IMPORTING')
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

        }).catch((error) => {
          console.log(error);
          alert(error);
        });
      }).catch((error) => {
        console.log(error);
        alert(error);
      });
    } else if (this.platform.is('core')) {
        this.fileInput.nativeElement.click();
    } else {
      alert("Import is not supported on the platform yet.");
    }
  }

  importBrowser() {
    let loading = this.loadingCtrl.create({
      content: this.translate.instant('IMPORTING')
    });

    loading.present();

    let file: any = this.fileInput.nativeElement.files[0];

    var reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = (e: any) => {
      var fileName: string = file.name;

      this.file.writeFile(this.file.cacheDirectory, fileName, e.target.result, { replace: true }).then(() => {
        this.quizsProv.unzip(this.file.cacheDirectory, fileName).then(() => {
          loading.dismiss();
        }).catch((error) => {
          loading.dismiss();
          console.log(error);
          alert(error);
        });

      }).catch((error) => {
        loading.dismiss();
        console.log(error);
        alert(error);
      });
    };
  }
}
