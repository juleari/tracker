(function() {
  window.ajax = function(url, data, success, error) {
    $.ajax({
      url: url,
      type: 'Post',
      data: data,
      success: function(a) {
        console.log('success', arguments);
        success(a); 
      },
      error: function() {
        error(arguments) 
      }
    })
  }

  window.textareaFocus = function(queryObj) {
    var obj = queryObj[0];

    if (obj.setSelectionRange) {
      var len = obj.value.length;

      obj.focus();
      obj.setSelectionRange(len,len);
      obj.focus();
    }
  }
})();