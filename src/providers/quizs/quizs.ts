import { Storage } from '@ionic/storage';
import { Injectable } from '@angular/core';
import { File } from '@ionic-native/file';

declare var JJzip: any;

import { Quiz } from '../../models/quiz';
import { Question } from '../../models/question';
import { QuestionType } from '../../models/question';

enum AttachementType {
  answers,
  extras
}

interface AttachementsResult {
  questionUuid: string,
  type: AttachementType,
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
    return new Promise(async (resolve, reject) => {
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
              authorId: quiz.questions[questionIndex].authorId,
              draft: quiz.questions[questionIndex].draft
            }

            quiz.questions[questionIndex] = questionUUID;

            questionIndex = quiz.questions.findIndex((q) => !q.uuid);
          }

          //Check attachements
          //var promises = [];  //DO NOT TRY to use Promise.all to resolve multiples promises, file.moveFile does not supports // executions
          try {
            var attachementResults = [];

            //First check question answers (pictures)
            for (let question of quiz.questions.filter((q) => (q.type === QuestionType.rightPicture && q.answers.findIndex((a) => a.startsWith("file:///") || a.startsWith("filesystem:")) !== -1))) {
              attachementResults.push(await this.copyAttachementsToDataDirectory(quiz.uuid, question.uuid, AttachementType.answers, question.answers.filter((a) => a.startsWith("file:///") || a.startsWith("filesystem:"))));
            }

            //// TODO: Maybe do a cleaner code for that?

            //Second check question extras
            for (let question of quiz.questions.filter((q) => (q.extras.findIndex((e) => e.startsWith("file:///") || e.startsWith("filesystem:")) !== -1))) {
              attachementResults.push(await this.copyAttachementsToDataDirectory(quiz.uuid, question.uuid, AttachementType.extras, question.extras.filter((e) => e.startsWith("file:///") || e.startsWith("filesystem:"))));
            }

            //Update answers so that they contain only fileName and not fullPath
            let attachementIndex: number;

            if (attachementResults) {
              for (let result of attachementResults) {
                questionIndex = quiz.questions.findIndex((q) => q.uuid === result.questionUuid);

                if (questionIndex !== -1) {
                  if (result.type === AttachementType.answers) {
                    //set correct answers
                    for (let fileName of result.fileNames) {
                      attachementIndex = quiz.questions[questionIndex].answers.findIndex((a) => a.endsWith(fileName));

                      quiz.questions[questionIndex].answers[attachementIndex] = fileName;
                    }
                  } else if (result.type === AttachementType.extras) {
                    //set correct extras
                    for (let fileName of result.fileNames) {
                      attachementIndex = quiz.questions[questionIndex].extras.findIndex((e) => e.endsWith(fileName));

                      quiz.questions[questionIndex].extras[attachementIndex] = fileName;
                    }
                  }

                }
              }
            }

            this.storage.set('quizs', JSON.stringify(this.quizs)).then(() => {
              resolve();
            }).catch(() => {
              reject('Could not save quizs to storage.');
            });
          } catch(error) {
            console.log(error);
            reject('Could not save attachements.');
          };
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

  copyAttachementsToDataDirectory(quizUuid: string, questionUuid: string, type: AttachementType, attachements: Array<string>) {
    return new Promise((resolve, reject) => {
      this.checkAndCreateDirectories(quizUuid, questionUuid).then(() => {
        this.moveAttachementsFromCacheToDataDir(quizUuid, questionUuid, type, attachements).then((result: AttachementsResult) => {
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
          }).catch((error) => {
            console.log(error);
            reject('Could not create question directory.');
          });
        });
      }).catch(() => {
        //If non existent, create question dir
        this.file.createDir(this.file.dataDirectory, quizUuid, true).then(() => {
          this.file.createDir(this.file.dataDirectory, quizUuid + '/' + questionUuid, true).then(() => {
            resolve();
          }).catch((error) => {
            console.log(error);
            reject('Could not create question directory.');
          });
        }).catch((error) => {
          console.log(error)
          reject('Could not create quiz directory.');
        });
      });
    });
  }

  moveAttachementsFromCacheToDataDir(quizUuid: string, questionUuid: string, type: AttachementType, attachements: Array<string>) {
    return new Promise<AttachementsResult>(async (resolve, reject) => {
      //var promises = []; //DO NOT TRY to use Promise.all to resolve multiples promises, file.moveFile does not supports // executions
      var destinationDir: string = this.file.dataDirectory + quizUuid + '/' + questionUuid;
      var sourceDir: string;
      var fileName: string;
      var result: AttachementsResult = {
        questionUuid: questionUuid,
        type: type,
        fileNames: []
      };

      for (let attachement of attachements) {
        var indexOfSlash: number = attachement.lastIndexOf('/') + 1;
        sourceDir = attachement.substring(0, indexOfSlash);
        fileName = attachement.substring(indexOfSlash);
        if (indexOfSlash > 0) {
          try {
            await this.file.moveFile(sourceDir, fileName, destinationDir, fileName);
          } catch (error) {
            console.log(error);
           reject('Moving file from temporary to persistant failed');
          }

          result.fileNames.push(fileName);
        }
        else {
          reject('Invalid sourceDir of fileName.');
        }
      }
      resolve(result);
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
          let zipName: string;
          let d: Date = new Date();

          zipName = d.getDate().toString() + d.getMonth().toString() + d.getFullYear().toString() + '_' + d.getHours().toString() + d.getMinutes().toString();
          zipName += '_' + quiz.title;

          JJzip.zip(this.file.dataDirectory + quiz.uuid, {target: this.file.cacheDirectory, name: zipName}, (data) => {
            this.file.removeFile(this.file.dataDirectory, quiz.uuid + '/database.json').then(() => {
              if(data.success) {
                resolve({cordovaFilePath: this.file.cacheDirectory, filePath: zipName + '.zip'});
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

  // TODO: This function needs to be updated to export extras!!
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

                  //Same same for extras
                  for (let question of importQuiz.questions.filter((q) => q.extras !== undefined)) {
                    for (let i = 0; i < question.extras.length ; i++) {
                      promises.push(this.file.checkFile(this.file.cacheDirectory, quizPath + question.uuid + '/' + question.extras[i]));
                      //Set answer to full path, that will allow us to use copyAttachementsToDataDirectory method
                      question.extras[i] = this.file.cacheDirectory + quizPath + question.uuid + '/' + question.extras[i];
                    }
                  }


                  Promise.all(promises).then(async (results: Array<boolean>) => {
                    //Everything is okey, so we can copy the dir
                    if (this.quizs.findIndex((q) => q.uuid === importQuiz.uuid) === -1) {
                      //Move attachements
                      //var movePromises = []; //DO NOT TRY to use Promise.all to resolve multiples promises, file.moveFile does not supports // executions
                      var moveResults = [];
                      let questionIndex: number;

                      try {
                        for (let question of importQuiz.questions.filter((q) => q.type === QuestionType.rightPicture)) {
                          moveResults.push(await this.copyAttachementsToDataDirectory(importQuiz.uuid, question.uuid, AttachementType.answers, question.answers));
                        }

                        for (let question of importQuiz.questions.filter((q) => q.extras !== undefined)) {
                          moveResults.push(await this.copyAttachementsToDataDirectory(importQuiz.uuid, question.uuid, AttachementType.extras, question.extras));
                        }

                        //Update answers so that they contain only fileName and not fullPath
                        if (moveResults) {
                          for (let result of moveResults) {
                            questionIndex = importQuiz.questions.findIndex((q) => q.uuid === result.questionUuid);

                            if (questionIndex !== -1) {
                              if (result.type === AttachementType.answers) {
                                //set correct answers
                                for (let fileName of result.fileNames) {
                                  let attachementIndex: number = importQuiz.questions[questionIndex].answers.findIndex((a) => a.endsWith(fileName));

                                  importQuiz.questions[questionIndex].answers[attachementIndex] = fileName;
                                }
                              } else if (result.type === AttachementType.extras) {
                                //set correct extras
                                for (let fileName of result.fileNames) {
                                  let attachementIndex: number = importQuiz.questions[questionIndex].extras.findIndex((e) => e.endsWith(fileName));

                                  importQuiz.questions[questionIndex].extras[attachementIndex] = fileName;
                                }
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
                      } catch(error) {
                        reject('Could not save attachements. ' + error);
                      };
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
