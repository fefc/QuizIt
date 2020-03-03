import * as firebase from "firebase/app";
import 'firebase/auth';

import { Injectable } from '@angular/core';

@Injectable()
export class AuthenticationProvider {

  constructor() {

  }

  getUser() {
    if (firebase.auth().currentUser) {
      return firebase.auth().currentUser;
    } else {
      return undefined;
    }
  }

  updateUserProfile(nickname: string, avatar: string) {
    return new Promise((resolve, reject) => {
      if (firebase.auth().currentUser) {
        firebase.auth().currentUser.updateProfile({
          displayName: nickname,
          photoURL: avatar
        }).then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        })
      } else {
        reject({code: "Currently no user logged in."});
      }
    });
  }

  updatePassword(email: string, password: string, newPassword: string) {
    return new Promise((resolve, reject) => {
      let credential = firebase.auth.EmailAuthProvider.credential(email, password);

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

  login(email: string, password: string) {
    return new Promise<any>((resolve, reject) => {
      firebase.auth().signInWithEmailAndPassword(email, password).then((additionalUserInfo) => {
        resolve(additionalUserInfo.user);
      }).catch((error) => {
        reject(error);
      });
    });
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

  createAccount(email: string, password: string) {
    return new Promise<any>((resolve, reject) => {
      firebase.auth().createUserWithEmailAndPassword(email, password).then((additionalUserInfo) => {
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
