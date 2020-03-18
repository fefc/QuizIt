import * as firebase from "firebase/app";
import 'firebase/database';
import 'firebase/storage';
import 'firebase/firestore';

import { Injectable } from '@angular/core';
import { Observable } from "rxjs/Observable"
import { Subscription } from "rxjs/Subscription";

import { File } from '@ionic-native/file';

@Injectable()
export class ConnectionProvider {
  public connected: boolean;

  public connectionStateChangesSubscription: Subscription;

  constructor(
    private file: File) {
    this.connected = false;
  }

  /*connectOnline() {
    return new Promise((resolve, reject) => {
      this.connectionStateChangesSubscription = this.connectionStateChanges().subscribe();
      resolve();
    });
  }*/

  /*disconnectOnline() {
    if (this.connectionStateChangesSubscription) {
      this.connectionStateChangesSubscription.unsubscribe();
    }
  }*/

  connectionStateChanges() {
    return new Observable<boolean>((observer) => {
      firebase.database().ref('.info/connected').on('value', (state) => {
        this.connected = state.val();

        console.log('connectionStateChanges');

        //observer.next(this.connected);

        if (this.connected) {
          firebase.firestore().enableNetwork().then(() => {observer.next(this.connected);});
        } else {
          firebase.firestore().disableNetwork().then(() => {observer.next(this.connected);});
        }
      });

      return () => {
        firebase.database().ref('.info/connected').off();
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
          firebase.storage().ref().child(reference).getDownloadURL().then((url) => {
            resolve(url);
          }).catch((error) => {
            reject('Could not getStorageUrl from firebase.');
          });
        }
       else {
        reject("No reference, can't getStorageUrl.");
      }
    });
  }
}
