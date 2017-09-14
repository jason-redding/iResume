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
	function Namespace() {
		var uriMap = {};
		var prefixMap = {};
		$.extend(true, this, {
			create: function() {
				return new Namespace();
			},
			lookupNamespace: function(prefix) {
				if (prefix in prefixMap) {
					return prefixMap[prefix];
				}
				return null;
			},
			reset: function(xmlDoc) {
				var self = this;
				uriMap = {};
				prefixMap = {};
				if ($.isXMLDoc(xmlDoc)) {
					$('*', xmlDoc).each(function() {
						if (this.attributes.length > 0) {
							$.each(this.attributes, function(index, attr) {
								if (attr.namespaceURI === 'http://www.w3.org/2000/xmlns/') {
									if (attr.nodeName === attr.localName) {
										self.addNamespace('', attr.nodeValue);
									} else {
										self.addNamespace(attr.localName, attr.nodeValue);
									}
								}
							});
						}
					});
				}
			},
			prefixes: function() {
				return $.extend(true, {}, prefixMap);
			},
			namespaces: function() {
				return $.extend(true, {}, uriMap);
			},
			addNamespace: function(prefix, uri) {
				var prefixList;
				if (uri in uriMap) {
					prefixList = uriMap[uri];
				} else {
					uriMap[uri] = (prefixList = []);
				}
				if ($.inArray(prefix, prefixList) < 0) {
					prefixList.push(prefix);
				}
				if (!(prefix in prefixMap)) {
					prefixMap[prefix] = uri;
				}
			},
			removePrefix: function(prefix) {
				var uri = prefixMap[prefix];
				var prefixList = uriMap[uri];
				delete prefixMap[prefix];
				var prefixIndex = $.inArray(prefix, prefixList);
				if (prefixIndex >= 0) {
					delete prefixList[prefixIndex];
				}
			},
			removeURI: function(uri) {
				var prefixList = uriMap[uri];
				$.each(prefixList, function(index, prefix) {
					delete prefixMap[prefix];
				});
				delete uriMap[uri];
			}
		});
		return this;
	}
	$.extend(true, $, {
		xmlns: {}
	});
	$.extend(true, $.xmlns, new Namespace());
	$.fn.xpath = function(namespace, path, resultType) {
		var rv = [];
		if (namespace instanceof Namespace) {
			resultType = resultType || XPathResult.ANY_TYPE;
		} else if ($.isNumeric(namespace) || $.type(namespace) === 'string') {
			resultType = path || XPathResult.ANY_TYPE;
			path = namespace;
			namespace = $.xmlns;
		}
		if ($.type(resultType) === 'string') {
			if (resultType === 'string') {
				resultType = XPathResult.STRING_TYPE;
			} else if (resultType === 'number') {
				resultType = XPathResult.NUMBER_TYPE;
			} else if (resultType === 'boolean') {
				resultType = XPathResult.BOOLEAN_TYPE;
			} else if (resultType === 'node') {
				resultType = XPathResult.FIRST_ORDERED_NODE_TYPE;
			} else if (resultType === 'nodeset' || resultType === 'nodes') {
				resultType = XPathResult.ORDERED_NODE_ITERATOR_TYPE;
			}
		}
		this.each(function() {
			var ownerDoc = this.ownerDocument;
			if (ownerDoc === null) {
				ownerDoc = this;
			}
			var r = null;
			try {
				r = ownerDoc.evaluate(path, this, namespace.lookupNamespace, resultType, null);
			} catch (ex) {
				console.error(ex);
			}
			if (!!!r) {
				return true;
			}
			var t = r.resultType;
			if (t === XPathResult.BOOLEAN_TYPE) {
				rv = r.booleanValue;
				return false;
			} else if (t === XPathResult.NUMBER_TYPE) {
				rv = r.numberValue;
				return false;
			} else if (t === XPathResult.STRING_TYPE) {
				rv = r.stringValue;
				return false;
			} else if (t === XPathResult.ORDERED_NODE_ITERATOR_TYPE || t === XPathResult.UNORDERED_NODE_ITERATOR_TYPE) {
				try {
					var node;
					while ((node = r.iterateNext()) !== null) {
						if ($.inArray(node, rv) < 0) {
							rv.push(node);
						}
					}
				} catch (ex) {
					console.error(ex);
				}
			} else if (t === XPathResult.ORDERED_NODE_SNAPSHOT_TYPE || t === XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE) {
				for (var i = 0; i < r.snapshotLength; i++) {
					var item = r.snapshotItem(i);
					if ($.inArray(item, rv) < 0) {
						rv.push(item);
					}
				}
			} else if (t === XPathResult.ANY_UNORDERED_NODE_TYPE || t === XPathResult.FIRST_ORDERED_NODE_TYPE) {
				if (r.singleNodeValue === null) {
					rv = [];
				} else {
					rv = [r.singleNodeValue];
				}
				return false;
			}
		});
		if (this.length === 0 || ($.isArray(rv) && rv.length === 0)) {
			if (resultType === XPathResult.STRING_TYPE || resultType === XPathResult.NUMBER_TYPE || resultType === XPathResult.BOOLEAN_TYPE) {
				return null;
			}
		}
		if ($.isArray(rv)) {
			return $(rv);
		}
		return rv;
	};
})(jQuery, document, window);