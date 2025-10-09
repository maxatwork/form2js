/**
 * Copyright (c) 2010 Maxim Vasiliev
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * @author Maxim Vasiliev
 * Date: 29.06.11
 * Time: 20:09
 */

(function(factory) {

    // Establish the root object, `window` (`self`) in the browser, or `global` on the server.
    // We use `self` instead of `window` for `WebWorker` support.
    var root = (typeof self == 'object' && self.self == self && self) ||
        (typeof global == 'object' && global.global == global && global);

    // Start with AMD.
    if (typeof define === 'function' && define.amd) {
        define(['form2js', 'jquery'], function(form2js, $) {
            factory(root, form2js, $);
        });

        // Next for Node.js or CommonJS. jQuery may not be needed as a module.
    } else if (typeof exports !== 'undefined') {
        var form2js = require('form2js').form2js, $;
        try { $ = require('jquery'); } catch(e) {}

        factory(root, form2js, $);

        // Finally, as a browser global.
    } else {
        factory(root, root.form2js, (root.jQuery || root.Zepto || root.ender || root.$));
    }

}(function(root, form2js, $){

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
				nodeCallback: null,
				useIdIfEmptyName: false
			};

		if (options)
		{
			$.extend(settings, options);
		}

		switch(settings.mode)
		{
			case 'first':
				return form2js(this.get(0), settings.delimiter, settings.skipEmpty, settings.nodeCallback, settings.useIdIfEmptyName);
				break;
			case 'all':
				this.each(function(){
					result.push(form2js(this, settings.delimiter, settings.skipEmpty, settings.nodeCallback, settings.useIdIfEmptyName));
				});
				return result;
				break;
			case 'combine':
				return form2js(Array.prototype.slice.call(this), settings.delimiter, settings.skipEmpty, settings.nodeCallback, settings.useIdIfEmptyName);
				break;
		}
	}

}));
