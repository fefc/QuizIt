var playerUuid;
var nickname;
var avatar;

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

          $('#bar-avatar').css('background-image', "url('imgs/" + avatar + "')");
          $('#bar-nickname').html(nickname);

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
    $.post('/answer', {uuid: playerUuid, answer: answer}, function(data, status){
      if (data.success) {
        $('#answers').children('div').each(function(index) {
          if (index != answer) {
            $(this).addClass('disabled');
          }
        });
        setTimeout(() => {
          $('#answers').children('div').each(function() {
            $(this).removeClass('disabled');
          });
        }, data.remainingMillis);
      }
    }).fail(function(response) {
      console.log(response.responseText);
    });
  }
});
