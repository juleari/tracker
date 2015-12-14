(function(){
    
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

  
    var fileUpload = function (url, name) {
        $.ajaxFileUpload({ 
            url: url,  
            secureuri: false, 
            fileElementId: name, 
            success: function (data, status) { 
                if (typeof(data.error) != 'undefined') { 
                    
                    if (data.msg == "1") { // расширение 
                        $(".respon").html("<p>Ошибка: тип файла не подходит</p>"); 
                  
                    } else if (data.msg == "2") { // что загружаем? 
                      
                        $(".respon").html("<p>Ошибка: вы не выбрали файл для загрузки</p>"); 
                    } else { 
                      
                        $(".respon").html(data.msg); 
                        //$(".respon").html("<p>Статус: видео загружено</p>"); 
                        //$('.tinymce').tinymce().execCommand('mceInsertContent',false,data.msg); 
                    } 
                } 
            }, 
            error: function (data, status, e) { alert(e); } 
        
        });  
    }

    var proj = function(){
        var name   = $('#title'),
            name_v = name.val(),
            desc   = $('#desc'),
            desc_v = desc.val(),
            data = {}, fields;

        $('input').removeClass('input_error');

        if ( !name_v ) {
            name.addClass('input_error');
            name.focus();
            return
        }

        if ( !desc_v ) {
            desc.addClass('input_error');
            desc.focus();
            return
        }

        fields = $('.b-note__body').find('input, select, textarea');
        for (var i = 0; i < fields.length; i++) {

            data[fields.eq(i).attr('id')] = fields.eq(i).val()
        }

        ajax('/add_p', data, function(){
            
            console.log('success', arguments);
            location.replace('/proj_' + arguments[0]);
        
        }, function(){
            
            console.log('err: ', arguments);
        });
    }

    var task = function(){
        var name   = $('#title'),
            name_v = name.val(),
            desc   = $('#desc'),
            desc_v = desc.val(),
            files  = $('input[type="file"]'),
            data   = {},
            fields = [];

        $('input').removeClass('input_error');

        if ( !name_v ) {
            name.addClass('input_error');
            name.focus();
            return
        }

        if ( !desc_v ) {
            desc.addClass('input_error');
            desc.focus();
            return
        }

        fields = $('.b-note__body').find('input, select, textarea');
        for (var i = 0; i < fields.length; i++) {

            if (fields.eq(i).attr('type') != 'file') 
                data[fields.eq(i).attr('id')] = fields.eq(i).val();

        }

        for (var i = 0; i < files.length; i++) {

            console.log(i, files.eq(i).val());
            
            if (files.eq(i).val()) {

                data.files = data.files || [];

                data.files.push({

                    name: files[i].files[0].name,
                    type: files[i].files[0].type,
                    data: files.eq(i).attr('content')

                });

            } 

        }

        ajax('/add_t', {data: JSON.stringify(data)}, function(){
            console.log('success', arguments);
            location.replace('/task_' + arguments[0]);
        }, function(){
            console.log('error', arguments);
        });
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

    $(document).on('click', '#send_task', task);

    $(document).on('click', '#send_proj', proj);

    $(document).on('change', 'input[type="file"]', function() {
    
        var divInput = $(this).parent();
        
        file(divInput);
        processing_file(divInput);
    
    });

    $(window).keypress (function(e){
        
        if (e.keyCode == 13) {
            
            if ($('#send_task')[0]) task();
              
            if ($('#send_proj')[0]) proj();

        }
    });

})();