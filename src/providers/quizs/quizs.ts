import * as firebase from "firebase/app";
import 'firebase/firestore';

import { Injectable } from '@angular/core';
import { File } from '@ionic-native/file';

import { AuthenticationProvider } from '../authentication/authentication';

declare var JJzip: any;

import { Quiz } from '../../models/quiz';
import { QuizSettings } from '../../models/quiz-settings';

import { Question } from '../../models/question';
import { QuestionType } from '../../models/question';
import { Category } from '../../models/category';

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

  constructor(private file: File, private authProv: AuthenticationProvider) {
    this.quizs = new Array<Quiz>();
  }

  getSettingsPropertiesChanges(quiz: Quiz, title: string, settings: QuizSettings) {
    let savedSettings: QuizSettings = quiz.settings;
    let changes: any = {};

    if (savedSettings && quiz.uuid) {
      //title is considered as part of settings, simplifies firebase updates
      if (title !== quiz.title) changes['title'] = title;

      //An update on settings
      if (settings.commonAnimationDuration !== undefined && settings.commonAnimationDuration !== savedSettings.commonAnimationDuration) changes['settings.commonAnimationDuration'] = settings.commonAnimationDuration;
      if (settings.timeBarAnimationDuration !== undefined && settings.timeBarAnimationDuration !== savedSettings.timeBarAnimationDuration) changes['settings.timeBarAnimationDuration'] = settings.timeBarAnimationDuration;
      if (settings.playerAnswerAnimationDuration !== undefined && settings.playerAnswerAnimationDuration !== savedSettings.playerAnswerAnimationDuration) changes['settings.playerAnswerAnimationDuration'] = settings.playerAnswerAnimationDuration;
      if (settings.showNextDelay !== undefined && settings.showNextDelay !== savedSettings.showNextDelay) changes['settings.showNextDelay'] = settings.showNextDelay;
      if (settings.amountOfPicturesToShow !== undefined && settings.amountOfPicturesToShow !== savedSettings.amountOfPicturesToShow) changes['settings.amountOfPicturesToShow'] = settings.amountOfPicturesToShow;
      if (settings.autoPlay !== undefined && settings.autoPlay !== savedSettings.autoPlay) changes['settings.autoPlay'] = settings.autoPlay;
      if (settings.startMessage !== undefined && settings.startMessage !== savedSettings.startMessage) changes['settings.startMessage'] = settings.startMessage;
      if (settings.endMessage !== undefined && settings.endMessage !== savedSettings.endMessage) changes['settings.endMessage'] = settings.endMessage;
      if (settings.backgroundImage !== undefined && settings.backgroundImage !== savedSettings.backgroundImage) changes['settings.backgroundImage'] = settings.backgroundImage;
      if (settings.extraDisplayDuration !== undefined && settings.extraDisplayDuration !== savedSettings.extraDisplayDuration) changes['settings.extraDisplayDuration'] = settings.extraDisplayDuration;

    } else {
      //title is considered as part of settings, simplifies firebase updates
      changes['title'] = title;

      //A creation of a quiz and so settings as well
      if (settings.commonAnimationDuration !== undefined) changes['settings.commonAnimationDuration'] = settings.commonAnimationDuration;
      if (settings.timeBarAnimationDuration !== undefined) changes['settings.timeBarAnimationDuration'] = settings.timeBarAnimationDuration;
      if (settings.playerAnswerAnimationDuration !== undefined) changes['settings.playerAnswerAnimationDuration'] = settings.playerAnswerAnimationDuration;
      if (settings.showNextDelay !== undefined) changes['settings.showNextDelay'] = settings.showNextDelay;
      if (settings.amountOfPicturesToShow !== undefined) changes['settings.amountOfPicturesToShow'] = settings.amountOfPicturesToShow;
      if (settings.autoPlay !== undefined) changes['settings.autoPlay'] = settings.autoPlay;
      if (settings.startMessage !== undefined) changes['settings.startMessage'] = settings.startMessage;
      if (settings.endMessage !== undefined) changes['settings.endMessage'] = settings.endMessage;
      if (settings.backgroundImage !== undefined) changes['settings.backgroundImage'] = settings.backgroundImage;
      if (settings.extraDisplayDuration !== undefined) changes['settings.extraDisplayDuration'] = settings.extraDisplayDuration;
    }

    if (Object.keys(changes).length === 0) return undefined;
    else return changes;
  }

  getCategoryPropertiesChanges(quiz: Quiz, category: Category) {
    let savedCategory: Category = quiz.categorys.find((c) => c.uuid === category.uuid);
    let changes: any = {};

    if (savedCategory) {
      //An update on a category
      if (category.afterCategoryUuid !== savedCategory.afterCategoryUuid) changes.afterCategoryUuid = category.afterCategoryUuid;
      if (category.name !== savedCategory.name) changes.name = category.name;
    } else {
      //A creation of a category
      changes.afterCategoryUuid = category.afterCategoryUuid;
      changes.name = category.name;
    }

    if (Object.keys(changes).length === 0) return undefined;
    else return changes;
  }

  getQuestionPropertiesChanges(quiz: Quiz, question: Question) {
    let savedQuestion: Question = quiz.questions.find((q) => q.uuid === question.uuid);
    let changes: any = {};

    if (savedQuestion) {
      //An update on a question
      if (question.afterQuestionUuid !== savedQuestion.afterQuestionUuid) changes.afterQuestionUuid = question.afterQuestionUuid;
      if (question.question !== savedQuestion.question) changes.question = question.question;
      if (question.type !== savedQuestion.type) changes.type = question.type;
      if (question.categoryUuid !== savedQuestion.categoryUuid) changes.categoryUuid = question.categoryUuid;
      if (question.rightAnswer !== savedQuestion.rightAnswer) changes.rightAnswer = question.rightAnswer;
      if (question.draft !== savedQuestion.draft) changes.draft = question.draft;
      if (question.hide !== savedQuestion.hide) changes.hide = question.hide;
      if (JSON.stringify(question.answers) !== JSON.stringify(savedQuestion.answers)) changes.answers = question.answers;
      if (JSON.stringify(question.extras) !== JSON.stringify(savedQuestion.extras)) changes.extras = question.extras;
    } else {
      //A creation of a question
      changes.afterQuestionUuid = question.afterQuestionUuid;
      changes.question = question.question;
      changes.type = question.type;
      changes.categoryUuid = question.categoryUuid;
      changes.rightAnswer = question.rightAnswer;
      changes.draft = question.draft;
      changes.hide = question.hide;
      changes.answers = question.answers;
      changes.extras = question.extras;
    }

    if (Object.keys(changes).length === 0) return undefined;
    else return changes;
  }

  createQuizOnline(quiz: Quiz) {
    return new Promise((resolve, reject) => {
      firebase.firestore().collection('Q').add({title: quiz.title, settings: quiz.settings}).then((newQuizRef) => {
        let batch = firebase.firestore().batch();

        let userQuizRef = firebase.firestore().collection('U').doc(this.authProv.getUser().uid).collection('Q').doc(newQuizRef.id);
        batch.set(userQuizRef, {});

        let quizUserRef = newQuizRef.collection('U').doc(this.authProv.getUser().uid);
        batch.set(quizUserRef, {});

        for (let i = 0; i < quiz.categorys.length ; i++) {
          let quizCategoryRef = newQuizRef.collection('C').doc();

          quiz.categorys[i] = {
            uuid: quizCategoryRef.id,
            afterCategoryUuid: i > 0 ? quiz.categorys[i - 1].afterCategoryUuid : 'first',
            name: quiz.categorys[i].name
          };

          batch.set(quizCategoryRef, {name: quiz.categorys[i].name});
        }

        // Commit the batch
        return batch.commit().then(() => {

          let newQuiz: Quiz = {
            uuid: newQuizRef.id,
            title: quiz.title,
            creationDate: quiz.creationDate,
            categorys: quiz.categorys,
            questions: quiz.questions,
            settings: quiz.settings
          }

          console.log(newQuiz);

          this.saveToStorage(newQuiz).then(() => {
            resolve();
          }).catch((error) => {
            console.log(error);
            reject(error);
          });
        }).catch((error) => {
          console.log(error);
          reject("Could not update players online");
        });
      }).catch((error) => {
        console.log(error);
        reject(error);
      });
    });
  }

  deleteQuizOnline(quiz: Quiz) {
    return new Promise((resolve, reject) => {
      reject('not implemented');
    });
  }

  saveSettingsOnline(quiz: Quiz, title: string, settings: QuizSettings) {
    return new Promise((resolve, reject) => {
      let changes = this.getSettingsPropertiesChanges(quiz, title, settings);

      if (changes) {
        firebase.firestore().collection('Q').doc(quiz.uuid).update(changes).then(() => {

          quiz.title = title;
          quiz.settings = settings;

          this.saveToStorage(quiz).then(() => {
            resolve();
          }).catch((error) => {
            reject(error);
          });
        }).catch((error) => {
          reject(error);
        });
      } else {
        resolve();
      }
    });
  }

  saveCategorysOnline(quiz: Quiz, categorys: Array<Category>) {
    return new Promise((resolve, reject) => {
      let batch = firebase.firestore().batch();

      for (let category of categorys) {
        let changes = this.getCategoryPropertiesChanges(quiz, category);

        if (changes) {
          let categoryRef = firebase.firestore().collection('Q').doc(quiz.uuid).collection('C').doc(category.uuid);
          batch.update(categoryRef, changes);
        }
      }

      // Commit the batch
      return batch.commit().then(() => {
        for (let category of categorys) {
          let oldCategory: number = quiz.categorys.findIndex((c) => c.uuid === category.uuid);

          if (oldCategory !== -1) {
            quiz.categorys[oldCategory] = category;
          }
          else {
            reject('cant batch update new categorys');
          }
        }
        this.saveToStorage(quiz).then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      }).catch((error) => {
        console.log(error);
        reject("Could not update players online");
      });
    });
  }

  deleteCategoryOnline(quiz: Quiz, category: Category) {
    return new Promise<string>((resolve, reject) => {
      let batch = firebase.firestore().batch();

      for (let question of quiz.questions.filter((q) => q.categoryUuid === category.uuid)) {
        let questionRef = firebase.firestore().collection('Q').doc(quiz.uuid).collection('Q').doc(question.uuid);
        batch.delete(questionRef);
      }

      let categoryRef = firebase.firestore().collection('Q').doc(quiz.uuid).collection('C').doc(category.uuid);
      batch.delete(categoryRef);

      // Commit the batch
      return batch.commit().then(() => {
        quiz.questions = quiz.questions.filter((q) => q.categoryUuid !== category.uuid);
        quiz.categorys = quiz.categorys.filter((c) => c.uuid !== category.uuid);
        this.saveToStorage(quiz).then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      }).catch(() => {
        reject('Could not delete category and associated questions online.');
      });
    });
  }

  saveQuestionOnline(quiz: Quiz, question: Question, newCategory?: Category) {
    return new Promise((resolve, reject) => {
      let batch = firebase.firestore().batch();

      if (newCategory) {
        console.log(newCategory);
        let newCatRef = firebase.firestore().collection('Q').doc(quiz.uuid).collection('C').doc();
        batch.set(newCatRef, {afterCategoryUuid: newCategory.afterCategoryUuid, name: newCategory.name});

        newCategory = {
          uuid: newCatRef.id,
          afterCategoryUuid: newCategory.afterCategoryUuid,
          name: newCategory.name
        };

        question.categoryUuid = newCategory.uuid;
      }

      let changes = this.getQuestionPropertiesChanges(quiz, question);

      if (changes) {
        let questionRef;

        if (question.uuid) {
          questionRef = firebase.firestore().collection('Q').doc(quiz.uuid).collection('Q').doc(question.uuid);
          batch.update(questionRef, changes);
        }
        else {
          questionRef = firebase.firestore().collection('Q').doc(quiz.uuid).collection('Q').doc();
          batch.set(questionRef, changes);
        }

        // Commit the batch
        return batch.commit().then(() => {

          let oldQuestion: number = quiz.questions.findIndex((q) => q.uuid === question.uuid);

          if (newCategory) quiz.categorys.push(newCategory);

          if (oldQuestion !== -1) {
            quiz.questions[oldQuestion] = question;
          }
          else {
            let questionUUID: Question = {
              uuid: questionRef.id,
              afterQuestionUuid: question.afterQuestionUuid,
              question: question.question,
              type: question.type,
              categoryUuid: question.categoryUuid,
              rightAnswer: question.rightAnswer,
              draft: question.draft,
              hide: question.hide,
              answers: question.answers,
              extras: question.extras,
              authorId: question.authorId
            }

            quiz.questions.push(questionUUID);
          }

          this.saveToStorage(quiz).then(() => {
            resolve();
          }).catch((error) => {
            reject(error);
          });
        }).catch((error) => {
          console.log(error);
          reject("Could not update players online");
        });
      } else {
        resolve();
      }
    });
  }

  deleteQuestionsOnline(quiz: Quiz) {
    return new Promise<string>((resolve, reject) => {
      let batch = firebase.firestore().batch();

      for (let question of quiz.questions.filter((q) => q.selected === true)) {
        let questionRef = firebase.firestore().collection('Q').doc(quiz.uuid).collection('Q').doc(question.uuid);
        batch.delete(questionRef);
      }

      // Commit the batch
      return batch.commit().then(() => {
        quiz.questions = quiz.questions.filter((q) => q.selected !== true);
        this.saveToStorage(quiz).then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      }).catch(() => {
        reject("Could not update players online");
      });
    });
  }

  saveQuestionsOnline(quiz: Quiz, questions: Array<Question>) {
    return new Promise((resolve, reject) => {
      let batch = firebase.firestore().batch();

      for (let question of questions) {
        let changes = this.getQuestionPropertiesChanges(quiz, question);

        if (changes) {
          let questionRef;

          if (question.uuid) {
            questionRef = firebase.firestore().collection('Q').doc(quiz.uuid).collection('Q').doc(question.uuid);
            batch.update(questionRef, changes);
          }
          else {
            reject('cant batch update new questions');
          }
        }
      }

      // Commit the batch
      return batch.commit().then(() => {
        for (let question of questions) {
          let oldQuestion: number = quiz.questions.findIndex((q) => q.uuid === question.uuid);

          if (oldQuestion !== -1) {
            quiz.questions[oldQuestion] = question;
          }
          else {
            reject('cant batch update new questions');
          }
        }
        this.saveToStorage(quiz).then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      }).catch((error) => {
        console.log(error);
        reject("Could not update players online");
      });
    });
  }

  loadFromOnline() {
    return new Promise((resolve, reject) => {
      firebase.firestore().collection('U').doc(this.authProv.getUser().uid).collection('Q').get().then((userQuizsSnapshot) => {

        let quizs: Array<Quiz> = new Array<Quiz>();

        let quizPromises = [];
        let categoryPromises = [];
        let questionPromises = [];

        userQuizsSnapshot.forEach((userQuizDoc) => {
           quizPromises.push(firebase.firestore().collection('Q').doc(userQuizDoc.id).get());
        });

        Promise.all(quizPromises).then((quizsSnapshot) => {
          quizsSnapshot.forEach((quizDoc) => {
            let quizData = quizDoc.data();

            let quiz: Quiz = {
              uuid: quizDoc.id,
              title: quizData.title,
              creationDate: 0,
              settings: quizData.settings,
              categorys: [],
              questions: [],
            };

            quizs.push(quiz);
            categoryPromises.push(this.loadCategorysFromOnline(quiz.uuid));
            questionPromises.push(this.loadQuestionsFromOnline(quiz.uuid));
          });

          Promise.all(categoryPromises).then((quizCategorys) => {
            for (let i = 0; i < quizs.length; i++) {
              quizs[i].categorys = quizCategorys[i];
            }
            Promise.all(questionPromises).then((quizQuestions) => {
              for (let i = 0; i < quizs.length; i++) {
                quizs[i].questions = quizQuestions[i];
              }

              this.quizs = quizs;

              resolve();
            }).catch((error) =>  {
              reject('Could not get quizQuestions');
            });
          }).catch((error) => {
            reject('Could not get quizCategorys');
          });
        }).catch((error) => {
          reject('Could not get quizsSnapshots.');
        });
      }).catch((error) => {
        console.log(error);
        reject('Could not get quizes');
      });
    });
  }

  loadQuestionsFromOnline(quizUuid: string) {
    return new Promise((resolve, reject) => {
      let questions: Array<Question> = new Array<Question>();

      firebase.firestore().collection('Q').doc(quizUuid).collection('Q').get().then((questionsSnapshot) => {
        questionsSnapshot.forEach((questionDoc) => {
          let questionData = questionDoc.data();

          let question: Question = {
            uuid: questionDoc.id,
            afterQuestionUuid: questionData.afterQuestionUuid,
            question: questionData.question,
            type: questionData.type,
            rightAnswer: questionData.rightAnswer,
            answers: questionData.answers,
            extras: questionData.extras,
            categoryUuid: questionData.categoryUuid,
            authorId: questionData.authorId,
            hide: questionData.hide,
            draft: questionData.draft
          };

          questions.push(question);
        });

        resolve(this.orderQuestionsFromOnline(questions));
      }).catch((error) => {
        reject('loadQuestionsFromOnline failed');
      });
    });
  }

  loadCategorysFromOnline(quizUuid: string) {
    return new Promise((resolve, reject) => {
      let categorys: Array<Category> = new Array<Category>();

      firebase.firestore().collection('Q').doc(quizUuid).collection('C').get().then((categorysSnapshot) => {
        categorysSnapshot.forEach((categoryDoc) => {
          let categoryData = categoryDoc.data();

          let category: Category = {
            uuid: categoryDoc.id,
            afterCategoryUuid: categoryData.afterCategoryUuid,
            name: categoryData.name
          };

          categorys.push(category);
        });

        resolve(this.orderCategorysFromOnline(categorys));
      }).catch((error) => {
        reject('loadCategorysFromOnline failed');
      });
    });
  }

  orderQuestionsFromOnline(toBeSortedQuestions: Array<Question>) {
    let searchedUuid: string = 'first';

    let sortedQuestions: Array<Question> = new Array<Question>();

    while (toBeSortedQuestions.length > 0) {
      let currentIndex: number = toBeSortedQuestions.findIndex((q) => q.afterQuestionUuid === searchedUuid);
      if (currentIndex === -1) currentIndex = 0; //Fail safe operation, if something is wrong with ids, just push the next

      searchedUuid = toBeSortedQuestions[currentIndex].uuid;
      sortedQuestions.push(toBeSortedQuestions[currentIndex]);

      toBeSortedQuestions.splice(currentIndex, 1);
    }

    return sortedQuestions;
  }

  orderCategorysFromOnline(toBeSortedCategorys: Array<Category>) {
    let searchedUuid: string = 'first';

    let sortedCategorys: Array<Category> = new Array<Category>();

    while (toBeSortedCategorys.length > 0) {
      let currentIndex = toBeSortedCategorys.findIndex((q) => q.afterCategoryUuid === searchedUuid);
      if (currentIndex === -1) currentIndex = 0; //Fail safe operation, if something is wrong with ids, just push the next

      searchedUuid = toBeSortedCategorys[currentIndex].uuid;
      sortedCategorys.push(toBeSortedCategorys[currentIndex]);

      toBeSortedCategorys.splice(currentIndex, 1);
    }

    return sortedCategorys;
  }

  saveToStorage(quiz: Quiz) {
    return new Promise(async (resolve, reject) => {
      let quizIndex: number = this.quizs.findIndex((q) => q.uuid === quiz.uuid);

      if (quizIndex === -1) {
        this.quizs.push(quiz);
      }

      quizIndex = this.quizs.findIndex((q) => q.uuid === quiz.uuid);

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
            let questionIndex = quiz.questions.findIndex((q) => q.uuid === result.questionUuid);

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

        /*this.storage.set('quizs', JSON.stringify(this.quizs)).then(() => {
          resolve();
        }).catch(() => {
          reject('Could not save quizs to storage.');
        });*/
        resolve();
      } catch(error) {
        console.log(error);
        reject('Could not save attachements.');
      };
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
        /*this.storage.set('quizs', JSON.stringify(this.quizs)).then(() => {
          resolve();
        }).catch(() => {
          reject();
        });*/
        resolve();
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
          /*this.storage.set('quizs', JSON.stringify(this.quizs)).then(() => {
            resolve();
          }).catch(() => {
            reject();
          });*/
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

                        /*this.storage.set('quizs', JSON.stringify(this.quizs)).then(() => {
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
                        });*/
                        resolve();
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
