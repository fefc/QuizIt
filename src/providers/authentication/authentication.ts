import * as firebase from "firebase/app";
import 'firebase/auth';

import { Injectable } from '@angular/core';
import { Observable } from "rxjs/Observable"

@Injectable()
export class AuthenticationProvider {

  constructor() {

  }

  authStateChanges() {
    return new Observable<boolean>(observer => {
      const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          // User is signed in.
          observer.next(true);
        } else {
          // No user is signed in.
          observer.next(false);
        }
      });

      return () => {
        unsubscribe();
      };
    });
  }

  getUser() {
    if (firebase.auth().currentUser) {
      return firebase.auth().currentUser;
    } else {
      return undefined;
    }
  }

  logout() {
    return new Promise((resolve, reject) => {
      firebase.auth().signOut().then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      });
    });
  }

  resetPassword(email: string) {
    return new Promise((resolve, reject) => {
      firebase.auth().sendPasswordResetEmail(email).then(() => {
        resolve()
      }).catch((error) => {
        reject(error);
      });
    });
  }

  updatePassword(password: string, newPassword: string) {
    return new Promise((resolve, reject) => {
      let credential = firebase.auth.EmailAuthProvider.credential(this.getUser().email, password);

      if (firebase.auth().currentUser) {
        firebase.auth().currentUser.reauthenticateWithCredential(credential).then(() => {
          firebase.auth().currentUser.updatePassword(newPassword).then(() => {
            resolve();
          }).catch((error) => {
            reject(error);
          });
        }).catch((error) => {
          reject(error);
        });
      } else {
        reject({code: "Currently no user logged in."});
      }
    });
  }

  createAccount(email: string, password: string) {
    return new Promise<any>((resolve, reject) => {
      firebase.auth().createUserWithEmailAndPassword(email, password).then((additionalUserInfo) => {
        resolve(additionalUserInfo.user);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  login(email: string, password: string) {
    return new Promise<any>((resolve, reject) => {
      firebase.auth().signInWithEmailAndPassword(email, password).then((additionalUserInfo) => {
        resolve(additionalUserInfo.user);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  deleteAccount(email: string, password: string) {
    return new Promise((resolve, reject) => {
      let credential = firebase.auth.EmailAuthProvider.credential(email, password);

      if (firebase.auth().currentUser) {
        firebase.auth().currentUser.reauthenticateWithCredential(credential).then(() => {
          firebase.auth().currentUser.delete().then(() => {
            resolve();
          }).catch((error) => {
            reject(error);
          });
        }).catch((error) => {
          reject(error);
        });
      } else {
        reject({code: "Currently no user logged in."});
      }
    });
  }
}
