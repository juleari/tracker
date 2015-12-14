(function(){
    
    var sortByColumn = function(arr) {
        
        var low = [], mid = [], high = [], text;

        if (arr.length > 1) {
            
            text = arr[0].text;
            
            for (var i = 0; i < arr.length; i++) {
                
                if (arr[i].text < text) low.push(arr[i])
                else {

                    if (arr[i].text > text) high.push(arr[i])
                    else mid.push(arr[i])
                }
            }
            
            return sortByColumn(low).concat(mid, sortByColumn(high))
        
        } else return arr
    }

    $('.e-search').on('click', function(){
        
        var text = $('.search').val();
        location.replace('/search_' + text);
    });

    $('.e-down').on('click', function(){
        
        var list = $('.header .ul_vertical');

        if (list.css('display') == 'none') list.css('display', 'block');
        else list.css('display', 'none');
    });

    $('body').on('click', function(e){
      
        var elem = document.elementFromPoint(e.pageX, e.pageY),
            list = $('.header .ul_vertical');
      
        if (!($(elem).is('.e-down')) &&
                (!($(elem).is('.header .ul_vertical')) || 
                !($(elem).parents('.header .ul_vertical li').length))) {
        
            list.css('display', 'none');
        }
    });

    $('.b-task_column-name').on('click', function() {
        
        var th        = $(this),
            table     = th.parent().parent(),
            nodes     = table.children().slice(1),
            className = this.classList[0],
            arr       = [],
            node;

        for (var i = 0; i < nodes.length; i++) {
            
            node   = nodes.eq(i);
            arr[i] = {
                text: node.children('.' + className).text(),
                node: node
            }
        }

        arr = sortByColumn(arr);
        table.children('a').remove();

        for (i = 0; i < arr.length; i++) table.append(arr[i].node);

    });
})();