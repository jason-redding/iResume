/* 
 * Copyright (C) 2017 Jason Redding
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function($, document, window) {
	var e = ['local-name'];
	var meth = 'prop';
	if (!$.isFunction($.fn[meth])) {
		meth = 'attr';
	}
	var compareNodeName = function(obj, arg) {
		var $obj = $(obj);
		return ($obj[meth]('nodeName') === arg);
	};
	$.each(e, function(n, v) {
		$.expr[':'][v] = ($.expr.createPseudo ?
		$.expr.createPseudo(function(selector, context, isXML) {
			return function(obj) {
				return compareNodeName(obj, selector);
			};
		}) :
		function(obj, index, meta, stack) {
			return compareNodeName(obj, meta[3]);
		});
	});

	var textEquals = function(obj, arg) {
		var $obj = $(obj);
		return ($.trim($obj.text()) === arg);
	};
	var textEqualsIgnoreCase = function(obj, arg) {
		var $obj = $(obj);
		return ($.trim($obj.text()).toLowerCase() === arg.toLowerCase());
	};

	$.expr[':'].textEquals = ($.expr.createPseudo ?
	$.expr.createPseudo(function(selector, context, isXML) {
		return function(obj) {
			return textEquals(obj, selector);
		};
	}) :
	function(obj, index, meta, stack) {
		return textEquals(obj, meta[3]);
	});

	$.expr[':'].textEqualsIgnoreCase = ($.expr.createPseudo ?
	$.expr.createPseudo(function(selector, context, isXML) {
		return function(obj) {
			return textEqualsIgnoreCase(obj, selector);
		};
	}) :
	function(obj, index, meta, stack) {
		return textEqualsIgnoreCase(obj, meta[3]);
	});
})(jQuery, document, window);

(function($, document, window) {
	$.fn.templateProperties = function() {
		var r = {};
		this.parents('[data-template-properties]').addBack('[data-template-properties]').each(function() {
			var $this = $(this);
			var props = $.trim($this.attr('data-template-properties'));
			if (props.length === 0) {
				props = '{}';
			}
			try {
				$.extend(true, r, JSON.parse(props));
			} catch (ex) {
			}
		});
		return r;
	};
})(jQuery, document, window);