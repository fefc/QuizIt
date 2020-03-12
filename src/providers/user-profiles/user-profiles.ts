import * as firebase from "firebase/app";
import 'firebase/firestore';
import 'firebase/storage';

import { Injectable } from '@angular/core';
import { Observable } from "rxjs/Observable"
import { File } from '@ionic-native/file';

import { AuthenticationProvider } from '../authentication/authentication';

import { UserProfile } from '../../models/user-profile';

@Injectable()
export class UserProfilesProvider {
  public profile: UserProfile;

  constructor(private file: File, private authProv: AuthenticationProvider) {
    this.profile = {
      uuid: '',
      nickname: '',
      avatar: ''
    };
  }

  getPropertiesChanges(profile: UserProfile) {
    let changes: any = {};

    if (this.profile.uuid === profile.uuid) {
      //An update on a category
      if (profile.nickname !== this.profile.nickname) changes.nickname = profile.nickname;
      if (profile.avatar !== this.profile.avatar) changes.avatar = profile.avatar;
    } else {
      //A creation of a category
      changes.nickname = profile.nickname;
      changes.avatar = profile.avatar;
    }

    if (Object.keys(changes).length === 0) return undefined;
    else return changes;
  }

  createOnline(profile: UserProfile) {
    return new Promise((resolve, reject) => {
      let changes = this.getPropertiesChanges(profile);

      if (changes) {
        firebase.firestore().collection('U').doc(profile.uuid).set(changes).then(() => {
          this.profile = profile;
          resolve();
        }).catch((error) => {
          console.log(error);
          reject(error);
        });
      } else {
        resolve();
      }
    });
  }

  loadFromOnline() {
    return new Promise((resolve, reject) => {
      firebase.firestore().collection('U').doc(this.authProv.getUser().uid).get().then((profileDoc) => {
        let profileData = profileDoc.data();
        let profile: UserProfile;

        if (profileData) {
          profile = {
           uuid: this.authProv.getUser().uid,
           nickname: profileData.nickname,
           avatar: profileData.avatar,
         };
        } else {
          profile = {
           uuid: this.authProv.getUser().uid,
           nickname: '',
           avatar: '',
         };
        }

        this.profile = profile;
        resolve();
      }).catch((error) => {
        console.log(error);
        reject('Could not get profile');
      });
    });
  }

  saveToOnline(profile: UserProfile) {
    return new Promise((resolve, reject) => {
      let changes = this.getPropertiesChanges(profile);

      if (changes) {
        firebase.firestore().collection('U').doc(this.authProv.getUser().uid).update(changes).then(() => {
          this.profile = profile;
          resolve();
        }).catch((error) => {
          console.log(error);
          reject(error);
        });
      } else {
        resolve();
      }
    });
  }

  profileChanges() {
    return new Observable<boolean>(observer => {
      const unsubscribe = firebase.firestore().collection('U').doc(this.authProv.getUser().uid).onSnapshot((profileDoc) => {
        let profileData = profileDoc.data();

        var source = profileDoc.metadata.hasPendingWrites ? "Local" : "Server";
        console.log(source, " data: ", profileData);

        if (source === "Server") {
          this.profile.avatar = profileData.avatar;
          this.profile.nickname = profileData.nickname;
        }

        /*if (user) {
          // User is signed in.
          observer.next(true);
        } else {
          // No user is signed in.
          observer.next(false);
        }*/
      });

      return () => {
        unsubscribe();
      };
    });
  }

  uploadFileOnline(profileUuid: string, fullLocalPath: string) {
    return new Promise((resolve, reject) => {
      var indexOfSlash: number = fullLocalPath.lastIndexOf('/') + 1;
      var sourceDir = fullLocalPath.substring(0, indexOfSlash);
      var fileName = fullLocalPath.substring(indexOfSlash);

      this.file.readAsArrayBuffer(sourceDir, fileName).then((arrayBuffer) => {
        var fileRef = firebase.storage().ref().child(profileUuid + '/' + fileName);

        fileRef.put(arrayBuffer).then(() => {
          resolve(fileName);
        }).catch((error) => {
          reject(error);
        });
      }).catch((error) => {
        reject(error);
      });
    });
  }
}
