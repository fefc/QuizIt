var playerUuid;
var nickname;
var avatar;

var currentQuestionUuid;
var currentQuestionType;
var answered;
var checkQuestionType;

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
      avatar = $('#avatar-selector-0').data('current-avatar') + '.png';

      $.post('/addPlayer', {nickname: nickname, avatar: avatar}, function(data, status){
        if (data.uuid) {
          playerUuid = data.uuid;

          currentQuestionUuid = "";
          currentQuestionType = 0;
          answered = false;

          checkQuestionType = setInterval(gameState, 300);

          $('#controller-avatar').css('background-image', "url('imgs/" + avatar + "')");
          $('#controller-nickname').html(nickname);

          $('#player').css('display', 'none');
          $('#controller').css('display', 'flex');
        } else {
          alert("Is your nickname or avatar already used?");
        }
      }).fail(function(response) {
        console.log(response.responseText);
      });
  });

  $('#answers').children('div').each(function(index) {
      $(this).click(function(e) {
        sendAnswer(index);
      });
  });

  function sendAnswer(answer) {
    if (answered == false) {
      $.post('/answer', {uuid: playerUuid, answer: answer}, function(data, status){
        console.log(data);
        if (data.success) {
          answered = true;

          if (currentQuestionType == 2) {
            $('#answers').children('div').each(function(index) {
                $(this).addClass('disabled');
            });
          } else {
            $('#answers').children('div').each(function(index) {
              if (index != answer) {
                $(this).addClass('disabled');
              }
            });
          }
        }
      }).fail(function(response) {
        console.log(response.responseText);
      });
    }
  }

  function gameState() {
    $.post('/gameState', {uuid: playerUuid}, function(data, status){
      if (data.gameState === 0) {
        $('#answers').css('display', 'none');
        $('#texts').css('display', 'flex');
        $('#texts').html("The game will start soon...");

      } else if (data.gameState === 1) {
        $('#answers').css('display', 'flex');
        $('#texts').css('display', 'none');

        if (data.uuid != currentQuestionUuid) {
          currentQuestionUuid = data.uuid;
          currentQuestionType = data.type;
          answered = false;

          if (currentQuestionType == 2) {
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
      } else if (data.gameState === 2) {
        clearInterval(checkQuestionType);

        $('#answers').css('display', 'none');
        $('#texts').css('display', 'flex');
        $('#texts').html("Game is finished!");

      } else if (data.gameState === 3) {
        $('#answers').css('display', 'none');
        $('#texts').css('display', 'flex');
        $('#texts').html("Loading...");
      }
    }).fail(function(response) {
      clearInterval(checkQuestionType);
      console.log(response.responseText);
    });
  }
});
