import { Storage } from '@ionic/storage';
import { Injectable } from '@angular/core';
import { File } from '@ionic-native/file';

import { Quiz } from '../../models/quiz';
import { Question } from '../../models/question';
import { QuestionType } from '../../models/question';
/*
  Generated class for the QuizsProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class QuizsProvider {
  public quizs: Array<Quiz>;

  constructor(private storage: Storage, private file: File) {
    this.quizs = new Array<Quiz>();
  }

  loadFromStorage() {
    return new Promise((resolve, reject) => {
      this.storage.get('quizs').then(data => {
        if (data) {
          this.quizs = JSON.parse(data);
          resolve();
        }
      }).catch(() => {
        reject();
      });
    });
  }

  saveToStorage(quiz: Quiz) {
    return new Promise((resolve, reject) => {
      if (!quiz.uuid) {
        //We have a new quiz, so first we need to get a new uuid
        let uuid: string = this.uuidv4();

        while (this.quizs.findIndex((q) => q.uuid === uuid) !== -1) {
          uuid = this.uuidv4();
        }

        let newQuiz: Quiz = {
          uuid: uuid,
          title: quiz.title,
          creationDate: quiz.creationDate,
          categorys: quiz.categorys,
          questions: quiz.questions
        }

        this.quizs.push(newQuiz);
        this.storage.set('quizs', JSON.stringify(this.quizs)).then(() => {
          quiz = newQuiz;
          resolve();
        }).catch(() => {
          this.quizs.pop();
          reject();
        });
      }
      else {
        //Saving an exsisting quiz, lets just make sure it's in the list
        let quizIndex: number = this.quizs.findIndex((q) => q.uuid === quiz.uuid);
        if (quizIndex !== -1) {
          //Check questions uuid, if there is one not set, generate one
          let questionIndex: number = quiz.questions.findIndex((q) => !q.uuid);

          while (questionIndex !== -1) {
            let uuid: string = this.uuidv4();

            while (quiz.questions.findIndex((q) => q.uuid === uuid) !== -1) {
              uuid = this.uuidv4();
            }

            let questionUUID: Question = {
              uuid: uuid,
              question: quiz.questions[questionIndex].question,
              type: quiz.questions[questionIndex].type,
              rightAnswer: quiz.questions[questionIndex].rightAnswer,
              answers: quiz.questions[questionIndex].answers,
              extras: quiz.questions[questionIndex].extras,
              category: quiz.questions[questionIndex].category,
              authorId: quiz.questions[questionIndex].authorId
            }

            quiz.questions[questionIndex] = questionUUID;

            questionIndex = quiz.questions.findIndex((q) => !q.uuid);
          }

          //Check attachements
          var promises = [];
          questionIndex = quiz.questions.findIndex((q) => (q.type == QuestionType.rightPicture && q.answers.findIndex((a) => a.startsWith("file:///")) !== -1));

          while (questionIndex !== -1) {
            for (let i:number = 0; i < quiz.questions[questionIndex].answers.length; i++) {
              quiz.questions[questionIndex].answers[i] = quiz.questions[questionIndex].answers[i].substring(quiz.questions[questionIndex].answers[i].lastIndexOf("/") + 1);
            }

            promises.push(this.copyAttachementsToDataDirectory(quiz.uuid, quiz.questions[questionIndex].uuid, quiz.questions[questionIndex].answers.filter((a) => a.startsWith("file:///"))));

            questionIndex = quiz.questions.findIndex((q) => (q.type === QuestionType.rightPicture && q.answers.findIndex((a) => a.startsWith("file:///")) !== -1));
          }

          Promise.all(promises).then(() => {
            this.storage.set('quizs', JSON.stringify(this.quizs)).then(() => {
              resolve();
            }).catch(() => {
              reject();
            });
          }).catch(() => {
            reject();
          });
        }
        else {
          reject();
        }
      }
    });
  }

  deleteSelectedFromStorage() {
    return new Promise((resolve, reject) => {
      let indexes: Array<number> = Array<number>();

      for (let selectedQuiz of this.quizs.filter((quiz) => quiz.selected === true)) {
        let index = this.quizs.findIndex(quiz => quiz.uuid === selectedQuiz.uuid);
        if (index !== -1) {
          indexes.push(index);
        }
      }

      indexes.sort(function(a,b){ return b - a; });

      for (let index of indexes) {
        this.quizs.splice(index, 1);
      }

      this.storage.set('quizs', JSON.stringify(this.quizs)).then(() => {
        resolve();
      }).catch(() => {
        reject();
      });
    });
  }

  deleteFromStorage(quiz: Quiz) {
    return new Promise((resolve, reject) => {
      let index: number = this.quizs.findIndex(q => q.uuid === quiz.uuid);
      if (index !== -1) {
        this.quizs.splice(index, 1);
        this.storage.set('quizs', JSON.stringify(this.quizs)).then(() => {
          resolve();
        }).catch(() => {
          reject();
        });
      }
      else {
        reject();
      }
    });
  }

  //From https://stackoverflow.com/a/2117523
  uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  copyAttachementsToDataDirectory(quizUuid: string, questionUuid: string, attachements: Array<string>) {
    return new Promise((resolve, reject) => {
      this.checkAndCreateDirectories(quizUuid, questionUuid).then(() => {
        this.moveAttachementsFromCacheToDataDir(quizUuid, questionUuid, attachements).then(() => {
          resolve();
        }).catch(() => {
          reject();
        });
      }).catch(() => {
        reject();
      });
    });
  }

  checkAndCreateDirectories(quizUuid: string, questionUuid: string) {
    return new Promise((resolve, reject) => {
      //check Quiz Dir
      this.file.checkDir(this.file.dataDirectory, quizUuid).then(() => {
        //check question Dir
        this.file.checkDir(this.file.dataDirectory + quizUuid, questionUuid).then(() => {
          resolve();
        }).catch(() => {
          this.file.createDir(this.file.dataDirectory + quizUuid, questionUuid, false).then(() => {
            resolve();
          }).catch(() => {
            reject();
          });
        });
      }).catch(() => {
        //If non existent, create question dir
        this.file.createDir(this.file.dataDirectory, quizUuid, false).then(() => {
          this.file.createDir(this.file.dataDirectory + quizUuid, questionUuid, false).then(() => {
            resolve();
          }).catch(() => {
            reject();
          });
        }).catch(() => {
          reject();
        });
      });
    });
  }

  moveAttachementsFromCacheToDataDir(quizUuid: string, questionUuid: string, attachements: Array<string>) {
    return new Promise((resolve, reject) => {
      var promises = [];
      var destinationDir: string = this.file.dataDirectory + quizUuid + "/" + questionUuid;
      var sourceDir: string;
      var fileName: string;

      for (let attachement of attachements) {
        var indexOfSlash: number = attachement.lastIndexOf("/") + 1;
        sourceDir = attachement.substring(0, indexOfSlash);
        fileName = attachement.substring(indexOfSlash);
        if (indexOfSlash > 0) {
          promises.push(this.file.moveFile(sourceDir, fileName, destinationDir, fileName));
        }
        else {
          reject();
        }
      }

      Promise.all(promises).then(() => {
        resolve();
      }).catch(() => {
        reject();
      });
    });
  }
}
