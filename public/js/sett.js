(function(){
    $('.e-control_click').addClass('e-control_transition');

    for (var i = 0; i < $('.js-default select').length; i++) {

        $('.js-default select').eq(i).attr('val', $('.js-default select').eq(i).val());
    }

    var lang_code = $('.js-language_default').val();

    function save_pass(user__pass) {
        console.log('save_pass')

        ajax('/change_pass', 
            {old_pass: user__pass.find('#js-old_pass').val(), new_pass: user__pass.find('.js-new_pass').val()}, 
            function(){
                console.log('success');
                user__pass.find('.b-button').addClass('none');
                user__pass.find('.input_error').removeClass('input_error');
                user__pass.find('input').val('');
            },
            function(){
                if (arguments[0][0].toString() != '500') {

                    user__pass.find('.js-old_pass').addClass('input_error');
                    user__pass.find('.b-button').removeClass('disabled');
                
                } else {

                    user__pass.find('.b-button').removeClass('disabled');
                } 
        });
    }

    function change_search(user__search) {
        console.log('change_search');

        var checkbox   = user__search.find('input[type="checkbox"]'),
            search_opt = [];

        for (var i = 0; i < checkbox.length; i++) {

            if (checkbox.eq(i).prop('checked')) {

                search_opt.push(checkbox.eq(i).attr('search_option'))
                $('[search_option="' + checkbox.eq(i).attr('search_option') + '"]').removeAttr('checked')
            
            } else {

                $('[search_option="' + checkbox.eq(i).attr('search_option') + '"]').attr('checked', 'checked')
            }
        }

        ajax('/ch_user_search',
            {data: JSON.stringify(search_opt)}, function(){

                console.log('success');
                user__search.find('.b-button').addClass('none');
                user__search.find('.b-button').removeClass('disabled');
                user__search.find('.js-changed').removeClass('js-changed');

            }, function(){

                user__search.find('.b-button').removeClass('disabled')
            });
    }

    function change_mess(user__mess) {
        console.log('change_mess');

        var checkbox   = user__mess.find('input[type="checkbox"]'),
            search_opt = [];

        for (var i = 0; i < checkbox.length; i++) {

            if (checkbox.eq(i).prop('checked')) {

                search_opt.push(checkbox.eq(i).attr('field_name'))
                $('[field_name="' + checkbox.eq(i).attr('field_name') + '"]').removeAttr('checked')
            
            } else {

                $('[field_name="' + checkbox.eq(i).attr('field_name') + '"]').attr('checked', 'checked')
            }
        }

        ajax('/ch_user_mess',
            {data: JSON.stringify(search_opt)}, function(){

                console.log('success');
                user__mess.find('.b-button').addClass('none');
                user__mess.find('.b-button').removeClass('disabled');
                user__mess.find('.js-changed').removeClass('js-changed');
            }, function(){

                user__mess.find('.b-button').removeClass('disabled')
            });
    }

    function change_mess_firm(firm__mess) {
        console.log('change_mess_firm');

        var value = firm__mess.find('input:checked').val(),
            field = firm__mess.parents('.sett__task__block').attr('id');

        ajax('/change_mess', {field: field, value: value}, function(){

            console.log('success');
            firm__mess.find('.b-button').addClass('none').removeClass('disabled');
        }, function(){

            console.log('error', arguments[0][0]);
            firm__mess.find('.b-button').removeClass('disabled');
        })
    }

    function change_rights(sett__rights) {

        var value = sett__rights.find('input:checked').val(),
            field = sett__rights.parents('.sett__task__block').attr('id');

        ajax('/change_rights', {field: field, value: value}, function(){

            console.log('success');
            sett__rights.find('.b-button').addClass('none').removeClass('disabled');
        }, function(){

            console.log('error', arguments[0][0]);
            sett__rights.find('.b-button').removeClass('disabled');
        })
    }

    $(document).on('change', 'input[name="task__to"]', function() {

        ($(this).val() == 'user') ?
            $('select#task__to_user').removeAttr('disabled') :
            $('select#task__to_user').attr('disabled', '')

        if ($(this).val() == 'from') {

            var data  = {field: 'to', default_type: 'from', default: 'from'};

            ajax('/change_default', data, function(){

                console.log('success');
            }, function(){

                console.log('error', arguments[0][0]);
            })
        }
    });

    $(document).on('change', 'input[type="radio"]', function() {
        
        var num = $(this).attr('number');
        $(this).parent().children('.e-control').removeClass('e-control_0').removeClass('e-control_1').removeClass('e-control_2').removeClass('e-control_3').removeClass('e-control_4').removeClass('e-control_5').addClass('e-control_' + num);
    });

    $('.sett__task__choose').on('change', 'input[type="checkbox"]', function() {
        
        var th = $(this).parent().children('.e-control'),
            checked = th.is('.e-control_on'),
            changed = th.is('.js-changed'),
            add = $(this).parents('.sett__task__add');
          
        //localStorage["notify"] = !checked;
        add.children('.b-button').removeClass('none');

        (checked) ?
            th.removeClass('e-control_on') :
            th.addClass('e-control_on');

        (changed) ?
            th.removeClass('js-changed') :
            th.addClass('js-changed');

        $('.e-ok').addClass('none');
        $('.e-err').addClass('none')
    });

    $(document).on('click', '.e-control_click', function(){

        if ($(this).is('.e-control_vertical'))
            return;

        var th      = $(this),
            div_ch  = th.parents('.sett__task__change'),
            checked = th.is('.e-control_on'),
            changed = th.is('.js-changed');
          
        //localStorage["notify"] = !checked;
        div_ch.find('.b-button').removeClass('none');

        (checked) ?
            th.removeClass('e-control_on') :
            th.addClass('e-control_on');

        if (th.parent().is('.sett__label_main')) {
          
            if (checked) {

                var block = th.parent().parent();
                block.addClass('sett__task__block_disabled');

                var div = block.children('div');
                div.find('.e-control_click').removeClass('e-control_click');
                div.find('input').attr('disabled', '');
                div.find('select').attr('disabled', '');

            } else {

                var block = th.parent().parent();
                block.removeClass('sett__task__block_disabled');

                var div = block.children('div');

                div.find('.e-control_transition').addClass('e-control_click');
                div.find('input').removeAttr('disabled');
                div.find('select').removeAttr('disabled');
            }

            ajax('/change_fields', {field: block.attr('id'), value: !checked}, function(){

                console.log('success');
            }, function(){

                console.log(arguments[0][0])
            })
        }

        (changed) ?
            th.removeClass('js-changed') :
            th.addClass('js-changed');

        if (!div_ch.find('.js-changed').length) div_ch.find('.b-button').addClass('none');


        $('.e-ok').addClass('none');
        $('.e-err').addClass('none');
    });

    $(document).on('keyup', '.js-repeat', function(){

        if ($(this).val() != $(this).parents('.sett__task__change').find('.js-new_pass').val()) {
            
            $(this).addClass('input_error');
            $(this).parents('.sett__task__change').find('.b-button').addClass('disabled none');

        } else {

            $(this).removeClass('input_error');
            $(this).parents('.sett__task__change').find('.b-button').removeClass('disabled none');
        }
    });

    $(document).on('click', '.b-button', function(){

        var th  = $(this),
            div = th.parents('.sett__task__change');

        if (th.is('.disabled'))
            return;

        th.addClass('disabled');

        switch (div.attr('id')) {

            case 'user__pass' :

                save_pass(div);
                break;

            case 'user__search' :

                change_search(div);
                break;

            case 'user__mess' :

                change_mess(div);
                break;

            case 'js-rights' :

                change_rights(div);
                break;

            case 'js-mess' :

                change_mess_firm(div);
                break;

            default:

                console.log('no switch');
                break;
        }
    });

    $(document).on('change', '.js-language_default', function(){

        var lang_code_new = $(this).val();

        console.log(lang_code_new)

        ajax('/change_user_lang', {lang_code: lang_code_new}, function(){

            $('.js-language_default').val(lang_code_new);
            $('.settings').addClass('none');
            $('.settings[lang_code="' + lang_code_new + '"]').removeClass('none');
            lang_code = lang_code_new;

        }, function(){

            $('.js-language_default').val(lang_code);
        });
    });

    $(document).on('change', '.js-default select', function(){

        var th    = $(this),
            value = th.val(),
            field = th.parents('.sett__task__block').attr('id'),
            data  = {field: field, value: value};
        th.attr('disabled', '');

        if (th.is('#task__to_user')) {

            data.value = $('input[name="task__to"]:checked').val();

            if (data.value == 'user') {

                data.value = value;
                data.default_type = th.find('option:selected').attr('colls');
            } else {

                data.default_type = 'from';
            }
        }

        ajax('/change_default', data, function(){

            console.log('success');
            th.attr('val', value);
            th.removeAttr('disabled');
        }, function(){

            console.log('error', arguments[0][0]);
            th.removeAttr('disabled');
            th.val($(this).attr('val'));
        })
    });

    $(document).on('change', '.js-rights input[type="radio"]', function(){

        var th      = $(this),
            div_ch  = th.parents('.sett__task__change'),
            checked = th.is('.e-control_on'),
            changed = th.is('.js-changed');
          
        //localStorage["notify"] = !checked;
        div_ch.find('.b-button').removeClass('none');

        (checked) ?
            th.removeClass('e-control_on') :
            th.addClass('e-control_on');

        if (th.parent().is('.sett__label_main')) {
          
            if (checked) {

                var block = th.parents('.sett__task__block');
                block.addClass('sett__task__block_disabled');

                var div = block.children('div');
                div.find('.e-control_click').removeClass('e-control_click');
                div.find('input').attr('disabled', '');
                div.find('select').attr('disabled', '');

            } else {

                var block = th.parents('.sett__task__block');
                block.removeClass('sett__task__block_disabled');

                var div = block.children('div');

                div.find('.e-control_transition').addClass('e-control_click');
                div.find('input').removeAttr('disabled');
                div.find('select').removeAttr('disabled');
            }
        }

        (changed) ?
            th.removeClass('js-changed') :
            th.addClass('js-changed');

        if (!div_ch.find('.js-changed').length) div_ch.find('.b-button').addClass('none');


        $('.e-ok').addClass('none');
        $('.e-err').addClass('none');
    });

    $(document).on('change', '.js-mess input[type="radio"]', function(){

        console.log($(this));

        var th      = $(this),
            div_ch  = th.parents('.sett__task__change'),
            checked = th.is('.e-control_on'),
            changed = th.is('.js-changed');

        div_ch.find('.b-button').removeClass('none');

        (checked) ?
            th.removeClass('e-control_on') :
            th.addClass('e-control_on');

        (changed) ?
            th.removeClass('js-changed') :
            th.addClass('js-changed');

        if (!div_ch.find('.js-changed').length) div_ch.find('.b-button').addClass('none');

        $('.e-ok').addClass('none');
        $('.e-err').addClass('none');
    });
    
})();