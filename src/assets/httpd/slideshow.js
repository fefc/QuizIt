/* Initializes js by searching for all slideshows on the current page, and setting active silde to 0 */
jQuery(function($) {
    $(document).ready(function($) {

        $('[id^="avatar-selector-"]').each(function() {
            $(this).data('current-slide', 0);

            $(this).find('.next').each(function() {
                $(this).click(next);
            });

            $(this).find('.previous').each(function() {
                $(this).click(previous);
            });

            gotToSlide($(this), 0);
        });
    });

    function next() {
        gotToSlide($(this).parent().parent(), $(this).parent().parent().data('current-slide') + 1);
    }

    function previous() {
        gotToSlide($(this).parent().parent(), $(this).parent().parent().data('current-slide') - 1);
    }

    function gotToSlide(slideshow, n) {
        var slides = slideshow.find('.slide');
        var avatar;

  	    if (n >= slides.length)
  	        n = 0;

  	    if (n < 0)
  	        n = slides.length - 1;

        slides.each(function(i) {
            if ( i == n ) {
                $(this).css('display', 'block');
                avatar = $(this).attr('caption');
            }
            else
                $(this).css('display', 'none');
        });

        slideshow.data('current-avatar', avatar);
        slideshow.data('current-slide', n);
    }
});
