import * as firebase from "firebase/app";
import 'firebase/firestore';

import { Injectable } from '@angular/core';

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
      if (profile.email !== savedUserProfile.email) changes.email = profile.email;
    } else {
      //A creation of a category
      changes.nickname = profile.nickname;
      changes.avatar = profile.avatar;
      changes.email = profile.email;
    }

    if (Object.keys(changes).length === 0) return undefined;
    else return changes;
  }

  loadFromOnline() {
    return new Promise((resolve, reject) => {
      firebase.firestore().collection('U').doc(this.authProv.getUser().uid).get().then((profileDoc) => {
        let profileData = profileDoc.data();

        let profile: UserProfile = {
          uuid: profileData.id,
          nickname: profileData.nickname,
          avatar: profileData.avatar,
          email: profileData.email
        };

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
}
