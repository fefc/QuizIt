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
    if (this.serviceWorkerAvailable) {
      window.navigator.serviceWorker.controller.postMessage({command: 'add', url: url});
    }
  }

  private cleanNativeStorage() {
    return new Promise((resolve, reject) => {
      this.nativeStorage.keys().then((keys) => {
        let now: number = new Date().getTime();
        let promises = [];

        keys.forEach((key) => {
          promises.push(this.nativeStorage.getItem(key));
        });

        Promise.all(promises).then((objects) => {
          objects.forEach((object) => {
            if (object.validUntil) {
              if (new Date(object.validUntil).getTime() < now) {
                this.nativeStorage.remove(keys[objects.indexOf(object)]);
              }
            }
          });

          resolve();
        }).catch((error) => {
          reject(error);
        });
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
      } else {
        reject('Nothing to upload.');
      }
    });
  }

  public getFileUrl(dirReference: string, fileReference: string, pendingUpload: boolean) {
    if (['file:///', 'filesystem:'].some(extension => fileReference.startsWith(extension))) {
      if (pendingUpload) {
        //It is possible to have a file startingWith file:/// but coming from another device, so need to check pendingUpload
        //Pending tells us if the file is available locally
        return this.getLocalFileUrl(fileReference);
      } else {
        return new Promise<any>((resolve) => resolve(undefined));
      }
    } else {
      return this.getStorageUrl(dirReference + fileReference);
    }
  }

  private getStorageUrl(reference: string) {
    return new Promise<string>((resolve, reject) => {
      if (reference) {
        if (this.connected) {
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
            }
            resolve(url);
          }).catch((error) => {
            if (!this.serviceWorkerAvailable) {
              this.nativeStorage.getItem(reference).then((cachedData) => {
                resolve(cachedData.url);
              }).catch((error) => {
                console.log('Could not getCachedUrl from getStorageUrl.');
                resolve(undefined);
              });
            } else {
              reject();
              console.log('Could not getStorageUrl from firebase.');
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
