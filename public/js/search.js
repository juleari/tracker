(function(){
    $('.e-control_click').addClass('e-control_transition');

    var proj = function(id) {

        var results = $('.search__results tr');

        for (var i = 0; i < results.length; i++) {

            if (results.eq(i).find('.proj').text() == id) {

                results.eq(i).removeClass('none')
            }
        }
    }

    var unproj = function(id) {

        var results = $('.search__results tr');

        for (var i = 0; i < results.length; i++) {

            if (results.eq(i).find('.proj').text() == id) {

                results.eq(i).addClass('none')
            }
        }
    }

    var choose = function(coll) {

        results = $('.search__results tr.' + coll).removeClass('none');
    }

    var unchoose = function(coll) {

        results = $('.search__results tr.' + coll).addClass('none');
    }
    
    $('.search__sett__query').on('keypress', function(e){
        
        if (e.keyCode == 13) {

            var query = $(this).val();
            
            ajax('search_' + query, '', function(result){
                console.log(result);
                $('html').html(result);
            });
        }
    });

    $('input[type="checkbox"]').on('change', function() {
        
        var th = $(this).parent('.e-control'),
            checked = th.is('.e-control_on');

        if (checked) {
            
            th.removeClass('e-control_on');

            if (th.parents('.js-choose')[0]) unchoose( (th.is('.comments') ? 'comments': 'tasks') )

            if (th.parents('.js-projs')[0] && !th.find('.all')[0]) unproj(th.find('.id').eq(0).text())
            
        } else {

            th.addClass('e-control_on');

            if (th.parents('.js-choose')[0]) choose( (th.is('.comments') ? 'comments': 'tasks') )

            if (th.parents('.js-projs')[0] && !th.find('.all')[0]) proj(th.find('.id').eq(0).text())

            if (th.find('.all')[0]) $('.projs .e-control input').removeAttr('checked')

        }

        $('.e-ok').addClass('none');
        $('.e-err').addClass('none')
    });

})();