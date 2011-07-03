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
        settings = {
            mode: 'first', // what to convert: 'all' or 'first' matched node
            delimiter: ".",
            rails : false,
            skipEmpty: true,
            nodeCallback: null
        };

		if (options) {
			$.extend(settings, options);
		}

        var toObject = function(context){
          return form2object(context, settings.delimiter, settings.skipEmpty, settings.nodeCallback, settings.rails);
        }

		switch(settings.mode) {
			case 'first':
				return toObject(this.get(0));
				break;
			case 'all':
				return this.map(function(){ return toObject(this) });
				break;
			case 'combine':
				return this.each(function(){ toObject(Array.prototype.slice.call(this)) });
				break;
		}
	}

})(jQuery);
