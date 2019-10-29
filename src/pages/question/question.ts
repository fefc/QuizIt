import { Component, ViewChild, ElementRef } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Platform, ViewController, AlertController, NavParams, Slides } from 'ionic-angular';
import { ImagePicker } from '@ionic-native/image-picker';
import { File } from '@ionic-native/file';
import { AndroidPermissions } from '@ionic-native/android-permissions';

import { Category } from '../../models/category';
import { QuestionType } from '../../models/question';
import { Question } from '../../models/question';

const MAX_PICTURE_WIDTH: number = 1920;
const MAX_PICTURE_HEIGHT: number = 1080;

@Component({
  selector: 'page-question',
  templateUrl: 'question.html'
})

export class QuestionPage {
  private answerNumber: Array<string> = ['one', 'two', 'three', 'four'];
  private maxPictures: number = 5;
  private QuestionType = QuestionType; //for use in Angluar html
  private title: string;
  private saveButtonName: string;
  private categorys: Array<Category>;
  private question: Question;
  private attachementDir: string;
  private previousType: QuestionType;
  private previousAnswers: Array<string>;
  private previousRightAnswer: number;

  private pictures: Array<SafeUrl>;
  private extras: Array<SafeUrl>;

  @ViewChild(Slides) slides: Slides;
  @ViewChild('fileInput') fileInput: ElementRef; //Picture selector for browser
  @ViewChild('fileInputReplace') fileInputReplace: ElementRef; //Picture selector for browser
  @ViewChild('fileInputExtra') fileInputExtra: ElementRef; //Extra selector for browser

  private replacePictureIndex: number;

  constructor(private platform: Platform,
              public viewCtrl: ViewController,
              private alertCtrl: AlertController,
              private file: File,
              private imagePicker: ImagePicker,
              private sanitizer:DomSanitizer,
              private androidPermissions: AndroidPermissions,
              params: NavParams) {
    //avoid ionic warnings
    this.title = this.title;
    this.saveButtonName = this.saveButtonName;

    //lets make deep copies, so that we don't modfiy anything before user confirmation
    this.categorys = JSON.parse(JSON.stringify(params.data.categorys));

    if (!params.data.question) {
      this.question = {
        uuid: '',
        question: '',
        type: QuestionType.classic,
        rightAnswer: -1,
        answers: ['','','',''],
        extras: [],
        category: {name: this.categorys[0].name},
        authorId: -1
      };

      this.attachementDir = '';
      this.pictures = [];
      this.extras = [];

      this.title = "New Question";
      this.saveButtonName = "Create";
    }
    else {
      this.question = JSON.parse(JSON.stringify(params.data.question));

      this.attachementDir = params.data.quizUuid + '/' + this.question.uuid + '/';
      this.pictures = new Array<SafeUrl>(this.question.answers.length);
      this.extras = new Array<SafeUrl>(this.question.extras.length);

      if (this.question.type == QuestionType.rightPicture) {
        for (let i: number = 0; i < this.question.answers.length; i++) {
          this.renderPicture(this.file.dataDirectory, this.attachementDir + this.question.answers[i], i);
        }
      }

      this.title = "Edit Question";
      this.saveButtonName = "Save";
    }

    if (this.question.type === QuestionType.rightPicture) {
      this.previousType = QuestionType.rightPicture;
      this.previousAnswers = ['', '', '', ''];
    }
    else {
      this.previousType = QuestionType.classic;
      this.previousAnswers = [];
    }

    this.previousRightAnswer = -1;
  }

  indexTracker(index: number, obj: any) {
    return index;
  }

  categoryChange(val: string) {
    if (val === "new") {
      let alert = this.alertCtrl.create({
        title: 'New category',
        inputs: [
          {
            name: 'categoryName',
            placeholder: 'Economics'
          }
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: data => {
              this.question.category.name = this.categorys[0].name;
            }
          },
          {
            text: 'Create',
            handler: data => {
              if (data.categoryName.length > 3 && this.categorys.findIndex((category) => category.name === data.categoryName) === -1 ) {
                this.categorys.push({name: data.categoryName});
                this.question.category.name = data.categoryName;
              }
              else {
                this.question.category.name = this.categorys[0].name;

                let error = this.alertCtrl.create({
                  title: 'Error creating category',
                  message: 'Category name must be more than 3 characters long and should not already exist',
                  buttons: [
                    {
                      text: 'Ok',
                      role: 'ok',
                    }
                  ]
                });
                error.present();
              }
            }
          }
        ]
      });
      alert.present();
    }
  }

  typeChange(val: QuestionType) {
    if (val !== this.previousType) {
      if (val === QuestionType.rightPicture || this.previousType === QuestionType.rightPicture) {
        let futurePreviousAnswers: Array<string> = JSON.parse(JSON.stringify(this.question.answers));
        let futurePreviousRightAnswer: number = this.question.rightAnswer;

        this.question.answers = JSON.parse(JSON.stringify(this.previousAnswers));
        this.question.rightAnswer = this.previousRightAnswer;

        this.previousAnswers = futurePreviousAnswers;
        this.previousRightAnswer = futurePreviousRightAnswer;
      }
      this.previousType = val;
    }
  }

  rightPicture(val: number) {
    this.question.rightAnswer = val;
  }

  openImagePicker(maximumImagesCount: number, extra: boolean) {
    if (this.platform.is('android')) {
      this.androidPermissions.hasPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE)
      .then(status => {
        if (status.hasPermission) {
          this.openMobileImagePicker(maximumImagesCount, extra);
        } else {
          this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE)
          .then(status => {
            if(status.hasPermission) {
              this.openMobileImagePicker(maximumImagesCount, extra);
            }
          });
        }
      });
    } else {
      this.openBrowserImagePicker(extra);
    }
  }

  openBrowserImagePicker(extra: boolean){
    if (extra) {
      this.fileInputExtra.nativeElement.click();
    } else {
      this.fileInput.nativeElement.click();
    }
  };

  replacePicture(val: number) {
    if (this.platform.is('android')) {
      this.androidPermissions.hasPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE)
      .then(status => {
        if (status.hasPermission) {
          this.replacePictureMobile(val);
        } else {
          this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE)
          .then(status => {
            if(status.hasPermission) {
              this.replacePictureMobile(val);
            }
          });
        }
      });
    } else {
      this.replacePictureBrowser(val);
    }
  }

  replacePictureBrowser(val: number) {
    this.fileInputReplace.nativeElement.click();
    this.replacePictureIndex = val;
  }

  //https://stackoverflow.com/a/52970316
  openMobileImagePicker(maximumImagesCount: number, extra: boolean) {
    let maxImages: number;

    if (extra) {
      maxImages = maximumImagesCount;
    } else {
      maxImages = maximumImagesCount - this.question.answers.length;
    }

    this.imagePicker.getPictures({maximumImagesCount: maxImages, width:MAX_PICTURE_WIDTH, height: MAX_PICTURE_HEIGHT}).then((results) => {
      let decodedCacheDirectoryURI: string = decodeURIComponent(this.file.cacheDirectory);
      let decodedURI: string = '';

      for (var i = 0; i < results.length; i++) {
        decodedURI = decodeURIComponent(results[i]);

        if (extra) {
          this.question.extras = [];
          this.question.extras.push(decodedURI);

          this.extras = [];
          this.extras.push(undefined);
        } else {
          this.question.answers.push(decodedURI);
          this.pictures.push(undefined);
          this.renderPicture(this.file.cacheDirectory, decodedURI.replace(decodedCacheDirectoryURI, ''), this.pictures.length - 1);
        }
      }
    }).catch(() => {
      alert('Could not get images.');
    });
  }

  replacePictureMobile(val: number) {
    this.imagePicker.getPictures({maximumImagesCount: 1, width:MAX_PICTURE_WIDTH, height: MAX_PICTURE_HEIGHT}).then((results) => {
      if (results.length === 1) {
        let decodedCacheDirectoryURI: string = decodeURIComponent(this.file.cacheDirectory);
        let decodedURI: string = decodeURIComponent(results[0]);

        this.question.answers[val] = decodedURI;
        this.renderPicture(this.file.cacheDirectory, decodedURI.replace(decodedCacheDirectoryURI, ''), val);
      }
    }).catch(() => {
      alert('Could not get images.');
    });
  }

  getBrowserImages(maximumImagesCount: number, extra: boolean) {
    let error: boolean = false;
    let files: Array<any>;

    if (extra) {
      files = this.fileInputExtra.nativeElement.files;

      if (files.length > maximumImagesCount) {
        error = true;
      }
    } else {
      files = this.fileInput.nativeElement.files;

      if (files.length > maximumImagesCount - this.question.answers.length) {
        error = true;
      }
    }

    if (error) {
      alert("to many images");
    } else {
      for (let file of files) {
        this.resizeBrowserImage(file).then((e: any) => {
          var filename: string = this.uuidv4() + '.jpg';

          this.file.writeFile(this.file.cacheDirectory, filename, e.target.result, { replace: true }).then(() => {
            if (extra) {
              this.question.extras = [];
              this.question.extras.push(this.file.cacheDirectory + filename);

              this.extras = [];
              this.extras.push(undefined);
            } else {
              this.question.answers.push(this.file.cacheDirectory + filename);
              this.pictures.push(undefined);
              this.renderPicture(this.file.cacheDirectory, filename, this.pictures.length - 1);
            }
          }).catch((error) => {
            alert(error);
          });
        }).catch(() => {
          alert('Could not resize image');
        });
      }
    }
  }

  getBrowserReplaceImage() {
    let file: any = this.fileInputReplace.nativeElement.files[0];

    this.resizeBrowserImage(file).then((e: any) => {
      var filename: string = this.uuidv4() + '.jpg';

      this.file.writeFile(this.file.cacheDirectory, filename, e.target.result, { replace: true }).then(() => {
        this.question.answers[this.replacePictureIndex] = this.file.cacheDirectory + filename;
        this.renderPicture(this.file.cacheDirectory, filename, this.replacePictureIndex);
      }).catch((error) => {
        alert(error);
      });
    }).catch(() => {
      alert('Could not resize image');
    });
  }

  resizeBrowserImage(file: any) {
    return new Promise((resolve, reject) => {
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e: any) => {
        //First resize the image
        //https://zocada.com/compress-resize-images-javascript-browser/
        let img = new Image();
        img.src = e.target.result;
        img.onload = (pic: any) => {
          let canvas = document.createElement('canvas');

          if (img.height > MAX_PICTURE_HEIGHT || img.width > MAX_PICTURE_WIDTH) {
            if ((img.height / MAX_PICTURE_HEIGHT) > (img.width / MAX_PICTURE_WIDTH)) {
              canvas.width = img.width / (img.height / MAX_PICTURE_HEIGHT)
              canvas.height = MAX_PICTURE_HEIGHT;
            } else {
              canvas.width = MAX_PICTURE_WIDTH
              canvas.height = img.height / (img.width / MAX_PICTURE_WIDTH) ;
            }
          } else {
            canvas.width = img.width;
            canvas.height = img.height;
          }

          let ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          ctx.canvas.toBlob((blob) => {
            var resizedReader = new FileReader();
            resizedReader.readAsArrayBuffer(blob);
            resizedReader.onload = (resizedE: any) => {
              resolve(resizedE);
            };
          }, 'image/jpeg', 1);
        };
      };
    });
  }

  deletePicture(val: number) {
    if (this.question.rightAnswer === val) {
      this.question.rightAnswer = -1;
    }
    this.question.answers.splice(val, 1);
    this.pictures.splice(val, 1);

    val = val - 1;

    if (val >= 0 && val < this.question.answers.length) {
      this.slides.slideTo(val);
    }

    this.slides.update();
  }

  enableSaveButton() {
    let enable: boolean = true;
    if (this.question.question) {
      if (this.question.question.length > 0) {
        if (this.question.rightAnswer !== -1) {
          for (let answer of this.question.answers) {
            if (answer.length === 0) {
              enable = false;
            }
          }
        }
        else {
          enable = false;
        }
      }
      else {
        enable = false;
      }
    }
    else {
      enable = false;
    }
    return enable;
  }

  save() {
    if (this.enableSaveButton()) {
      if (this.question.type == QuestionType.rightPicture) {
        for (let i: number = 0; i < this.question.answers.length; i++) {
          this.question.answers[i] = this.question.answers[i].replace(this.attachementDir, '');
        }
      }
      this.viewCtrl.dismiss({question: this.question});
    }
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  renderPicture(directory: string, fileName: string, position: number) {
    this.file.readAsDataURL(directory, fileName).then((picture) => {
      this.pictures[position] = this.sanitizer.bypassSecurityTrustStyle(`url('${picture}')`);
      this.slides.update();
    }).catch((error) => {
      console.log("Something went wrong when reading pictures.", error);
    });
  }

  uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
