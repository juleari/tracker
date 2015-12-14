(function(){
    var doc = $(document);

    doc.on('click', '[type="text"], [type="long_text"]', function(){
        
        var th   = $(this),
            text = th.text(),
            input;

        input = (th.attr('type') == 'text') ?
                $('<input class="b-task__input" value="' + text +'">') :
                $('<textarea class="b-task__input" value="' + text +'">').text(text);
        
        th.parent().removeClass('edit');
        th.html(input);
        input.focus();
        textareaFocus(input);
    });

    doc.on('focusout', '.b-task__input', function(){

        if ($(this).parents('.b-comments').length)
            return;
        
        var input= $(this),
            th   = input.parent(),
            text = input.val(),
            img  = $('<img src="/img/edit.png" class="e-edit e-img opacity">'),
            obj  = {
                id   : $('#id').text(),
                field: th.attr('id'),
                value: text
            };

        th.parent().addClass('load');

        ajax('/task_edit', obj, function() {
          
            console.log('success');
            th.text(text).append(img);
            th.parent().removeClass('load');
            th.parent().addClass('edit');

        }, function() { 
            
            console.log('error: ', arguments[0][0].status);
            th.text(text);

            $('div.alert, .popup').removeClass('none');
            $('div.alert').children().addClass('none');
            
            if ([402, 403, 500].indexOf(arguments[0][0].status) != -1) {
                
                $('div.alert').children('.' + arguments[0][0].status).removeClass('none');

            }
        });
    });

    doc.on('click', '.show_ul>div', function(){

        var ul  = $(this).parent().find('ul'),
            uls = $('.show_ul>ul');

        if (ul.css('display') == 'none') {
            
            ul.parent().removeClass('edit');
            uls.css('display', 'none');
            ul.css('display', 'block');
        
        } else {

            ul.css('display', 'none');
        }
    });

    $('body').on('click', function(e){
      
        var elem = document.elementFromPoint(e.pageX, e.pageY),
            uls  = $('.show_ul>ul');

        if (!($(elem).is('.show_ul>ul>li')) &&
            !($(elem).is('.show_ul>ul'))    && 
            !($(elem).parents('.show_ul').length)) {
        
            uls.css('display', 'none');
        }
    });

   $('div.alert').on('click', function(){ $('div.alert, .popup').addClass('none') });

    doc.on('click', '.show_ul ul li', function(){

        var th    = $(this),
            value = th.find('.id').text() || $(this).find('.value').text(),
            field = th.parents('.show_ul').children('div').attr('id'),
            obj   = {
                id   : $('#id').text(),
                field: field,
                value: value
            };

        th.parents('.show_ul').addClass('load');

        ajax('/task_edit', obj, function() {
          
            console.log('success');
            th.parents('.show_ul').children('div').text(th.find('.text').text());
            th.parent().css('display', 'none');
            th.parents('.show_ul').removeClass('load');
            th.parents('.show_ul').addClass('edit');

        }, function() {

            console.log('error: ', arguments[0][0].status);
            th.parents('.show_ul').children('div').text(th.find('.text').text());

            $('div.alert, .popup').removeClass('none');
            $('div.alert').children().addClass('none');
            
            if ([402, 403, 500].indexOf(arguments[0][0].status) != -1) {
                
                $('div.alert').children('.' + arguments[0][0].status).removeClass('none');

            }
        });
    });

    doc.on('click', '#comm_add', function() {
        
        var th   = $(this),
            text = th.parent().children('textarea').val();
        
        if (th.is('.loading')) return
        else {
            
            th.addClass('.loading');
            th.parent().children('textarea').prop("disabled")
            
            ajax('/add_c', {
                task: $('#id').text(),
                text: text
            }, function() {
                console.log('success');

                var dis  = $('.b-comms').children('.disabled'),
                    args = arguments[0].split('_');
                    comm = $('<div class="b-comm"/>'),
                    title= $('<div class="b-comm__title"/>'),
                    id   = $('<div class="id none js-comm__id">' + args[0] + '</div>'),
                    name = $('#user-name').text(),
                    us_id= $('#user-id').text(),
                    from = $('<div class="b-comm__from">' + name + '</div>');
                    fr_id= $('<div class="id none">' + us_id + '</div>'),
                    txt  = $('<div class="b-comm__text">' + text + '</div>'),
                    date = $('<div class="b-comm__date">' + args[1] + '</div>');
                
                if (dis[0]) dis.remove();

                th.removeClass('loading');
                th.parent().children('textarea').val('');
                th.parent().children('textarea').prop("disabled", false)
                title.append(from, fr_id, date);
                comm.append(title, id, txt);
                $('.b-comms').append(comm);

            }, function() {
                console.log('error: ', arguments);
            });
        }
    });

    doc.on('click', '#attach', function(){

        $('body').scrollTop(0);
        $('#attach_block, .popup').removeClass('none');
    });
    
    var file = function(divInput) {
        
        var p = divInput.children('p'),
            fileName = decodeURIComponent(divInput.children('input').val()).split('\\').pop(),
            files = $('input[type="file"]'),
            filesNum = files.length,
            count = 0; 

        if (fileName) {
          
            p.text(fileName);

            for (var i = 0; i < filesNum; i++) {
                
                if ( !files.eq(i).val() ) break 
                else count++;
            }

            if (count == filesNum) {
                
                divInput.parent().append($('<div class="b-form__input"><p>Выберите файл</p><input id="file' + filesNum + '"class="task_attach" name="file' + filesNum + '" type="file"  multiple="multiple"><img class="image"></div>'));
            }

            $('#count').val(count);
            console.log(count);
        
        } else p.text('Выберите файл');

    }

    function processing_file(divInput) {
        
        var input = divInput.find('input')[0],
            file  = input.files && input.files[0];

        if (file) {

            var reader = new FileReader(),
                type   = file.type;

            reader.onload = function (e) {
                
                if (/image\//mgi.test(type)) divInput.find('.image').attr('src', e.target.result);
            
                //if (type == '' || type == 'text/plain') 
                $(input).attr('content', reader.result);
                //else $(input).attr('content', btoa(reader.result));

            }
      
            if (type == '' || type == 'text/plain') reader.readAsText(file)
            else reader.readAsDataURL(file)
    
        }
  
    }

    function attach() {

        var id     = $('#id').text(),
            files  = $('input[type="file"]'),
            data   = {task: id, count: $('#count').val()};

        for (var i = 0; i < files.length; i++) {

            if (files.eq(i).val()) {

                data.files = data.files || [];

                data.files.push({

                    name: files[i].files[0].name,
                    type: files[i].files[0].type,
                    data: files.eq(i).attr('content')

                });

            } 

        }

        ajax('/attach', {data: JSON.stringify(data)}, function(){
            console.log('success', arguments);
            $('#attach_block, .popup').addClass('none');
        }, function(){
            console.log('error', arguments);
        });

    }

    $(document).on('click', '#attach_files', attach);

    $(document).on('change', 'input[type="file"]', function() {
    
        var divInput = $(this).parent();
        
        file(divInput);
        processing_file(divInput);
    
    });
})();