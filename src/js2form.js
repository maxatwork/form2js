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
 * Date: 19.09.11
 * Time: 23:40
 */

var js2form = (function()
{
	"use strict";

	var _subArrayRegexp = /^\[\d+?\]/,
		_subObjectRegexp = /^[a-zA-Z_]+/;

	/**
	 * 
	 * @param rootNode
	 * @param data
	 * @param delimiter
	 * @param nodeCallback
	 * @param useIdIfEmptyName
	 */
	function js2form(rootNode, data, delimiter, nodeCallback, useIdIfEmptyName)
	{
		console.log(JSON.stringify(object2array(data)));
	}

	function object2array(obj, lvl)
	{
		var result = [], i, name;

		if (arguments.length == 1) lvl = 0;

		if (obj instanceof Array)
		{
			for(i = 0; i < obj.length; i++)
			{
				name = "[" + i + "]";
				result = result.concat(getSubValues(obj[i], name, lvl+1));
			}
		}
		else if (typeof obj == 'string' || typeof obj == 'number' || typeof obj == 'date')
		{
			result = [{ name: "", value : obj }];
		}
		else
		{
			for(i in obj)
			{
				name = i;
				result = result.concat(getSubValues(obj[i], name, lvl+1));
			}
		}

		return result;
	}

	function getSubValues(subObj, name, lvl)
	{
		var itemName;
		var result = [], tempResult = object2array(subObj, lvl+1), i, tempItem;
		
		for(i = 0; i < tempResult.length; i++)
		{
			itemName = name;
			if (_subArrayRegexp.test(tempResult[i].name))
			{
				itemName += tempResult[i].name;
			}
			else if (_subObjectRegexp.test(tempResult[i].name))
			{
				itemName += '.' + tempResult[i].name;
			}

			tempItem = { name: itemName, value: tempResult[i].value };
			result.push(tempItem);
		}
		return result;
	}

	function tabs(lvl)
	{
		var result = '';
		for (var i = 0; i < lvl; i++){
			result += '\t';
		}

		return result;
	}

	return js2form;

})();