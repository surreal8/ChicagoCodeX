

(function ($) {
	
	function getMapBounds(map) {
		var extents = map.extent();
		var coords = JSON.stringify({
			swLon: extents[0].lon,
			swLat: extents[0].lat,
			neLon: extents[1].lon,
			neLat: extents[1].lat
		});
	}
	
	
	function figureOptionsPolymap(data, dest, options) {
		// determine best size to open dialog, based on figure size
		var iw = $(data.ptiffDiv).data('iw');
		var ih = $(data.ptiffDiv).data('ih');
		var mapW, mapH;
		if (iw > ih) {
			// wider than tall
			var ratio = ih / iw;
			mapW = 640;
			mapH = mapW * ratio;
		}
		else {
			// taller than wide
			var ratio = iw / ih;
			mapH = 480;
			mapW = mapH * ratio;
		}
		// set up new modal dialog
		var modal = $('<div>');
		
		// insert polymap figure
		var figureContainer = $('<figure>');
		figureContainer.attr('data-options', dest.attr('data-options'))
			.css('margin', '0 auto');
		var mapContainer = $('<div>');
		mapContainer.css('width', mapW).css('height', mapH).css('margin', '0 auto');
		// we need to add the editing flag to the ptiffDiv, so osci_iip.js knows to force controls
		var editMap = $(data.ptiffDiv);
		editMap.first().attr('data-editing', 'true');
		mapContainer.html(editMap);
		figureContainer.html(mapContainer);
		modal.append('<span class="modal-title">Set Frame</span>');
		modal.append(figureContainer);
		
		// options fieldset
		var fieldset = $('<fieldset>').append('<legend>Options</legend>');
		
		// insert polymap options
		// interaction control
		var interactionContainer = $('<div>');
		var interactionLabel = $('<label>').html('Disable Interaction');
		var interactionToggle = $('<input type="checkbox">')
			.addClass('interaction_toggle');
		console.log(options);
		if (options.interaction == false) {
			console.log('options.interaction == false');
			interactionToggle.attr('checked', 'checked');
		}
		interactionContainer.append(interactionToggle).append(interactionLabel);
		fieldset.append(interactionContainer);
		// overlay slider control
		
		
		// add options fieldset to modal
		modal.append(fieldset);
		
		modal.dialog({
			title: 'Figure Options',
			width: mapW + 30,
			modal: true,
			buttons: [
			          {
			        	  text: 'Cancel', 
			        	  click: function(){ $(this).dialog('close'); }
			          },
			          {
			        	  text: 'Restore Defaults',
			        	  click: function() {
			        		  // trigger get_map event on map container 
			        		  $('.iipmap', mapContainer).trigger({
			        			 type: "restore_default_map",
			        		  });
			        		  $('input', fieldset).removeAttr('checked');
			        	  }
			          },
			          {
			        	  text: 'Save Options', 
			        	  click: function() {
			        		  // trigger get_map event on the map container to get current coords
			        		  $('.iipmap', mapContainer).trigger({
			        			  type: "get_map",
			                      callback: function(map) {
			                    	  // get the coords of the sw, ne corners
			                    	  var extents = map.extent();
			                    	  var options = JSON.stringify({
			                    		  swLon: extents[0].lon,
			                    		  swLat: extents[0].lat,
			                    		  neLon: extents[1].lon,
			                    		  neLat: extents[1].lat,
			                    		  interaction: (!interactionToggle.attr('checked'))
			                    	  });
			                    	  console.log(options, 'options');
			                    	  // inject into hidden form
			                    	  var input = $('.figure_options', $(dest).parents(".fieldset-wrapper:first"));
			                    	  input.val(options);
			                    	  // update the preview figure
			                    	  dest.attr('data-options', options);
			                      },
			                  });
			        		  // close the modal
			        		  modal.dialog('destroy');
			        	  }
			          }
			]
		});
		// make the polymap live
		$('.iipmap', modal).each(function(){ iipmap($(this)); });
	}
	
	
	function getPreviewDiv(id, target) {
		// send nid to server to fetch preview
		$.get(Drupal.settings.baseUrl + 'ajax/figurepreview/' + id,
			function (data) {
				var dest = $('.figure_reference_preview', $(target).parents(".fieldset-wrapper:first"));
				dest.html(data.div);
				// place a figure options breakout button
				var button = $('<input type="button">');
				button.val('Figure Options')
					.css('float', 'right')
					.addClass('ui-button')
					.addClass('figure_options_button');
				// replace the current button if it's there
				var orig_button = $('.figure_options_button', dest.parent());
				if (orig_button.length > 0) {
					orig_button.replaceWith(button);
				}
				else{
					dest.after(button);
				}
				// the figure options button fires off a modal dependent on the type of figure
				if (data.ptiff == true) {
					// polymap - use figureOptionsPolymap()
					button.click(function() {
						// retrieve options
						var options = $.parseJSON($('.figure_options', $(target).parents(".fieldset-wrapper:first")).val());
						figureOptionsPolymap(data, dest, options)
					});
				}
				else {
					// no type detected, remove the options button for now
					$('.figure_options_button', dest.parent()).remove();
				}
			},
			"json"
		);
	}
	
	
	
    $(document).ready(function() {
    	var config = Drupal.settings.wysiwyg.configs.ckeditor.formatfootnote;

    	function initCKeditor(obj) {
    		var obj = $(obj);
    		var wrapper = obj.parents('.footnotes-wrapper');
    		var textareas = $('textarea', wrapper);
    		textareas.each(function() {
    			// Find all editor instances and destroy them
                var instance = $(this).data('ckeditorInstance');
                if (instance !== undefined && instance.destroy && $.isFunction(instance.destroy)) {
                    instance.destroy();
                }
    		});
            obj.ckeditor(function() {}, config);
        }
    	
        
        /**************************************************
         * CKEDITOR 
         */
        $('.ui-tabs').live('tabsselect', function(e, ui) {
            initCKeditor(ui.tab.hash + ' textarea');
            var field = $('.figure_reference_field', ui.tab.hash);
            var val = field.val();
            if (val == parseInt(val)) {
            	getPreviewDiv(val, field);
            }
        });
        
        
        var footWrapper = $('.footnotes-wrapper .fieldset-wrapper').tabs();
        footWrapper.each(function() {
        	var wrapper = $(this);
        	if (wrapper.tabs("length") > 1) {
        		wrapper.tabs("select", 1);
        	}
        });

        var figureWrapper = $('.figures-wrapper .fieldset-wrapper').tabs();
        figureWrapper.each(function() {
        	var wrapper = $(this);
        	if (wrapper.tabs("length") > 1) {
        		wrapper.tabs("select", 1);
        	}
        });
        
        $("<a />", {
            "class" : "footnote-remove",
            text : "remove",
            "src" : "#"
        }).appendTo($("label",".footnotes-wrapper"));

        $("<a />", {
            "class" : "figure-remove",
            text : "remove",
            "src" : "#"
        }).appendTo($("div.figure_identifier",".figures-wrapper"));

        $('div[id$="footnote_blank"]').hide();
        $("li:first", "ul.ui-tabs-nav").hide();
        $('div[id$="figure_blank"]').hide();

        $(".footnote-remove, .figure-remove").live("click", function(e) {
            e.preventDefault();
            //$("textarea", $(this).parent().parent()).remove();
            var $tabs = $(this).parents(".ui-tabs");
            $tabs.tabs("remove", $tabs.tabs('option', 'selected'));
        });

        $("a.footnote-add-another, a.figure-add-another").click(function(e, noEditor) {
            e.preventDefault();
            var newIdSelector, container, hiddenCountElem, count, selectorText, newElement, newHtml;

            container = $(this).parents("div.ui-tabs");
            hiddenCountElem = $('[type="hidden"]:first', container);
            count = parseFloat(hiddenCountElem.val()) + 1;
            selectorText = $(this).attr('class').split('-');

            newElement = $('div[id$="' + selectorText[0] + '_blank"]', container).clone().show();
            
            if (selectorText[0] === "figure") {
                $(".autocomplete-processed", newElement).removeClass("autocomplete-processed");
            }
            newHtml = newElement.wrap("<span />").parent().html();
            newHtml = newHtml.replace(new RegExp(selectorText[0] + "_blank", 'gi'), count);
            newHtml = newHtml.replace(new RegExp(selectorText[0] + "-blank", 'gi'), count);
            newIdSelector = "#" + $(newHtml).attr("id");

            container.append(newHtml);

            if (selectorText[0] === "figure") {
                Drupal.behaviors.autocomplete.attach(newIdSelector, null); 
            }

            container.tabs("add", newIdSelector, count);
            hiddenCountElem.val(count);

            if (noEditor !== true) {
                container.tabs('select', newIdSelector);
            }
        });



        
        
        /**************************************************
         * Figure Preview
         */
        $('.figure_reference_field').live({
        	'keyup': function(event) {
	        	// wait a second to see if anything else was pressed
	        	var origVal = event.target.value;
	        	setTimeout(function() {
	        		var currentVal = event.target.value;
	        		if (currentVal == origVal && currentVal != "" && currentVal == parseInt(currentVal)) {
	            		getPreviewDiv(currentVal, event.target);
	        		}
	        	}, 1250);
        	},
	        'blur': function(event) {
	        	setTimeout( function() {
	        		var currentVal = event.target.value;
	            	if (currentVal == parseInt(currentVal)) {
	            		getPreviewDiv(currentVal, event.target);
	            	}
	        	}, 500);
	        }
        });
    });
})(jQuery);
