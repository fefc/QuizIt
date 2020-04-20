import * as firebase from "firebase/app";
import 'firebase/database';
import 'firebase/storage';
import 'firebase/firestore';

import { Injectable } from '@angular/core';
import { Observable } from "rxjs/Observable"

import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { File } from '@ionic-native/file';
import { Network } from '@ionic-native/network';
import { NativeStorage } from '@ionic-native/native-storage';

@Injectable()
export class ConnectionProvider {
  public connected: boolean;
  private serviceWorkerAvailable: boolean;

  constructor(
    private file: File,
    private network: Network,
    private nativeStorage: NativeStorage,
    private sanitizer: DomSanitizer) {
    this.connected = false;

    if ((<any> window).serviceWorkerAvailable == true) {
      this.serviceWorkerAvailable = true;
    } else {
      this.serviceWorkerAvailable = false;
    }
  }

  public init() {
    return new Promise((resolve, reject) => {
      if (this.network.type !== this.network.Connection.NONE) {
        this.connected = true;
        firebase.firestore().enableNetwork().then(() => resolve());
      } else {
        this.connected = false;
        firebase.firestore().disableNetwork().then(() => resolve());
      }

      this.cleanNativeStorage().catch((error) => console.log(error));
    });
  }

  public cacheUrl(url: string) {
    try {
      if (this.serviceWorkerAvailable && url.startsWith('https://firebasestorage.googleapis.com')) {
        window.navigator.serviceWorker.controller.postMessage({command: 'add', url: url});
      }
    } catch (error) {
      console.log(error);
    }
  }

  public async isFileSizeValid(filePath: string, maxSize: number) {
    try {
      const fileEntry = await this.file.resolveLocalFilesystemUrl(filePath);
      const fileMetaData = await this.getMetadata(fileEntry);

      return (fileMetaData.size > maxSize) ? false : true;
    } catch(error) {
      console.log(error);
      return false;
    }
  }

  private getMetadata(fileEntry: any) {
    return new Promise<any>((resolve, reject) => {
      fileEntry.getMetadata((metaData) => { resolve(metaData) }, (error) => { reject(error) });
    });
  }

  public cleanNativeStorage(deleteAll?: boolean) {
    return new Promise((resolve, reject) => {
      this.nativeStorage.keys().then((keys) => {

        let now: number = new Date().getTime();
        let promises = [];

        keys.forEach((key) => {
          this.nativeStorage.getItem(key).then((object) => {
            if (object.validUntil) {
              if (deleteAll) {
                this.nativeStorage.remove(key).catch((error) => console.log(error));
              } else {
                if (object.validUntil !== -1) {
                  if (new Date(object.validUntil).getTime() < now) {
                    this.nativeStorage.remove(key).catch((error) => console.log(error));
                  }
                }
              }
            }
          }).catch((error) => {});
        });
        resolve();
      }).catch((error) => {
        reject(error);
      });
    });
  }

  public connectionStateChanges() {
    return new Observable<boolean>((observer) => {

      let connectSubscription = this.network.onchange().subscribe((state) => {
        if (state.type != 'offline') {
          this.connected = true;
          firebase.firestore().enableNetwork().then(() => observer.next(this.connected));
        } else {
          this.connected = false;
          firebase.firestore().disableNetwork().then(() => observer.next(this.connected));
        }
      });

      //Execute once at subscribtion.
      if (this.network.type !== this.network.Connection.NONE) {
        this.connected = true;
        firebase.firestore().enableNetwork().then(() => observer.next(this.connected));
      } else {
        this.connected = false;
        firebase.firestore().disableNetwork().then(() => observer.next(this.connected));
      }

      return () => {
        connectSubscription.unsubscribe();
        this.connected = false;
      };
    });
  }

  public checkPendingUpload(fullLocalPath: string) {
    return new Promise<boolean>((resolve, reject) => {
      if (['file:///', 'filesystem:'].some(extension => fullLocalPath.startsWith(extension))) {
        var indexOfSlash: number = fullLocalPath.lastIndexOf('/') + 1;
        var sourceDir = fullLocalPath.substring(0, indexOfSlash);
        var fileName = fullLocalPath.substring(indexOfSlash);

        this.file.checkFile(sourceDir, fileName).then(() => {
          //File pending locally
          resolve(true);
        }).catch((error) => {
          //No file pending
          resolve(false);
        });
      } else {
        resolve(false);
      }
    });
  }

  public uploadFile(reference: string, fullLocalPath: string, userId: string) {
    return new Promise<string>((resolve, reject) => {
      var indexOfSlash: number = fullLocalPath.lastIndexOf('/') + 1;
      var sourceDir = fullLocalPath.substring(0, indexOfSlash);
      var fileName = fullLocalPath.substring(indexOfSlash);

      if (['file:///', 'filesystem:'].some(extension => fullLocalPath.startsWith(extension))) {
        if (this.connected) {
          this.file.readAsArrayBuffer(sourceDir, fileName).then((arrayBuffer) => {
            var fileRef = firebase.storage().ref().child(reference + fileName);

            fileRef.put(arrayBuffer, { 'cacheControl': 'private, max-age=15552000', customMetadata: {'owners': userId} }).then((snap) => {
              this.nativeStorage.setItem(reference + fileName, {
                url: fullLocalPath,
                validUntil: -1
              }).then(() => {
                resolve(fileName);
              }).catch((error) => {
                resolve(fileName);
              });
            }).catch((error) => {
              reject(error.code);
            });
          }).catch((error) => {
            reject(error);
          });
        } else {
          reject('storage/retry-limit-exceeded');
        }
      } else {
        reject('Nothing to upload.');
      }
    });
  }

  public getFileUrl(dirReference: string, fileReference: string) {
    return new Promise<string | SafeUrl>((resolve, reject) => {
      if (['file:///', 'filesystem:'].some(extension => fileReference.startsWith(extension))) {
        //It is possible to have a file startingWith file:/// but coming from another device, so need to check pendingUpload
        //Pending tells us if the file is available locally
        this.getLocalFileUrl(fileReference).then((localUrl) => {
          resolve(localUrl);
        }).catch(() => {
          resolve(undefined);
        });
      } else {
        this.nativeStorage.getItem(dirReference + fileReference).then((cachedData) => {
          this.getLocalFileUrl(cachedData.url).then((localUrl) => {
            resolve(localUrl);
          }).catch(() => {
            this.getStorageUrl(dirReference + fileReference).then((url) => {
              resolve(url);
            }).catch(() => {
              resolve(undefined);
            });
          });
        }).catch((error) => {
          this.getStorageUrl(dirReference + fileReference).then((url) => {
            resolve(url);
          }).catch(() => {
            resolve(undefined);
          });
        });
      }
    });
  }

  private getStorageUrl(reference: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (reference) {
        if (this.connected || this.serviceWorkerAvailable) {
          firebase.storage().ref().child(reference).getDownloadURL().then((url) => {
            if (!this.serviceWorkerAvailable) {
              firebase.storage().ref().child(reference).getMetadata().then((metadata) => {
                let maxAge: number = metadata.cacheControl ? Number(metadata.cacheControl.match('max-age=([0-9]+)[\s;]*')[1]) : undefined;

                if (maxAge) {
                  this.nativeStorage.setItem(reference, {
                    url: url,
                    validUntil: new Date(new Date().getTime() + maxAge * 0.95 * 1000)
                  }); //No need to wait for it beeing done
                  //Remove 5% to be sure this time is in the valid range
                }
              }).catch((error) => {
              });
            } else {
              this.cacheUrl(url);
            }
            resolve(url);
          }).catch((error) => {
            if (!this.serviceWorkerAvailable) {
              this.nativeStorage.getItem(reference).then((cachedData) => {
                resolve(cachedData.url);
              }).catch((error) => {
                console.log('Could not getCachedUrl from getStorageUrl.', error);
                resolve(undefined);
              });
            } else {
              reject();
              console.log('Could not getStorageUrl from firebase.', error);
              resolve(undefined);
            }
          });
        } else {
          if (!this.serviceWorkerAvailable) {
            this.nativeStorage.getItem(reference).then((cachedData) => {
              resolve(cachedData.url);
            }).catch((error) => {
              console.log('Could not getCachedUrl from getStorageUrl.');
              resolve(undefined);
            });
          } else {
            console.log('Could not getStorageUrl from firebase.');
            resolve(undefined);
          }
        }
      } else {
        console.log("No reference, can't getStorageUrl.");
        resolve(undefined);
      }
    });
  }

  public getLocalFileUrl(fullLocalPath: string): Promise<SafeUrl> {
    return new Promise<SafeUrl>((resolve, reject) => {
      var indexOfSlash: number = fullLocalPath.lastIndexOf('/') + 1;
      var sourceDir = fullLocalPath.substring(0, indexOfSlash);
      var fileName = fullLocalPath.substring(indexOfSlash);

      this.file.checkFile(sourceDir, fileName).then(() => {
        //File available locally
        let convertedUrl: string = (<any> window).Ionic.WebView.convertFileSrc(fullLocalPath);

        if (convertedUrl.includes('http://')) {
          resolve(this.sanitizer.bypassSecurityTrustUrl(convertedUrl));
        } else  {
          //On some browser convertFileSrc does not work properly (firefox at the moment)
          //In this case we are going to read the file and give the DataUrl back
          this.file.readAsDataURL(sourceDir, fileName).then((dataUrl) => {
            resolve(this.sanitizer.bypassSecurityTrustUrl(dataUrl));
          }).catch((error) => {
            reject(error);
          });
        }
      }).catch((error) => {
        //File does not exists locally
        reject(error);
      });
    });
  }
}
