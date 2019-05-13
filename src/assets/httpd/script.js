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

<<<<<<< HEAD
          checkQuestionType = setInterval(questionType, 1000);
=======
          //checkQuestionType = setInterval(questionType, 1000);
>>>>>>> 406ce4488182607cfab5e778c1f9238d65db295e

          $('#controller-avatar').css('background-image', "url('imgs/" + avatar + "')");
          $('#controller-nickname').html(nickname);

          $('#player').css('display', 'none');
          $('#controller').css('display', 'flex');
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

  function questionType() {
    $.post('/questionType', {uuid: playerUuid}, function(data, status){
      console.log(data);
      if (!data.end) {
        if (data.uuid) {
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
        }
      } else {
        clearInterval(checkQuestionType);
        $('#answers').children('div').each(function(index) {
          $(this).css('display', 'none');
        });
      }
    }).fail(function(response) {
      clearInterval(checkQuestionType);
      console.log(response.responseText);
    });
  }
});
