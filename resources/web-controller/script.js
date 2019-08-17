var args;

var game;
var player;

var GameState = {
  playersJoining: 1,
  loading: 2,
  ended: 3,
  connectionLost: 4,
  quickedOut: 5,
  classicQuestionDisplayed: 100,
  pictureQuestionDisplayed: 101
};

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDR9qWel2I2_PCpZwn_crw-SH-uAug5zIw",
  authDomain: "quizpad-ff712.firebaseapp.com",
  databaseURL: "https://quizpad-ff712.firebaseio.com",
  projectId: "quizpad-ff712",
  storageBucket: "quizpad-ff712.appspot.com",
  messagingSenderId: "699661197913",
  appId: "1:699661197913:web:2abeed2df8580fa9"
};

jQuery(function($) {

  $(document).ready(function() {
    // Initialize Firebase
    firebase.initializeApp(FIREBASE_CONFIG);

    args = location.search.replace('?', '').split('&').map(function(val){
      return val.split('=');
    });

    if (args[0][0] != 'id' && args[0][1] == undefined) {
      $('#controller-nickname').html('Error');
      $('#player').css('display', 'none');
      $('#controller').css('display', 'flex');
      displaytext("QR code not recognized please try again.");
    } else {
      game = {
        uuid: args[0][1]
      };
    }
  });

  $('#nickname').on('input', function() {
    if ($(this).val().length > 2 && $(this).val().length < 17) {
      $('#join-quiz').prop('disabled', false);
    } else {
      $('#join-quiz').prop('disabled', true);
    }
  });

  $('#join-quiz').click(function(e) {
      e.preventDefault();

      var nickname = $('#nickname').val();
      var avatar = '';

      const joinGameFirebase = firebase.functions().httpsCallable('joinGame');

      joinGameFirebase({G: game.uuid, P: {N: nickname, A: avatar}}).then(result => {
        if (result.data.uuid) {
          //We got a player id from firebase, good to go
          game = {
            uuid: game.uuid,
            state : GameState.playersJoining
          }

          player = {
            uuid: result.data.uuid,
            nickname: nickname,
            avatar: avatar,
            answer: -1,
            stats: {
              position: 0,
              points: 0
            }
          }

          //Subscribe to firebase gameState event
          firebase.firestore().collection('G').doc(game.uuid).onSnapshot(docSnapshot => {
            //When game state changes we can also reset answers
            player.answer = -1;

            if (docSnapshot.exists) {
              game.state = docSnapshot.data().S;
            } else {
              game.state = GameState.ended;
            }

            if (game.state == GameState.playersJoining) {
              displaytext("The game will start soon...");
            } else if (game.state == GameState.loading) {
              displaytext("Loading...");
            } else if (game.state == GameState.ended) {
              displaytext("That's it, thanks for playing!");
              unsubscribeFirestore();
            } else if (game.state == GameState.quickedOut) {
              displaytext("You have been quicked out by the admin.");
              unsubscribeFirestore();
            } else if (game.state == GameState.classicQuestionDisplayed) {
              displayAnswers(false);
            } else if (game.state == GameState.pictureQuestionDisplayed) {
              displayAnswers(true);
            }
          });

          //Update graphics
          $('#controller-nickname').html(player.nickname);
          $('#player').css('display', 'none');
          $('#controller').css('display', 'flex');
        } else {
          if (result.data.error) {
            if (result.data.error == 20) {
              alert('Your nickname is already used by someone else, please change it just for now.');
            } else {
              alert('Unable to join quiz, error: ' + result.data.error);
            }
          } else {
              alert('Unable to join quiz, error: ' + 50);
          }
        }
      }).catch(error => {
        alert("Unable to create game online.");
        console.log(error);
      });
  });

  $('#answers').children('div').each(function(index) {
      $(this).click(function(e) {
        if (index < 4) {
          setAnswer(index);
        } else {
          setAnswer(100);
        }
      });
  });

  function displaytext(message) {
    $('#answers').css('display', 'none');
    $('#texts').css('display', 'flex');
    $('#texts').html(message);
  }

  function displayAnswers(buzzer) {
    $('#answers').css('display', 'flex');
    $('#texts').css('display', 'none');

    if (buzzer) {
      //its a buzzer question
      $('#answers').children('div').each(function(index) {
        $(this).removeClass('disabled');
        if (index != 4) {
          $(this).css('display', 'none');
        } else {
          $(this).css('display', 'block');
        }
      });
    } else {
      $('#answers').children('div').each(function(index) {
        $(this).removeClass('disabled');
        if (index != 4) {
          $(this).css('display', 'block');
        } else {
          $(this).css('display', 'none');
        }
      });
    }
  }

  function setAnswer(answerIndex) {
    if (player.answer == -1) {
      firebase.firestore().collection('G').doc(game.uuid).collection('P').doc(player.uuid).update({I: answerIndex}).then(() => {
        player.answer = answerIndex;

        //Update display
        $('#answers').children('div').each(function(divIndex) {
          if (divIndex != answerIndex) {
            $(this).addClass('disabled');
          }
        });

      }).catch(error => {
        alert("Unable to set player answer online.");
      });
    }
  }

  function unsubscribeFirestore() {
    let unsubGame = firebase.firestore().collection('G').doc(game.uuid).onSnapshot(() => {});
    unsubGame();

    let unsubPlayer = firebase.firestore().collection('G').doc(game.uuid).collection('P').doc(player.uuid).collection('L').doc('S').onSnapshot(() => {});
    unsubPlayer();
  }
});
