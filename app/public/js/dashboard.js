
require(['jquery','jss','jquery-ui'],
  function($,jss){ $(document).ready(function($){
    
    /**
     * Make a grid at elemOrSelector
     */
    function create_grid(elemOrSelector,options) {
        
        /*
        
        ###########
        #    #    # <- # is the gutter
        #    #    #
        ###########
        #    #    # <- square side
        #    #    # <- square side
        ###########
        
        */
        
        var o = $.extend({
            rows  : 12,
            ratio : 16/10, // 16/10 work on 16/9 too, but not the other way around
            sizeTarget : window,
            drawBackground : true,
            heightRatio : 1,
            gutterAmp : 10,  // % of square side, is the distance between squares
            boxesDraggable : true,
            dragHandle : '.drag-handle'
            
        },options || {});
        
        
        /* Retrieve coords and dimensions of a box inside the grid, using
           cells as units
        */
        function getBoxInfo(box){
            var $box = $(box),
                info = $box.data('box-info') || {},
                classes = $box.attr('class'),
                stale = info.cachekey != classes
            ;
            
            if (stale) {
                info.x = parseInt(/\bg-pos-x-(\d+)/.exec(classes)[1]);
                info.y = parseInt(/\bg-pos-y-(\d+)/.exec(classes)[1]);
                info.width = parseInt(/\bg-width-(\d+)/.exec(classes)[1]);
                info.height = parseInt(/\bg-height-(\d+)/.exec(classes)[1]);
                info.cachekey = classes;
                $box.data('box-info',info);
            }
            
            return info;
        }
        
        $(o.sizeTarget).resize(function(){
            
            var $grid = $(elemOrSelector),
                rows = o.rows,
                ratio = o.ratio, 
                height = $(o.sizeTarget).height() * o.heightRatio, // take less to ensure do not trigger scroll
                maxWidth = height*ratio,
                gutterAmp = o.gutterAmp,
                
                pixTo1amp = height / ( (gutterAmp+100)*rows+gutterAmp ),
                
                squareSide =  pixTo1amp * 100,  // square side in pixels
                gutterWidth = (height-squareSide*rows)/(rows+1), // gutter width in pixels
                squareAmp = squareSide*100/height, // percent of the side of the square respect to the height
                gutterRealAmp = gutterWidth*100/height // percent of the gutter width respect to the height
                
                // set the width so that it holds the maximum number of squares at this ratio
                width = Math.floor((maxWidth-gutterWidth) / (squareSide+gutterWidth))*(squareSide+gutterWidth)+gutterWidth,
                tmpSize = null,
                tmpPos = null
                ;
                
            $grid.height(height);
            $grid.width(width);
            
            $grid.css('position','relative');
            
            jss('.g-box', {
                position:'absolute'
            });
            
            for(var i=1;i<rows*2+1;i++){
                
                tmpSize = (squareSide+gutterWidth)*i-gutterWidth;
                tmpPos = gutterWidth+(squareSide+gutterWidth)*(i-1);
                
                jss('.g-pos-x-'+i, {
                    left: tmpPos+'px'
                });
                
                jss('.g-width-'+i, {
                    width: tmpSize+'px'
                });
                
                if (i>rows) continue; // avoid unnecessary classes for height 
                
                jss('.g-height-'+i, {
                    height: tmpSize+'px'
                });
                
                jss('.g-pos-y-'+i, {
                    top: tmpPos+'px'
                });
                
            }
            
            if (o.drawBackground) {
                // the background image is a square with a border at left and bottom.
                // The border is wide as 'gutterWith', wich at present is wide 10%
                // of the square side
                $grid.css('background-size',''+(squareSide+gutterWidth)+'px '+(squareSide+gutterWidth)+'px');
                $grid.css('background-image','url(/images/dashboard_bg.png');
            }
            
            if (o.boxesDraggable) {
                $('.g-box').draggable({
                    containment : 'parent',
                    grid : [(squareSide+gutterWidth),(squareSide+gutterWidth)],
                    handle : o.dragHandle,
                    stack : '.g-box',
                    stop: function(ev,ui){
                        // jquery ui will snap using left/top. We want to use the grid classes
                        // so that grid resizing doesn't stop working
                        
                        var leftPx = $(this).position().left,
                            topPx  = $(this).position().top,
                            leftIdx =  Math.ceil((leftPx+squareSide/2)/(squareSide+gutterWidth)),
                            topIdx  =  Math.ceil((topPx +squareSide/2)/(squareSide+gutterWidth)),
                            cellAvailable = true
                        ;
                        
                        function overlap(a1,a2,b1,b2){
                            return ( a1>=b1 && a1<=b2 ) || (a2>=b1 && a2<=b2);
                        }
                        
                        // check if the drop point is over another box
                        // (it would be best to use an r-tree to do it)
                        $grid.find('.g-box').each(function(){
                            if (ev.target == this) return;
                            
                            var src = getBoxInfo(ev.target),
                                dst = getBoxInfo(this);
                            
                            // can't use src.x because it has the old position
                            if (    overlap(leftIdx, leftIdx + src.width-1,  dst.x, dst.x + dst.width-1)
                                &&
                                    overlap(topIdx , topIdx  + src.height-1, dst.y, dst.y + dst.height-1)
                               ) {
                                cellAvailable = false;
                                return false;
                            }
                        
                        });
                        
                        if (cellAvailable) {
                            $(this)
                            .attr('class',function(idx,css){
                                return css.replace(/\bg-pos-[xy]-\d+/g,'');
                            })
                            .addClass('g-pos-x-'+leftIdx+' g-pos-y-'+topIdx);
                        }
                        
                        $(this).css({left:'',top:'',zIndex:''});
                    }
                });
            }
        
        }).resize();
        
    }
    
    create_grid('#dashboard');
    
});    
});