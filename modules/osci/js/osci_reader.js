(function($) {
    
    function pulsateText(element)
    {
        var temp = element.clone(),
            offset = element.offset();
        
        temp.appendTo("#osci_viewer");
        
        temp.css({
            position: "absolute",
            top : offset.top - 28 + "px",
            left : offset.left + "px",
            "-webkit-animation-duration" : "0.5s", 
            "-webkit-animation-iteration-count" : "3",
            "-webkit-animation-name" : "pulse",
            "text-shadow" : "0px 0px 3px #CCC"
        });
        
        setTimeout(function(){temp.remove();}, 1500);
    }
    
    function findAndGotoElement(selector, occurence) {
        var elem = $(selector);
            isFigLink = $(elem[0]).hasClass("figure-link"),
            validItem = undefined;
        
        if (occurence === undefined || occurence < 1) {
            occurence = 1;
        }
            
        elem.each(function(i){
            var $this = $(this),
                thisOccur = $this.data("occurence"),
                column = $this.parents(".column"),
                offset = $this.offset(),
                columnOffset = column.offset(),
                columnBottom = columnOffset.top + column.height(),
                page = 0;
            
            if (thisOccur === undefined || thisOccur < 1) {
                thisOccur = 1;
            }
            
            if (thisOccur === occurence && offset.top <= columnBottom && offset.top >= columnOffset.top) {
                page = $this.parents('.osci_page').data('page');
                $(document).trigger({
                    type : "osci_navigation",
                    osci_to : "page",
                    osci_value: page 
                });
                pulsateText($this);
                validItem = $this;
                return false;
            }
        });
        
        if (isFigLink && validItem) {
            var figure = $(validItem.attr("href")),
                occurences = figure.data("occurences"),
                pos, linker, validItemOccur = validItem.data("occurence"),
                nextLink, prevLink;
            
            if (occurences > 1) {
                pos = validItem.offset();
                linker = $("#osci_figure_linker");
                
                if (linker.length === 0) {
                    linker = $("<div>", {
                        id : "osci_figure_linker",
                        html : "<a href=\"#\" class=\"prev\" title=\"Previous Reference\">&lt;</a><a href=\"#\" class=\"next\" title=\"Next Reference\">&gt;</a><a href=\"#\" class=\"close\" title=\"Close Reference Navigator\">x</a>"
                    }).delegate("a", "click", function(e) {
                        e.preventDefault();
                        var $this = $(this),
                            linkToOccur = 1,
                            container = $this.parent(),
                            occurences = parseInt(container.data("occurences"), 10),
                            currentOccur = parseInt(container.data("occurence"), 10),
                            selector = $this.attr("href");
                        
                        if ($this.hasClass("close")) {
                            container.remove();
                            return;
                        }
                        
                        if ($this.hasClass("next")) {
                            if (currentOccur != occurences) {
                                linkToOccur = ++currentOccur;
                            }
                        } else {
                            if (currentOccur == 1) {
                                linkToOccur = occurences;
                            } else {
                                linkToOccur = --currentOccur;
                            }
                        }
                        
                        container.data("occurence", linkToOccur);
                        findAndGotoElement(selector, linkToOccur)
                    }).appendTo("#osci_viewer");
                }
                
                nextLink = linker.find("a.next").show().attr("href", selector);
                prevLink = linker.find("a.prev").show().attr("href", selector);
                
                if (validItemOccur === occurences) {
                    nextLink.hide();
                }
                
                if (validItemOccur === 1) {
                    prevLink.hide();
                }

                linker.css({
                    position : "absolute",
                    top : pos.top + "px",
                    left : pos.left + "px"
                }).data({occurence : validItemOccur, occurences : occurences});
            }
        }
    }
    
    $(document).ready(function() {
    	$(document).bind({
    	    "osci_layout_start" : function(e){
        	    $("<div>", {
        	        id : "osci_loading"
        	    }).appendTo("body");
        	},
        	"touchmove" : function(e) {
        	    e.preventDefault();
        	},
        	"osci_layout_complete" : function(e) {
                $("#osci_loading").remove();
                
                var figureImages = $("figure.image", "#osci_pages");
                // Prevents fancybox from closing the tray
                $('.figureContent > a').click(function(e) {
                    e.stopPropagation();
                });

                figureImages.bind("osci_figure_fullscreen", function(e) {
                    $('.figureContent > a', this).click();
                });
            }
    	});
        
        $("#osci_more_wrapper").osci_more({
            moreToggleCallback : function(more, state)
            {
                switch (state) {
                    case "open":
                        // Ensure the toc tab is closed
                        $("#" + Drupal.settings.osci_navigation.toc_id).trigger({
                            type : "osci_nav_toggle",
                            osci_nav_close : true
                        });
                        
                        more.css({
                            "-webkit-transform" : "translate(0, 0)",
                            "-moz-transform" : "translate(0, 0)",
                            "transform" : "translate(0, 0)"
                        });
                        break;
                    case "close":
                        more.css({
                            "-webkit-transform" : "translate(0, " + more.outerHeight() + "px)",
                            "-moz-transform" : "translate(0, " + more.outerHeight() + "px)",
                            "transform" : "translate(0, " + more.outerHeight() + "px)"
                        });
                        break;
                }
            }
        });
        
        $.osci.layout.defaultOptions = {
            minColumnWidth : Drupal.settings.osci_layout.min_column_width,
            maxColumnWidth : Drupal.settings.osci_layout.max_column_width,
            gutterWidth : Drupal.settings.osci_layout.gutter_width,
            innerPageGutter : Drupal.settings.osci_layout.inner_page_gutter,
            outerPageGutter : Drupal.settings.osci_layout.outer_page_gutter,
            viewerId : Drupal.settings.osci_layout.viewer_id,
            minLinesPerColumn : Drupal.settings.osci_layout.min_lines_per_column,
            layoutCacheTime : Drupal.settings.osci_layout.cache_time,
            processFigureCallback : {
                image : function(figure, content) {
                    var contentWidth = content.width(),
                        contentHeight = content.height(),
                        imageCacheSize = 0,
                        finalImage, finalImageWidth;
                    
                    $("a", content).fancybox();
                    
                    imageCacheSize = Math.pow(2, Math.ceil(Math.log(contentWidth) / Math.log(2)));
                    
                    if (imageCacheSize > 0 && imageCacheSize <= 1024) {
                        $("img:not(.osci_image_" + imageCacheSize + ")", content).remove();
                        finalImageWidth = imageCacheSize;
                    } else {
                        $("img:not(.osci_image_full)", content).remove();
                    } 
                    
                    finalImage = $("img", content);
                    if (finalImageWidth === undefined) {
                        finalImageWidth = finalImage.width();
                    }
                    
                    if (finalImageWidth > contentWidth) {
                        finalImage.width(contentWidth);
                    }
                    
                    figure.prepend(content);
                    
                    return true;
                },
                html_figure : function(figure, content) {
                    var contentHeight = 0, aspect = 0;
                    figure.prepend(content);
                    
                    content.children().each(function(i, elem){
                        contentHeight += $(elem).outerHeight(true);
                    });
                    
                    aspect = Math.round((content.width() / contentHeight) * 1000) / 1000;

                    if (aspect != figure.data("aspect")) {
                        figure.data("aspect", aspect);
                        return false;
                    }
                    
                    $("<a>", {
                        href : "#",
                        "class" : "figure_fullscreen"
                    }).appendTo($("figcaption", figure)).fancybox({
                        content : content.clone().height("").width(""),
                        title : $("figcaption", figure).clone().html()
                    });
                    
                    return true;
                }
            }
        };

        $.osci.note({
            notePanelId : "osci_note_panel_wrapper",
            panelPixelsClosed : 20,
            userNoteCallback : Drupal.settings.basePath + 'ajax/note',
            noteAddCallback : Drupal.settings.basePath + 'ajax/note/add',
            noteSaveCallback : Drupal.settings.basePath + 'ajax/note/save',
        });
        
        $.osci.navigation({
            readerId : Drupal.settings.osci_navigation.reader_id,
            headerId : Drupal.settings.osci_navigation.header_id,
            navId : Drupal.settings.osci_navigation.nav_id,
            tocId : Drupal.settings.osci_navigation.toc_id,
            apiEndpoint : Drupal.settings.osci_navigation.api_endpoint,
            prevLinkId : Drupal.settings.osci_navigation.prev_link_id,
            nextLinkId : Drupal.settings.osci_navigation.next_link_id,
            cacheTime : Drupal.settings.osci_navigation.cache_time,
            bid : parseInt(Drupal.settings.osci.bid, 10),
            nid : parseInt(Drupal.settings.osci.nid, 10),
            mlid : parseInt(Drupal.settings.osci.mlid, 10),
            tocOverlay : false,
            tocToggleCallback : function (toc, state)
            {
                switch (state) {
                    case "open":
                        toc.css({
                            "-webkit-transform" : "translate(0px, 0)",
                            "-moz-transform" : "translate(0px, 0)",
                            "transform" : "translate(0px, 0)"
                        });
                        
                        // When the toc tab is opened:
                        // close the more tab and slide it to the right
                        $("#osci_more_wrapper").trigger({
                            type : "osci_more_toggle",
                            osci_more_close : true
                        })
                        .css({
                        	"-webkit-transform" : "translate(" + toc.outerWidth() + "px, 300px)",
                        	"-moz-transform" : "translate(" + toc.outerWidth() + "px, 300px)",
                        	"transform" : "translate(" + toc.outerWidth() + "px, 300px)"
	                    });
                        
                        $("#osci_note_panel_wrapper").trigger({
                            type : "osci_note_toggle",
                            osci_note_close : true
                        });
                        break;
                    case "close":
                        toc.css({
                            "-webkit-transform" : "translate(-" + toc.outerWidth() + "px, 0)",
                            "-moz-transform" : "translate(-" + toc.outerWidth() + "px, 0)",
                            "transform" : "translate(-" + toc.outerWidth() + "px, 0)"
                        });
                        
                        // When the toc tab is closed:
                        // slide the more tab to the right
                        $("#osci_more_wrapper").css({
                        	"-webkit-transform" : "translate(0px, 300px)",
                        	"-moz-transform" : "translate(0px, 300px)",
                        	"transform" : "translate(0px, 300px)"
	                    });
                        
                        $("#osci_note_panel_wrapper").trigger({
                            type : "osci_note_toggle",
                            osci_note_open : true
                        });
                        break;
                }
            },
            loadFunction : function (navData)
            {
                var endpoint = Drupal.settings.osci_navigation.content_endpoint.replace("{$nid}", navData.nid);
                
                //Get the data
                $.osci.storage.getUrl({
                    url :  endpoint,
                    expire : Drupal.settings.osci_navigation.cache_time,
                    callback : function(content) {
                        var data = $(content.data),
                            footnotes = data.find("#field_osci_footnotes").remove(),
                            figures = data.find("#field_osci_figures").find(".figureThumbnail").remove(),
                            more = $("#osci_more_wrapper").data("osci.more");
                        
                        //Do the layout
                        $("#" + Drupal.settings.osci_navigation.reader_id).osci_layout(data, {
                            cacheId : navData.nid
                        });
                        
                        //Add footnotes to the more bar
                        more.add_content("footnotes", $(".footnote", footnotes), true, 1);
                        
                        //Remove plate image thumbnail
                        figures = figures.filter(function(){
                            if ($(this).data("figure_id") == "osci_plate_fig") {
                                return false;
                            } else {
                                return true;
                            }
                        });
                        
                        //Add figures to the more bar
                        more.add_content("figures", figures, true, undefined, function(tab){
                            $(".figureThumbnail", tab).each(function(i, elem){
                                var $elem = $(elem);
                                $("<a>", {
                                    text : "goto",
                                    href : "#",
                                    click : function(e) {
                                        e.preventDefault();
                                        var id = $("img", $(this).parent()).data("figure_id");
                                        
                                        findAndGotoElement("a[href='#" + id + "']");

                                        $("#osci_more_wrapper").trigger({
                                            type : "osci_more_toggle",
                                            osci_more_close : true
                                        });
                                    },
                                    title : "goto figure in context",
                                    "class" : "figure_goto"
                                }).appendTo($elem);
                                
                                $("img", $elem).click(function(e){
                                    e.preventDefault();
                                    var id = $(this).data("figure_id");
                                    
                                    $("#" + id, "#osci_pages").trigger({
                                        type : "osci_figure_fullscreen"
                                    });
                                });
                                
                                $("<a>", {
                                    text : "fullscreen",
                                    href : "#",
                                    click : function(e) {
                                        e.preventDefault();
                                        var id = $("img", $(this).parent()).data("figure_id");
                                        
                                        $("#" + id, "#osci_pages").trigger({
                                            type : "osci_figure_fullscreen"
                                        });
                                    },
                                    title : "view fullscreen",
                                    "class" : "figure_fullscreen"
                                }).appendTo($elem);
                            });
                        });
                    }
                });
            }
        });
        
        //make cross linking work
        $("a.cross-link","#" + Drupal.settings.osci_navigation.reader_id).live("click", function(e){
            e.preventDefault();
            var $this = $(this),
                query = $this.data("query"),
                link = $this.data("nid");

            if (query.length > 0) {
                link += query;
            }
            
            $(document).trigger({
                type : "osci_navigation",
                osci_to : "node",
                osci_value : link
            });
        });
        
        //make footnotes link to footnote text in more bar
        $("a.footnote-link","#" + Drupal.settings.osci_navigation.reader_id).live("click", function(e){
            e.preventDefault();
            var $this = $(this);

            $("#osci_more_wrapper").trigger({
                type : "osci_more_goto",
                tab_name : "footnotes",
                selector : $this.attr("href")
            });
        });
        
        //make footnotes link in more bar to position in text
        $("span.footnote_number", "#osci_more_wrapper").live("click", function(e){
            e.preventDefault();
            var id = $(this).parent().attr("id");
            
            findAndGotoElement("a[href='#" + id + "']");

            $("#osci_more_wrapper").trigger({
                type : "osci_more_toggle",
                osci_more_close : true
            });
        });
        
        //make figure links open the fullscreen view
        $("a.figure-link","#" + Drupal.settings.osci_navigation.reader_id).live("click", function(e){
            e.preventDefault();
            var $this = $(this),
                visible;

            visible = $($this.attr("href") + ":visible", "#osci_pages");

            if (visible.length) {
                $(document).trigger({
                    type : "osci_navigation",
                    osci_to : "selector",
                    osci_value : $this.attr("href")
                });
            } else {
                $($this.attr("href"), "#osci_pages").trigger({
                    type : "osci_figure_fullscreen"
                });
            }
        });
        
        //make more & navigation bars close when viewer is clicked
        $("#" + Drupal.settings.osci_layout.viewer_id).click(function(e){
            $("#" + Drupal.settings.osci_navigation.toc_id).trigger({
                type : "osci_nav_toggle",
                osci_nav_close : true
            });
            
            $("#osci_more_wrapper").trigger({
                type : "osci_more_toggle",
                osci_more_close : true
            });
        });
        
        $(".osci_reference_image_link").live("click",function(e){
            e.preventDefault();
            var $this = $(this),
                fancyOptions = {
                    speedIn : 100,
                    speedOut : 100,
                    scroll : 'no'
                };
                
            if ($this.hasClass("everpresent")) {
                fancyOptions.title = '<a target="_blank" href="' + $this.attr('href') + '">Open in new window</a>';
            }
                
            fancyOptions.href = $this.attr("href");
            $.fancybox(fancyOptions);
        });
        
        var checkKey = false;
        $(document).keydown(function(e) {
            if (e.keyCode == 70 && e.ctrlKey === true && checkKey === false) {
                checkKey = true;
                $(".everpresent a").click();
                e.preventDefault();
            } else if (e.keyCode == 70 && e.ctrlKey === true && checkKey === true) {
                checkKey = false;
                $('#fancybox-close').click();
                e.preventDefault();
            }
        });
    });
})(jQuery);
