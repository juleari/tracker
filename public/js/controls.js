(function(){
    $('.e-control').addClass('e-control_transition')
    
    var save = function() {
        var people = $('.js-changed').parent().parent(),
            dat    = [];

        for (i = 0; i < people.length; i ++) {
            
            dat[i] = {
              id   : people.eq(i).children('.b-user__id').html(),
              admin: people.eq(i).children('.b-user__admin').children('.e-control').is('.e-control_on')
            }
        }
        
        ajax($('.b-people').attr('url'), {'change': JSON.stringify(dat)}, function(){
            
            console.log('success', arguments);
            $('#save').addClass('none');
            $('.js-changed').removeClass('js-changed');
            $('.e-img').addClass('none');
            $('.e-ok').removeClass('none');
        
        }, function(){
            
            console.log('error', arguments);
            $('.e-img').addClass('none');
            $('.e-err').removeClass('none');
        });
    }

    $(document).on('click', '.e-control', function(){
        var th      = $(this),
            checked = th.is('.e-control_on'),
            changed = th.is('.js-changed');
          
        //localStorage["notify"] = !checked;
        $('#save').removeClass('none');

        (checked) ?
            th.removeClass('e-control_on') :
            th.addClass('e-control_on');

        (changed) ?
            th.removeClass('js-changed') :
            th.addClass('js-changed');

        $('.e-ok').addClass('none');
        $('.e-err').addClass('none')
    });

    $(document).on('click',  '#save', save)
})();