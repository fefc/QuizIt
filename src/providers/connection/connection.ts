import * as firebase from "firebase/app";
import 'firebase/database';
import 'firebase/storage';
import 'firebase/firestore';

import { Injectable } from '@angular/core';
import { Observable } from "rxjs/Observable"
import { Subscription } from "rxjs/Subscription";

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

  init() {
    return new Promise((resolve, reject) => {
      if (this.network.type !== this.network.Connection.NONE) {
        this.connected = true;
        firebase.firestore().enableNetwork().then(() => resolve());
      } else {
        this.connected = false;
        firebase.firestore().disableNetwork().then(() => resolve());
      }
    });
  }

  connectionStateChanges() {
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

  uploadFileOnline(reference: string, fullLocalPath: string) {
    return new Promise<string>((resolve, reject) => {
      var indexOfSlash: number = fullLocalPath.lastIndexOf('/') + 1;
      var sourceDir = fullLocalPath.substring(0, indexOfSlash);
      var fileName = fullLocalPath.substring(indexOfSlash);

      if (this.connected) {
        this.file.readAsArrayBuffer(sourceDir, fileName).then((arrayBuffer) => {
          var fileRef = firebase.storage().ref().child(reference + fileName);

          fileRef.put(arrayBuffer, { 'cacheControl': 'private, max-age=15552000' }).then((snap) => {
            this.file.removeFile(sourceDir, fileName).then(() => {
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
    });
  }

  checkPendingUpload(fullLocalPath: string) {
    return new Promise<boolean>((resolve, reject) => {
      if (['file:///', 'filesystem:'].some(extension => fullLocalPath.startsWith(extension))) {
        var indexOfSlash: number = fullLocalPath.lastIndexOf('/') + 1;
        var sourceDir = fullLocalPath.substring(0, indexOfSlash);
        var fileName = fullLocalPath.substring(indexOfSlash);

        this.file.checkFile(sourceDir, fileName).then(() => {
          //File pending locally
          console.log('file pending');
          resolve(true);
        }).catch((error) => {
          //No file pending
          console.log('file not exsistancs');
          resolve(false);
        });
      } else {
        console.log('fullLocalath not valid');
        resolve(false);
      }
    });
  }

  getStorageUrl(reference: string) {
    return new Promise<string>((resolve, reject) => {
      if (reference) {
        if (this.connected) {
          firebase.storage().ref().child(reference).getDownloadURL().then((url) => {
            if (!this.serviceWorkerAvailable) {
              this.nativeStorage.setItem(reference, url); //No need to wait for it beeing done
            }
            resolve(url);
          }).catch((error) => {
            if (!this.serviceWorkerAvailable) {
              this.nativeStorage.getItem(reference).then((cachedUrl) => {
                resolve(cachedUrl);
              }).catch((error) => {
                reject('Could not getCachedUrl from getStorageUrl.')
              });
            } else {
              reject('Could not getStorageUrl from firebase.');
            }
          });
        } else {
          if (!this.serviceWorkerAvailable) {
            this.nativeStorage.getItem(reference).then((cachedUrl) => {
              resolve(cachedUrl);
            }).catch((error) => {
              reject('Could not getCachedUrl from getStorageUrl.')
            });
          } else {
            reject('Could not getStorageUrl from firebase.');
          }
        }
      } else {
        reject("No reference, can't getStorageUrl.");
      }
    });
  }

  getLocalFileUrl(fullLocalPath: string): Promise<SafeUrl> {
    let convertedUrl: string = (<any> window).Ionic.WebView.convertFileSrc(fullLocalPath);

    if (convertedUrl.includes('http://')) {
      return new Promise<SafeUrl>((resolve, reject) => {
        resolve(this.sanitizer.bypassSecurityTrustUrl(convertedUrl));
      });
    } else  {
      //On some browser convertFileSrc does not work properly (firefox at the moment)
      //In this case we are going to read the file and give the DataUrl back
      var indexOfSlash: number = fullLocalPath.lastIndexOf('/') + 1;
      var sourceDir = fullLocalPath.substring(0, indexOfSlash);
      var fileName = fullLocalPath.substring(indexOfSlash);

      return new Promise<SafeUrl>((resolve, reject) => {
        this.file.readAsDataURL(sourceDir, fileName).then((dataUrl) => {
          resolve(this.sanitizer.bypassSecurityTrustUrl(dataUrl));
        }).catch((error) => {
          resolve(undefined);
        })
      });
    }
  }
}
