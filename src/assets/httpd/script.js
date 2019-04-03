var playerUuid;

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

      let nickname = $('#nickname').val();
      let avatar = $('#avatar-selector-0').data('current-avatar') + ".png";

      console.log(avatar);

      $.post("/addPlayer", {nickname: nickname, avatar: avatar}, function(data, status){
        console.log(data);

        if (data.uuid) {
          playerUuid = data.uuid;

          jQuery('<canvas/>', {style: "background-image: url('imgs/" + avatar + "')"}).prop({width: 1, height: 1}).appendTo('#bar');

          jQuery('<div/>', {
              class: 'bar-title',
              html: nickname
          }).appendTo('#bar');

          $('#player-config').css('display', 'none');
          $('#player-controller').css('display', 'block');
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
    $.post("/answer", {uuid: playerUuid, answer: answer}, function(data, status){
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
