(function($)
{
    if (!$.osci) {
        $.osci = {};
    }

    $.osci.navigation = function(el, data, options)
    {
        var base = this;

        base.$el = $(el);
        base.el = el;

        base.$el.data("osci.navigation", base);
 
        base.init = function()
        {
            var toc;
            
            base.options = $.extend({}, $.osci.navigation.defaultOptions, options);
            
            base.options.bid = (base.options.bid) ? base.options.bid : parseInt(Drupal.settings.osci.bid);
            base.options.nid = (base.options.nid) ? base.options.nid : parseInt(Drupal.settings.osci.nid);
            base.options.mlid = (base.options.mlid) ? base.options.mlid : parseInt(Drupal.settings.osci.mlid);
            
            base.navigation = {
                nid : base.options.nid,
                mlid : base.options.mlid,
                currentPage : 0,
                pageCount : 0,
                startPage : 'first'
            }
            
            toc = _get_table_of_contents(base.options.nid, base.options.bid);
            base.navigation.toc = toc.data;
            
            $(document).bind("osci_layout_complete",function(){
                _reset_navigation();
            });
            
            $("#" + base.options.prevLinkId).click(function (e){
                e.preventDefault();
                _navigateTo({
                    operation : 'prev'
                });
            });
            
            $("#" + base.options.nextLinkId).click(function (e){
                e.preventDefault();
                _navigateTo({
                    operation : 'next'
                });
            });
            
            //Not sure if this fits here but prevents this getting assigned more than once in the layout module
            if (!window.resizeTimer) {
                $(window).resize(function(){
                    if (window.resizeTimer) clearTimeout(window.resizeTimer);
                    window.resizeTimer = setTimeout(_osci_resize, 100);
                });
            }
            
            _load_section();
        };    
        
        function _get_table_of_contents(nid, bid)
        {
            return $.osci.storage.getUrl({
                url : base.options.apiEndpoint + nid + '/book.json',
                key : 'bid_' + bid,
                type : 'json'
            });
        };
        
        function _osci_resize()
        {
            var firstParagraph = $("p.osci_paragraph:first", "div.osci_page_" + (base.navigation.currentPage + 1));
            base.navigation.startPage = "paragraph:" + firstParagraph.data("paragraph_id");
            
            $.osci.storage.clearCache('osci_layout_cache:');
            _load_section();
        }
        
        function _load_section(section)
        {
            var content, loadNid = base.navigation.nid, tocData, startPage;
            
            switch(section) {
                case 'next':
                    tocData = base.navigation.toc['nid_' + base.navigation.nid].next;
                    if (tocData.nid) {
                        loadNid = tocData.nid;
                        startPage = 'first';
                    }
                    break;
                case 'prev':
                    tocData = base.navigation.toc['nid_' + base.navigation.nid].prev;
                    if (tocData.nid) {
                        loadNid = tocData.nid;
                        startPage = 'last';
                    }
                    break;
            }
            
            if (loadNid !== base.navigation.nid) {
                base.navigation.nid = loadNid;
                base.navigation.startPage = startPage;
            }
            
            content = $.osci.storage.getUrl({
                url :  base.options.contentEndpoint.replace('{$nid}', loadNid),
                expire : 86400
            });
            
            $("#" + base.options.readerId).osci_layout(content.data, {cacheId : loadNid});
        };
        
        function _reset_navigation()
        {
            var paragraphData, page, 
                navigateTo = {operation : base.navigation.startPage},
                layoutData = $("#" + base.options.readerId).data("osci.layout");

            base.navigation.currentPage = 0;
            base.navigation.pageCount = layoutData.options.pageCount;
            base.navigation.layoutData = layoutData.options;

            if (base.navigation.startPage.indexOf("paragraph:") >= 0) {
                paragraphData = base.navigation.startPage.split(":");
                page = $("p.osci_paragraph_" + paragraphData[1] + ":first","#" + layoutData.options.viewerId).parents(".osci_page").data("page");
                navigateTo = {
                    operation : "page",
                    value : page
                };
            }

            _update_title();
            _navigateTo(navigateTo);
        };
        
        function _update_title()
        {
            var hasParent = true,
                header = $("#" + base.options.headerId),
                titleParts = [],
                nid = base.navigation.nid,
                titleLength = 0,
                bookTitle = '',
                subTitle = '';
            
            while (hasParent) {
                titleParts.push(base.navigation.toc['nid_' + nid].title);
                
                if (base.navigation.toc['nid_' + nid].parent.nid) {
                    nid = base.navigation.toc['nid_' + nid].parent.nid;
                } else {
                    hasParent = false;
                }
            }
            
            titleLength = titleParts.length;
            for (var i = 0; i < titleLength; i++) {
                if (i == titleLength - 1) {
                    bookTitle = titleParts[i];
                } else {
                    if (subTitle.length) {
                        subTitle = titleParts[i] + ': ' + subTitle;
                    } else {
                        subTitle = titleParts[i];
                    }
                }
            }

            $("h1.osci_book_title").text(bookTitle);
            $("h2.osci_book_section_title").text(subTitle);
        }
        
        function _navigateTo(to)
        {
            var newX, totalColumns, newPage;
     
            switch(to.operation) {
                case 'first':
                    base.navigation.currentPage = 0;
                   break;

                case 'last':
                    base.navigation.currentPage = base.navigation.pageCount - 1;
                   break;

                case 'next':
                    base.navigation.currentPage++;
                    if (base.navigation.currentPage >= base.navigation.pageCount) {
                        _load_section('next');
                        return;
                    }
                    break;

                case 'prev':
                    if (base.navigation.currentPage < 1) {
                        _load_section('prev');
                        return;
                    }
                    base.navigation.currentPage--;
                    break;

                case 'page':
                    if (to.value > base.navigation.pageCount || to.value < 1) {
                        return;
                    }
                    base.navigation.currentPage = to.value - 1;
                    break;

                case 'column':
                    totalColumns = base.navigation.layoutData.columnsPerPage * base.navigation.pageCount;
                    if (to.value > totalColumns || to.value < 1) {
                        return;
                    }

                    newPage = Math.ceil(to.value / base.navigation.layoutData.columnsPerPage);
                    navigateTo({operation:'page',value:newPage});
                    return;
                    break;
            }

            var newOffset = 0;
            if (base.navigation.currentPage > 0) {
                newOffset = -1 * ((base.navigation.currentPage * base.navigation.layoutData.pageWidth) + 
                    ((base.navigation.layoutData.outerPageGutter[1] + base.navigation.layoutData.outerPageGutter[3]) * (base.navigation.currentPage)));
            }

            newX = newOffset;
            jQuery(".osci_page", "#osci_viewer").css({
                "-webkit-transform" : "translate(" + newX + "px, 0)",
                "-moz-transform" : "translate(" + newX + "px, 0)",
                "transform" : "translate(" + newX + "px, 0)"
            });
        };

        base.init();
    };

    $.osci.navigation.defaultOptions = {
        readerId : 'osci_reader_content',
        headerId : 'osci_header',
        apiEndpoint : 'http://osci.localhost/api/navigation/',
        contentEndpoint : 'http://osci.localhost/node/{$nid}/bodycopy',
        bid : 0,
        nid : 0,
        mlid : 0,
        prevLinkId : "osci_nav_prev",
        nextLinkId : "osci_nav_next"
    };

    $.fn.osci_navigation = function( data, options )
    {
        return this.each(function()
        {
            (new $.osci.navigation(this, data, options)); 
        });
    };

})(jQuery);

jQuery(document).ready(function() {
    jQuery("#osci_navigation").osci_navigation();
});

/*
var currentPage = 0;

jQuery(document).ready(function() {

    jQuery("#osci_viewer_wrapper").swipe({
        swipeLeft : function () { $("a.next","#osci_navigation").click(); },
        swipeRight : function () { $("a.prev","#osci_navigation").click(); }
    });

    jQuery("a.footnote-link, a.figure-link","#osci_viewer").live('click',function(e){
        e.preventDefault();
        var $this = jQuery(this);

        navigateTo({
	    operation : 'page',
            value : jQuery($this.attr("href")).parents(".osci_page").data("page")
        });

        jQuery($this.attr("href")).effect("pulsate", { times : 3 }, 1000);
    });

    jQuery(document).keydown(function(e){
        var keyCode = e.keyCode || e.which;

        switch(keyCode) {
            case 37:
                jQuery("a.prev").click();
                break;
            case 39:
                jQuery("a.next").click();
                break;
        }
    });

    var url = document.URL;
    url = url.replace("reader","bodycopy");

    var content = jQuery.osci.getUrl({ url: url, clear : true });
    jQuery("#osci_reader_content").osci_layout(content.data, {});

});
*/