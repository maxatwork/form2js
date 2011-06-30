/**
 * @author Maxim Vasiliev
 * Date: 29.06.11
 * Time: 20:09
 */

(function($){

	/**
	 * jQuery wrapper for form2object()
	 * Extracts data from child inputs into javascript object
	 */
	$.fn.toObject = function(options)
	{
		var result = [],
			settings = {
				mode: 'first', // what to convert: 'all' or 'first' matched node
				delimiter: ".",
				skipEmpty: true,
				nodeCallback: null
			};

		if (options)
		{
			$.extend(settings, options);
		}

		switch(settings.mode)
		{
			case 'first':
				return form2object(this.get(0), settings.delimiter, settings.skipEmpty, settings.nodeCallback);
				break;
			case 'all':
				this.each(function(){
					result.push(form2object(this, settings.delimiter, settings.skipEmpty, settings.nodeCallback));
				});
				return result;
				break;
			case 'combine':
				return form2object(Array.prototype.slice.call(this), settings.delimiter, settings.skipEmpty, settings.nodeCallback);
				break;
		}
	}

})(jQuery);