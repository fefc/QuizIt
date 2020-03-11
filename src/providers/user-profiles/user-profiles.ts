import * as firebase from "firebase/app";
import 'firebase/firestore';

import { Injectable } from '@angular/core';
import { Observable } from "rxjs/Observable"

import { AuthenticationProvider } from '../authentication/authentication';

import { UserProfile } from '../../models/user-profile';

@Injectable()
export class UserProfilesProvider {
  public profiles: Array<UserProfile>;

  constructor(private authProv: AuthenticationProvider) {
    this.profiles = new Array<UserProfile>();
  }

  getPropertiesChanges(profile: UserProfile) {
    let savedUserProfile: UserProfile = this.profiles.find((p) => p.uuid === profile.uuid);
    let changes: any = {};

    if (savedUserProfile) {
      //An update on a category
      if (profile.nickname !== savedUserProfile.nickname) changes.nickname = profile.nickname;
      if (profile.avatar !== savedUserProfile.avatar) changes.avatar = profile.avatar;
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

          if(this.profiles.length > 0) {
            this.profiles[0] = profile;
          } else {
            this.profiles.push(profile);
          }

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

        if(this.profiles.length > 0) {
          this.profiles[0] = profile;
        } else {
          this.profiles.push(profile);
        }

        resolve();
      }).catch((error) => {
        console.log(error);
        reject('Could not get quizes');
      });
    });
  }

  saveToOnline(profile: UserProfile) {
    return new Promise((resolve, reject) => {
      let changes = this.getPropertiesChanges(profile);

      console.log(changes);

      if (changes) {
        firebase.firestore().collection('U').doc(this.authProv.getUser().uid).update(changes).then(() => {

          if(this.profiles.length > 0) {
            this.profiles[0] = profile;
          } else {
            this.profiles.push(profile);
          }

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
        //console.log(profileDoc.data());

        let profileData = profileDoc.data();

        var source = profileDoc.metadata.hasPendingWrites ? "Local" : "Server";
        console.log(source, " data: ", profileData);

        if (source === "Server") {
          this.profiles[0].avatar = profileData.avatar;
          this.profiles[0].nickname = profileData.nickname;
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
}
