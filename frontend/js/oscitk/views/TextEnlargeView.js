OsciTk.views.TextEnlarge = OsciTk.views.BaseView.extend({
	id: 'toolbar-item-textEnlarge',
	initialize: function() {
		if (app.config.get('currentFontSize') === undefined) {
			app.config.set('currentFontSize', 100);
		}
	},
	click: function(e) {
		app.config.set('currentFontSize', app.config.get('currentFontSize') + 25);
		app.views.sectionView.$el.css({
			'font-size': app.config.get('currentFontSize') + '%'
		});
		Backbone.trigger("windowResized");
	}
});