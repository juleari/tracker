(function(){

    var registr = function(){
        
        var name   = $('#reg_name'),     name_v = name.val(),
            firm   = $('#reg_firm'),     firm_v = firm[0] ? firm.val() : undefined,
            sname  = $('#reg_surname'),  sname_v= sname.val(),
            email  = $('#reg_email'),    email_v= email.val(),
            emre   = /(.+)@(.+)\.(.+)/i,
            pass   = $('#reg_password'), pass_v = pass[0] ? pass.val() : undefined,
            admin  = $('#reg_admin')[0] ? $('#reg_admin').prop('checked') : undefined,
            url, data = {}, after;

        $('input').removeClass('input_error');

        if (firm[0] && !firm_v) {
            
            firm.addClass('input_error');
            firm.focus();
            return  
        }
        
        if ( !email_v || !emre.test(email_v) ) {
            
            email.addClass('input_error');
            email.focus();
            return  
        }

        if ( pass[0] && !pass_v ) {
            
            pass.addClass('input_error');
            pass.focus();
            return
        }

        if ( !name_v ) {
            
            name.addClass('input_error');
            name.focus();
            return
        }

        if ( !sname_v ) {
            
            s_name.addClass('input_error');
            s_name.focus();
            return
        }

        if (firm_v) {
            
            url = 'reg_firm';
            data = {
                firm    : firm_v,
                name    : name_v,
                surname : sname_v,
                email   : email_v,
                password: pass_v 
            };
            after = '/sett_admin';
        
        } else {
            
            url = 'reg_user';
            data = {
                name    : name_v,
                surname : sname_v,
                email   : email_v,
                admin   : admin 
            };
            after = '/people';
        }

        ajax(url, data, function(){
        
            console.log('success', arguments);
            location.replace(after);
        
        }, function(){
          
            console.log('error', arguments);
            $('#auth_email').addClass('input_error');
            $('#auth_password').addClass('input_error');
            
            if (arguments[2] != 'Unauthorized') {
                $('.error').removeClass('none')
            }

        });
    }

    var auth = function(){
        var email  = $('#auth_email'),    email_v= email.val(),
            emre   = /(.+)@(.+)\.(.+)/i,
            pass   = $('#auth_password'), pass_v = pass.val(),
            rem    = $('#auth_remember').prop('checked'),
            url, data = {};

        $('input').removeClass('input_error');

        if ( !email_v || !emre.test(email_v) ) {
            
            email.addClass('input_error');
            email.focus();
            return  
        }

        if ( !pass_v ) {
            
            pass.addClass('input_error');
            pass.focus();
            return
        }

        ajax('/auth', {email: email_v, password: pass_v, remember: rem }, function(){
            
            console.log('success', arguments);
            location.replace('/home');
        
        }, function(){
            
            console.log('error', arguments);
            $('#auth_email').addClass('input_error');
            $('#auth_password').addClass('input_error');
            
            if (arguments[2] != 'Unauthorized') {
                $('.error').removeClass('none')
            }
        });
    }

    $(document).on('keydown', '.input_error', function(){ $(this).removeClass('input_error') });
    $(document).on({ click: registr }, '#reg_send');
    $(document).on({ click: auth }, '#auth_send');
    $(window).keypress (function(e){
        
        if (e.keyCode == 13) {
            
            if ($('#auth_send')[0]) auth();          
            if ($('#reg_send')[0]) registr();
        }
    });

})();