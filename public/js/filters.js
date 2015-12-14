(function(){

  var saveSetts = function (button) {
    var add = button.parents('.sett__task__add'),
        inputs = add.find('input'), dat = {};

    dat.id = inputs.eq(0).attr('name');
    dat.on = (!!inputs.eq(0).attr('checked')).toString();

    if (dat.on == 'true') {

      dat.fields = [];

      for (var i = 1; i < inputs.length; i++) {
        if (inputs.eq(i).attr('checked')) 
          dat.fields.push(inputs.eq(i).attr('name'))
      }

      ajax('edit_filter', {'filter': JSON.stringify(dat)}, function(){
        console.log('success', arguments);
        button.addClass('none');
        add.find('.js-changed').removeClass('js-changed');
      }, function(){
        console.log('error', arguments);
      });

    } else {

      ajax('rem_filter', {id: dat.id}, function(){
        console.log('success', arguments);
        button.addClass('none');
        add.find('.js-changed').removeClass('js-changed');
      }, function(){
        console.log('error', arguments);
      });

    }
    
  }

  $(document).on({
    click : function(){
      saveSetts($(this));
    }
  }, '.js-save');

  $(document).on({
    click : function(){
      createSetts($(this));
    }
  }, '.js-create');

})()