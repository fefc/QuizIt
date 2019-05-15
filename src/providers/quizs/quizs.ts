import { Storage } from '@ionic/storage';
import { Injectable } from '@angular/core';
import { File } from '@ionic-native/file';

declare var JJzip: any;

import { Quiz } from '../../models/quiz';
import { Question } from '../../models/question';
import { QuestionType } from '../../models/question';

interface AttachementsResult {
  questionUuid: string,
  fileNames: Array<string>
}


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
      this.storage.keys().then(keys => {
        if (keys.indexOf('quizs') > -1) {
          this.storage.get('quizs').then(data => {
            if (data) {
              this.quizs = JSON.parse(data);
              resolve();
            }
          }).catch(() => {
            reject();
          });
        } else {
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
          questions: quiz.questions,
          settings: quiz.settings
        }

        this.quizs.push(newQuiz);
        this.storage.set('quizs', JSON.stringify(this.quizs)).then(() => {
          quiz = this.quizs[this.quizs.length - 1];
          resolve(newQuiz);
        }).catch(() => {
          this.quizs.pop();
          reject('Could not save quizs to storage.');
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

          for (let question of quiz.questions.filter((q) => (q.type === QuestionType.rightPicture && q.answers.findIndex((a) => a.startsWith("file:///")) !== -1))) {
            promises.push(this.copyAttachementsToDataDirectory(quiz.uuid, question.uuid, question.answers.filter((a) => a.startsWith("file:///"))));
          }

          Promise.all(promises).then((results: Array<AttachementsResult>) => {
            //Update answers so that they contain only fileName and not fullPath
            if (results) {
              for (let result of results) {
                questionIndex = quiz.questions.findIndex((q) => q.uuid === result.questionUuid);

                if (questionIndex !== -1) {
                  for (let fileName of result.fileNames) {
                    let answerIndex: number = quiz.questions[questionIndex].answers.findIndex((a) => a.endsWith(fileName));

                    quiz.questions[questionIndex].answers[answerIndex] = fileName;
                  }
                }
              }
            }

            this.storage.set('quizs', JSON.stringify(this.quizs)).then(() => {
              resolve();
            }).catch(() => {
              reject('Could not save quizs to storage.');
            });
          }).catch(() => {
            reject('Could not save attachements.');
          });
        }
        else {
          reject('Could not find quiz.');
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

      var promises = [];

      for (let index of indexes) {
        promises.push(this.deleteQuizDir(this.quizs[index].uuid));
        this.quizs.splice(index, 1);
      }

      Promise.all(promises).then(() => {
        this.storage.set('quizs', JSON.stringify(this.quizs)).then(() => {
          resolve();
        }).catch(() => {
          reject();
        });
      }).catch(() => {
        reject();
      })
    });
  }

  deleteFromStorage(quiz: Quiz) {
    return new Promise((resolve, reject) => {
      let index: number = this.quizs.findIndex(q => q.uuid === quiz.uuid);
      if (index !== -1) {
        this.deleteQuizDir(this.quizs[index].uuid).then(() => {
          this.quizs.splice(index, 1);
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
        this.moveAttachementsFromCacheToDataDir(quizUuid, questionUuid, attachements).then((result: AttachementsResult) => {
          resolve(result);
        }).catch((err) => {
          reject(err);
        });
      }).catch((err) => {
        alert(err);
        reject(err);
      });
    });
  }

  checkAndCreateDirectories(quizUuid: string, questionUuid: string) {
    return new Promise((resolve, reject) => {
      //check Quiz Dir
      this.file.checkDir(this.file.dataDirectory, quizUuid).then(() => {
        //check question Dir
        this.file.checkDir(this.file.dataDirectory, quizUuid + '/' + questionUuid).then(() => {
          resolve();
        }).catch(() => {
          this.file.createDir(this.file.dataDirectory, quizUuid + '/' + questionUuid, false).then(() => {
            resolve();
          }).catch(() => {
            reject('Could not create question directory.');
          });
        });
      }).catch(() => {
        //If non existent, create question dir
        this.file.createDir(this.file.dataDirectory, quizUuid, false).then(() => {
          this.file.createDir(this.file.dataDirectory, quizUuid + '/' + questionUuid, false).then(() => {
            resolve();
          }).catch(() => {
            reject('Could not create question directory.');
          });
        }).catch(() => {
          reject('Could not create quiz directory.');
        });
      });
    });
  }

  moveAttachementsFromCacheToDataDir(quizUuid: string, questionUuid: string, attachements: Array<string>) {
    return new Promise((resolve, reject) => {
      var promises = [];
      var destinationDir: string = this.file.dataDirectory + quizUuid + '/' + questionUuid;
      var sourceDir: string;
      var fileName: string;
      var result: AttachementsResult = {
        questionUuid: questionUuid,
        fileNames: []
      };

      for (let attachement of attachements) {
        var indexOfSlash: number = attachement.lastIndexOf('/') + 1;
        sourceDir = attachement.substring(0, indexOfSlash);
        fileName = attachement.substring(indexOfSlash);
        if (indexOfSlash > 0) {
          promises.push(this.file.moveFile(sourceDir, fileName, destinationDir, fileName));
          result.fileNames.push(fileName);
        }
        else {
          reject('Invalid sourceDir of fileName.');
        }
      }

      Promise.all(promises).then(() => {
        resolve(result);
      }).catch(() => {
        reject('Something happend moving attachements.');
      });
    });
  }

  deleteQuizDir(quizUuid: string) {
    return new Promise((resolve, reject) => {
      this.file.checkDir(this.file.dataDirectory, quizUuid).then(() => {
        this.file.removeRecursively(this.file.dataDirectory, quizUuid).then(() => {
          resolve();
        }).catch(() => {
          reject();
        });
      }).catch(() => {
        resolve();
      });
    });
  }

  createQuizDir(quizUuid: string) {
    return new Promise((resolve, reject) => {
      //check Quiz Dir
      this.file.checkDir(this.file.dataDirectory, quizUuid).then(() => {
        resolve();
      }).catch(() => {
        //If non existent, create question dir
        this.file.createDir(this.file.dataDirectory, quizUuid, false).then(() => {
          resolve();
        }).catch(() => {
          reject('Could not create quiz directory.');
        });
      });
    });
  }

  zip(quiz: Quiz) {
    return new Promise((resolve, reject) => {
      this.createQuizDir(quiz.uuid).then(() => {
        this.file.writeFile(this.file.dataDirectory, quiz.uuid + '/database.json', JSON.stringify(quiz), { replace: true }).then(() => {
          JJzip.zip(this.file.dataDirectory + quiz.uuid, {target: this.file.cacheDirectory, name: quiz.uuid}, (data) => {
            this.file.removeFile(this.file.dataDirectory, quiz.uuid + '/database.json').then(() => {
              if(data.success) {
                resolve({cordovaFilePath: this.file.cacheDirectory, filePath: quiz.uuid + '.zip'});
              } else {
                reject('Something when wrong by zipping');
              }
            }).catch((error) => {
              reject("Something went wrong by deleting database file.");
            });

          }, (error) => {
            this.file.removeFile(this.file.dataDirectory, quiz.uuid + '/database.json').then(() => {
              reject('Something when wrong by zipping');
            }).catch((error) => {
              reject("Something went wrong by deleting database file.");
            });
          });
        }).catch((error) => {
          reject("Something went wrong by writing database file.");
        });
      }).catch((e) => {
        reject(e);
      });
    });
  }

  unzip(cordovaFilePath: string, filePath: string) {
    return new Promise((resolve, reject) => {
      this.file.checkDir(this.file.cacheDirectory, 'import').then(() => {
        this.file.removeRecursively(this.file.cacheDirectory, 'import').then(() => {
          this.unzipImportedQuizAndImport(cordovaFilePath, filePath).then((data) => {
            resolve(data);
          }).catch((error) => {
            reject(error);
          });
        }).catch(() => {
          reject('Could not delete Import dir.');
        });
      }).catch(() => {
        this.unzipImportedQuizAndImport(cordovaFilePath, filePath).then((data) => {
          resolve(data);
        }).catch((error) => {
          reject(error);
        });
      });
    });
  }

  unzipImportedQuizAndImport(cordovaFilePath: string, filePath: string) {
    return new Promise((resolve, reject) => {
      JJzip.unzip(cordovaFilePath + filePath, {target: this.file.cacheDirectory + 'import'}, (data) => {
        if (data.success) {
          this.file.listDir(this.file.cacheDirectory, 'import').then((entries) => {
            //Import dir should have been created just now so there should be only on dir
            if (entries.length === 1) {
              //Lets try to find the database.json file, open it and check integrity
              let quizPath: string = entries[0].fullPath;

              // .substring(1) is needed to remove the first /
              while(quizPath.charAt(0) === '/') {
                quizPath = quizPath.substring(1);
              }

              this.file.checkFile(this.file.cacheDirectory, quizPath + 'database.json').then(() => {
                this.file.readAsText(this.file.cacheDirectory, quizPath + 'database.json').then((jsonQuiz) => {
                  let importQuiz: Quiz = JSON.parse(jsonQuiz);
                  let promises = [];

                  //Make sure the attachements are included in the zip
                  for (let question of importQuiz.questions.filter((q) => q.type === QuestionType.rightPicture)) {
                    for (let i = 0; i < question.answers.length ; i++) {
                      promises.push(this.file.checkFile(this.file.cacheDirectory, quizPath + question.uuid + '/' + question.answers[i]));
                      //Set answer to full path, that will allow us to use copyAttachementsToDataDirectory method
                      question.answers[i] = this.file.cacheDirectory + quizPath + question.uuid + '/' + question.answers[i];
                    }
                  }

                  Promise.all(promises).then((results: Array<boolean>) => {
                    //Everything is okey, so we can copy the dir
                    if (this.quizs.findIndex((q) => q.uuid === importQuiz.uuid) === -1) {
                      //Move attachements
                      var movePromises = [];

                      for (let question of importQuiz.questions.filter((q) => q.type === QuestionType.rightPicture)) {
                        movePromises.push(this.copyAttachementsToDataDirectory(importQuiz.uuid, question.uuid, question.answers));
                      }

                      Promise.all(movePromises).then((results: Array<AttachementsResult>) => {
                        let questionIndex: number;

                        //Update answers so that they contain only fileName and not fullPath
                        if (results) {
                          for (let result of results) {
                            questionIndex = importQuiz.questions.findIndex((q) => q.uuid === result.questionUuid);

                            if (questionIndex !== -1) {
                              for (let fileName of result.fileNames) {
                                let answerIndex: number = importQuiz.questions[questionIndex].answers.findIndex((a) => a.endsWith(fileName));

                                importQuiz.questions[questionIndex].answers[answerIndex] = fileName;
                              }
                            }
                          }
                        }

                        this.quizs.push(importQuiz);

                        this.storage.set('quizs', JSON.stringify(this.quizs)).then(() => {
                          //Before we are done, lets delete all the mess we have done
                          this.file.removeRecursively(this.file.cacheDirectory, 'import').then(() => {
                            this.file.removeFile(cordovaFilePath, filePath).then(() => {
                              resolve();
                            }).catch(() => {
                              reject('Failed to remove zip file from cache.');
                            });
                          }).catch(() => {
                            reject('Failed to remove import dir.');
                          })
                          resolve();
                        }).catch(() => {
                          reject('Could not save quizs to storage.');
                        });
                      }).catch(() => {
                        reject('Could not save attachements.');
                      });
                    } else {
                      reject('The quiz already exists in your database.');
                    }
                    }).catch(() => {
                      reject('Some attachements seem to be messing.');
                    });
                }).catch(() => {
                  reject('Could not read database.json file.');
                });
              }).catch(()  => {
                reject('Could not find database.json file.');
              });
            } else {
              reject('No files have been unzippped.');
            }
          }).catch(() => {
            reject('Could not list dir import dir.');
          });
        } else {
          reject('Something went wrong unzipping 1');
        }
      }, (error) => {
        reject('Something went wrong unzipping 2');
      });
    });
  }

}
