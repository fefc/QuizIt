var playerUuid;
var nickname;
var currentQuestionType;
var answer;
var checkQuestionTypeInterval;
var gameStateErrorCounter;

jQuery(function($) {
  $('#nickname').on('input', function() {
    if ($(this).val().length > 2 && $(this).val().length < 17) {
      $('#join-quiz').prop('disabled', false);
    } else {
      $('#join-quiz').prop('disabled', true);
    }
  });

  $('#join-quiz').click(function(e) {
      e.preventDefault();
      nickname = $('#nickname').val();

      $.post('/addPlayer', {nickname: nickname, avatar: ''}, function(data, status) {
        if (data.playerUuid) {
          playerUuid = data.playerUuid;

          currentQuestionType = 1;
          answer = -1;

          $.ajaxSetup({
            timeout: 250 //Needs to be smaller than setInterval
          });

          checkQuestionTypeInterval = setInterval(checkGameState, 300);

          //Update graphics
          $('#controller-nickname').html(nickname);
          $('#player').css('display', 'none');
          $('#controller').css('display', 'flex');
        } else {
          alert("Is your nickname or avatar already used?");
        }
      }).fail(function(response) {
        alert("Unable to join game.");
      });
  });

  $('#answers').children('div').each(function(index) {
      $(this).click(function(e) {
        setAnswer(index);
      });
  });


  function checkGameState() {
    $.post('/gameState', {uuid: playerUuid},
    function(data, status) {
      if (data.state) {
        gameStateErrorCounter = 0;

        gameState = data.state;

        if (gameState == 2) { //GameState questionDisplayed
          currentQuestionType = data.type;

          //Update graphics
          if (answer == -1) {
            $('#answers').css('display', 'flex');
            $('#texts').css('display', 'none');

            if (currentQuestionType == 3) {
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
          //Done updating display
        } else {
          //previousPosition
          //actualPosition

          //points
          answer = -1;

          //Update graphics
          $('#answers').css('display', 'none');
          $('#texts').css('display', 'flex');

          if (gameState == 1) { //playersJoining
            $('#texts').html("The game will start soon...");

          } else if (gameState == 3) { //loading
            $('#texts').html("Loading...");
          } else if (gameState == 4) { //ended
            $('#texts').html("That's it, thanks for playing!");
            clearInterval(checkQuestionTypeInterval);
          }
          //Done updating display
        }
      } else {
        handleGameStateError();
      }
    }).fail(function(response) {
      handleGameStateError();
    });
  }

  function handleGameStateError() {
    if (gameStateErrorCounter <= 3) {
      gameStateErrorCounter += 1;
    } else {
      gameState = 5; //connectionLost
      $('#texts').html("Unable to reach quiz host.");
      clearInterval(checkQuestionTypeInterval);

      var message = confirm("I'm unable to reach quiz host, do you want to retry?");
      if (message == false) {
        gameState = 4; //ended
        $('#texts').html("That's it, thanks for playing!");
      } else {
        gameStateErrorCounter = 0;
        checkQuestionTypeInterval = setInterval(checkGameState, 300);
      }
    }
  }

  function setAnswer(index) {
    if (answer == -1) {
      $.post('/answer', {uuid: playerUuid, answer: index},
      function(data, status){
        if (data.success) {
          answer = index;

          //Update display
          if (currentQuestionType == 3) {
            $('#answers').children('div').each(function(divIndex) {
                $(this).addClass('disabled');
            });
          } else {
            $('#answers').children('div').each(function(divIndex) {
              if (divIndex != answer) {
                $(this).addClass('disabled');
              }
            });
          }
          //Done updating display

        } else {
          alert("could not set answer, please try again.");
        }
      }).fail(function(response) {
        alert("could not set answer, please try again.");
      });
    }
  }
});
