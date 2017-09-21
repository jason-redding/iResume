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

(function() {
	var calendar_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	var calendar_month_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var calendar_day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	var calendar_day_names_compact = ['S', 'M', 'T', 'W', 'R', 'F', 'S'];
	var PATTERN_ISO8601 = /((\d{4})-(\d{1,2})-(\d{1,2}))T((\d{1,2}):(\d{1,2}):((\d{1,2})(\.(\d+))?))Z?/;
	var PATTERN_DATETIME = /^(0*(\d{4})-0*(\d{1,2})(?:-0*(\d{1,2}))?|(0*(\d{4})-0*(\d{1,2})-0*(\d{1,2}))T(0*(\d{1,2}):0*(\d{1,2})(?::(0*(\d{1,2})(\.0*(\d+))?))?)Z?)$/;
	Date.from = function(text) {
		var m = PATTERN_DATETIME.exec(text);
		if (m !== null && m.length > 0) {
			var year, month, day, hour, minute, second, millisecond;
			if ($.type(m[2]) !== 'undefined') {
				// if date but no time
				if ($.trim(m[2]).length > 0) {
					year = parseInt($.trim(m[2]));
				}
				if ($.trim(m[3]).length > 0) {
					month = parseInt($.trim(m[3])) - 1;
				}
				if ($.trim(m[4]).length > 0) {
					day = parseInt($.trim(m[4]));
				} else {
					day = 1;
				}
				hour = minute = second = millisecond = 0;
			} else {
				// if date and time
				year = parseInt($.trim(m[6]));
				month = parseInt($.trim(m[7])) - 1;
				day = parseInt($.trim(m[8]));
				hour = parseInt($.trim(m[10]));
				minute = parseInt($.trim(m[11]));
				if ($.type(m[13]) !== 'undefined') {
					second = parseInt($.trim(m[13]));
				} else {
					second = 0;
				}
				if ($.type(m[15]) !== 'undefined') {
					millisecond = parseInt($.trim(m[15]));
				} else {
					millisecond = 0;
				}
			}
			return new Date(year, month, day, hour, minute, second, millisecond);
		}
		return null;
	};
	String.isDateISO8601 = function(value) {
		return PATTERN_ISO8601.test(value);
	};
	String.formatISO8601Date = function(value) {
		if (String.isDateISO8601(value)) {
			return value.replace(PATTERN_ISO8601, '$3/$4/$2 $6:$7:$9');
		}
		return value;
	};
	String.dateFromISO8601 = function(value) {
		return new Date(String.formatISO8601Date(value));
	};
	String.prototype.decodeHTML = function() {
		return this.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
		.replace(/&apos;/g, '\'').replace(/&quot;/g, '"');
	};
	String.prototype.removeHTML = function() {
		var inQuote = false;
		var inTag = false;
		var ch;
		var text = '';
		var s = this;
		for (var i = 0; i < s.length; i++) {
			ch = s.substring(i, i + 1);
			if (inTag && ch === '"' && s.substring(i - 1, i) !== '\\') {
				inQuote = !inQuote;
				continue;
			} else if (!inQuote && ch === '<') {
				inTag = true;
				continue;
			} else if (!inQuote && ch === '>') {
				inTag = false;
				continue;
			}
			if (inTag) {
				continue;
			}
			text += ch;
		}
		return text.replace(/(\s)+/g, '$1');
	};
	String.prototype.format = function(props) {
		return String.format(this, props);
	};
	String.prototype.linkUp = function(props) {
		return String.linkUp(this, props);
	};
	String.linkUp = function(value, props) {
		var PATTERN_URL = /\b([a-z][-a-z0-9+.]*):\/\/(?:([-a-z0-9._~%!$&'()*+,;=]+)@)?([-a-z0-9._~%]+|\[[a-f0-9:.]+\]|\[v[a-f0-9][-a-z0-9._~%!$&'()*+,;=:]+\])(?::([0-9]+))?((?:\/([-a-z0-9._~%!$&'()*+,;=:@]+))*\/?)(\?[-a-z0-9._~%!$&'()*+,;=:@\/?]*)?(\#[-a-z0-9._~%!$&'()*+,;=:@\/?]*)?\b/gi;
		var attrs = '';
		for (var n in props) {
			attrs += ' ' + n + '="' + props[n] + '"';
		}
//	var self = value;
		var r = value.replace(PATTERN_URL, function(url, protocol, user, host, port, path, file, query, fragment, off, str) {
//		console.group(url);
//		console.log('protocol:' + protocol);
//		console.log('user:' + user);
//		console.log('host:' + host);
//		console.log('port:' + port);
//		console.log('path:' + path);
//		console.log('file:' + file);
//		console.log('query:' + query);
//		console.log('fragment:' + fragment);
//		console.groupEnd();
			var r = '<a href="' + url + '"';
			r += attrs + '>' + url + '</a>';
			return r;
		});
		return r.toString();
	};
	String.parseArgs = function(input, props) {
		var args = [];
		if ($.type(input) !== 'string') {
			return args;
		}
		var pos = 0;
		var startIndex = 0;
		var openType = {
			"'": 'string',
			'"': 'string',
			'[': 'array',
			'{': 'object'
		};
		var closeType = {
			"'": 'string',
			'"': 'string',
			']': 'array',
			'}': 'object'
		};
		var openPairs = {
			array: '[',
			object: '{'
		};
		var closePairs = {
			array: ']',
			object: '}'
		};
		var depth = {};
		var c, token, types = [];
		var inString = false;
		token = '';
		while ((c = next()) !== null) {
			if (inString !== false) {
				if (c === '\\' && input.charAt(startIndex) === inString) {
					token += "'";
					startIndex++;
					continue;
				} else if (c !== inString) {
					token += c;
					continue;
				}
			}
			if (/\s/.test(c)) {
				continue;
			} else if (/['"]/.test(c)) {
				if (c === inString) {
					token += '"';
					inString = false;
					if ($.inArray('array', types) === -1 && $.inArray('object', types) === -1 && types[types.length - 1] === closeType[c]) {
						evalArg(token);
					} else {
						types.pop();
					}
					continue;
				} else {
					inString = c;
					c = '"';
				}
			} else if (/\d/.test(c)) {
				types.push('number');
				var hasDot = false;
				token += c;
				while ((c = next()) !== null) {
					if (/[.\d]/.test(c)) {
						if (c === '.') {
							if (!hasDot) {
								hasDot = true;
							} else {
								break;
							}
						}
						token += c;
					} else {
						if (($.inArray('array', types) === -1 && $.inArray('object', types) === -1) && c === ',') {
							evalArg(token);
						} else {
							types.pop();
						}
						break;
					}
				}
				if (c === null) {
					continue;
				}
			}
			if (c in openType) {
				types.push(openType[c]);
				token += c;
				doOpen(c);
				continue;
			} else if (c in closeType) {
				token += c;
				if ((closeType[c] in depth) && types[types.length - 1] === closeType[c] && depth[closeType[c]] === 1) {
					evalArg(token);
					continue;
				}
			} else if (($.inArray('array', types) === -1 && $.inArray('object', types) === -1) && c === ',') {
				token = '';
				continue;
			}
			token += c;
		}
		if (token.length > 0) {
			evalArg(token);
		}
		function evalArg() {
			var type = types.pop();
			try {
				if (type === 'string') {
					token = ('' + token).replace(/(^"|"$)/g, '');
				} else if (type === 'number') {
					token = parseFloat(token);
				} else if (type === 'object' || type === 'array') {
					token = JSON.parse(token);
				} else {
					try {
						var temp = String.format('${' + token + '}', props);
						token = temp;
					} catch (ex) {
						console.dir(ex);
					}
				}
			} catch (ex) {
				console.dir(ex);
			}
			args.push(token);
			token = '';
		}
		function doOpen(c) {
			if (!(c in openType) || !(openType[c] in openPairs)) {
				return;
			}
			if (!(c in depth)) {
				depth[openType[c]] = 0;
			}
			depth[openType[c]]++;
		}
		function doClose() {
			if (!(c in openType) || !(openType[c] in closePairs)) {
				return;
			}
			c = closePairs[c];
			if (!(c in depth)) {
				depth[c] = 1;
			}
			depth[c]--;
		}
		function next(peek) {
			if (startIndex < input.length) {
				var r = input.substring(startIndex, startIndex + 1);
				if (peek !== true) {
					startIndex++;
				}
				return r;
			}
			return null;
		}
		return args;
	};
	String.format = function(format, props, defaultProperties) {
		var out = '';
		//if (!$.isPlainObject(props)) {
		//	props = {};
		//}
		if (typeof props === 'undefined') {
			props = {};
		}
		if (typeof format === 'string' && format.length > 0) {
			var startIndex = 0;
			var si;
			var c;
			var depth = 0;
			var token = '';
			var findOpen = function(ch) {
				si = format.indexOf(ch, startIndex);
				if (si >= startIndex) {
					out += format.substring(startIndex, si);
					startIndex = si + ch.length;
					doOpen();
				} else {
					if (startIndex < format.length) {
						out += format.substring(startIndex);
					}
					startIndex = format.length;
				}
			};
			var doOpen = function() {
				depth++;
			};
			var doClose = function() {
				depth--;
			};
			var next = function(peek) {
				if (startIndex < format.length) {
					var r = format.substring(startIndex, startIndex + 1);
					if (peek !== true) {
						startIndex++;
					}
					return r;
				}
				return null;
			};
			var evalToken = function(token) {
				var t = token.split('#', 2);
				var rv = null;
				var tn;
				var tf = null;
				tn = t[0];
				if (t.length > 1) {
					tf = t[1];
				}
				//rv = (tn in props ? props[tn] : null);
				var propScope = props;
				var tpath = tn.split('.');
				$.each(tpath, function(pathIndex, scopeName) {
					while (true) {
						try {
							if (scopeName in propScope) {
								propScope = propScope[scopeName];
								break;
							}
						} catch (ex) {
						}
						rv = null;
						return false;
					}
					if (pathIndex === (tpath.length - 1)) {
						if ($.isPlainObject(propScope)) {
							if ($.type(defaultProperties) === 'string') {
								defaultProperties = [defaultProperties];
							}
							var defaultProperty = null;
							if ($.isArray(defaultProperties)) {
								$.each(defaultProperties, function(propIndex, propName) {
									if (propName in propScope) {
										defaultProperty = propName;
										return false;
									}
								});
							}
							if (defaultProperty !== null) {
								rv = propScope[defaultProperty];
							} else {
								rv = null;
							}
						} else {
							rv = propScope;
						}
					}
				});

				out += evalTokenMod(tn, tf, rv, props);
			};
			var evalTokenMod = function(token, format, value, props) {
				if (format === null) {
					if (value instanceof Date) {
						format = "date('M/d/yyyy')";
					} else {
						format = 'raw';
					}
				}
				var pattern = /^([a-z-][.a-z0-9-]*)(?:\(\s*([^,]*(,[^,]*)*)\s*\))?$/;
				var matcher = null;
				if (!pattern.test(format)) {
					if (value instanceof Date) {
						format = 'date("' + format + '")';
					}
				}
				if ((matcher = pattern.exec(format)) !== null && matcher.length > 0) {
					var fName = matcher[1];
					var fArgs = String.parseArgs(matcher[2], props);
					if (fName === 'raw') {
					} else if (fName === 'text') {
						value = ('' + value).removeHTML().decodeHTML();
					} else if (fName === 'html') {
						value = ('' + value).decodeHTML();
					} else if (fName === 'date') {
						if (value instanceof Date) {
							value = Date.format(value, fArgs[0]);
						}
					} else if (fName === 'grammar') {
						if (fArgs.length > 1) {
							if (parseFloat($.trim(value)) === 1) {
								value = fArgs[0];
							} else {
								value = fArgs[1];
							}
						}
					} else if (fName === 'percent') {
						if (fArgs.length === 0) {
							fArgs.push(0);
						}
						if (fArgs.length < 2) {
							fArgs.unshift(0);
						}
						value = Number.prototype.toFixed.call((parseFloat(value) * 100), parseFloat(fArgs[1]));
						value = value.replace(new RegExp('\\.?0{0,' + (parseInt(fArgs[1]) - parseInt(fArgs[0])) + '}$'), '') + '%';
					} else if (fName === 'round') {
						value = Number.prototype.toFixed.call((parseFloat(value) * 100), parseFloat(fArgs[0] || 0));
					} else if (fName === 'instead') {
						value = fArgs[0];
					} else if (fName === 'default') {
						if (fArgs.length === 0) {
							fArgs.push('');
						}
						if (value === null) {
							value = fArgs[0];
						}
//						try {
//							console.log(value);
//							var temp = evalToken(value);
//							console.log(temp);
//							//value = temp;
//						} catch (ex) {
//							console.dir(ex);
//						}
					} else if (/^upper(case)?$/.test(fName)) {
						value = ('' + value).toUpperCase();
					} else if (/^lower(case)?$/.test(fName)) {
						value = ('' + value).toLowerCase();
					}
				}
				if (value === null) {
					value = '';
				}
				return value;
			};

			while (startIndex < format.length) {
				findOpen('${');
				if (startIndex >= format.length) {
					break;
				}
				token = '';
				while ((c = next()) !== null) {
					if (c === '{') {
						doOpen();
					} else if (c === '}') {
						doClose();
						if (depth === 0) {
							evalToken(token);
							break;
						}
					}
					token += c;
				}
			}
		} else {
			out = '';
		}
		return out;
	};
	Number.prototype.getSuffix = function(includeNumber) {
		return Number.getSuffix(this, includeNumber);
	};
	Number.getSuffix = function(value, includeNumber) {
		if (typeof includeNumber !== 'boolean') {
			includeNumber = false;
		}
		var suffix;
		var sNum = ('' + value);
		var lastDigit = parseInt(sNum.substring(sNum.length - 1));
		var lastTwoDigits = (sNum.length > 1 ? parseInt(sNum.substring(sNum.length - 2)) : 0);
		if (lastTwoDigits > 10 && lastTwoDigits < 20) {
			suffix = 'th';
		} else if (lastDigit === 1) {
			suffix = 'st';
		} else if (lastDigit === 2) {
			suffix = 'nd';
		} else if (lastDigit === 3) {
			suffix = 'rd';
		} else {
			suffix = 'th';
		}
		return ((includeNumber ? value : '') + suffix);
	};
	Date.prototype.relativeToNow = function() {
		var dSelf = this;
		var date = new Date();

		var r = '';
		var sTime = parseInt(dSelf.getTime() / 1000);
		var dTime = parseInt(date.getTime() / 1000);
		var td = (sTime - dTime);
		var as = Math.abs(td);
		var am = parseInt(as / 60);
		var ah = parseInt(as / 60 / 60);
		var ad = parseInt(as / 60 / 60 / 24);
		var aM = parseInt(as / 60 / 60 / 24 / 30);
		var ay = parseInt(as / 60 / 60 / 24 / 365);

		if (ay > 0) {
			r = ay + ' year' + (ay === 1 ? '' : 's');
		} else if (aM > 0) {
			r = aM + ' month' + (aM === 1 ? '' : 's');
		} else if (ad > 0) {
			if (ad === 1) {
				return (td < 0 ? 'yesterday' : 'tomorrow');
			}
			r = ad + ' day' + (ad === 1 ? '' : 's');
		} else if (ah > 0) {
			r = ah + ' hour' + (ah === 1 ? '' : 's');
		} else if (am > 0) {
			r = am + ' minute' + (am === 1 ? '' : 's');
		} else if (as > 0) {
			r = as + ' second' + (as === 1 ? '' : 's');
		}
		r += (td < 0 ? ' ago' : ' from now');

		return r;
	};
	Date.format = function(date, format) {
		var ampm = 'AM';
		var y = date.getFullYear();
		var M = (date.getMonth() + 1);
		var d = date.getDate();
		var diw = (date.getDay() + 1);
		var H = date.getHours();
		var h = H;
		var m = date.getMinutes();
		var s = date.getSeconds();
		var S = date.getMilliseconds();
		if (H >= 12) {
			if (H > 12) {
				h = H - 12;
			}
			ampm = 'PM';
		}
		if (h === 0) {
			h = 12;
		}
		var out;
		if (('' + format).length === 0) {
			format = 'M/d/yyyy h:mm:ss aa';
		}
		var PATTERN_ALL_SYMBOLS = /('[^']*'|'[^']*$|(y|M|d|F|E|a|H|k|K|h|m|s|S)+(\{[^}]*\})?)/gm;
		var regexReplace = function(match) {
			var lastChar = match.substring(match.length - 1);
			var mm = match.substring(0, 1);
			var mods = [];
			if (match.length >= 3 && lastChar === '}') {
				var modStart = match.lastIndexOf('{');
				if (modStart > 0) {
					mods = match.substring(modStart + 1, match.length - 1).split(/[,|;]+/);
					match = match.substring(0, modStart);
				}
			}
			var rv = '';
			while (true) {
				if (mm === '\'') {
					if (lastChar === '\'') {
						if (match.length > 1) {
							if (match.length === 2) {
								rv = '\'';
							} else {
								rv = match.substring(1, match.length - 1);
							}
						} else {
							rv = '\'';
						}
					} else {
						rv = match.substring(1);
					}
				} else if (mm === 'y') {
					var sy = ('' + y);
					rv = sy.substring(Math.max(0, sy.length - match.length)).padLeft(match.length, '0');
				} else if (mm === 'M') {
					if (match.length >= 4) {
						rv = calendar_month_names[M - 1];
					} else if (match.length >= 3) {
						rv = calendar_month_names[M - 1].substring(0, 3);
					} else {
						rv = ('' + M).padLeft(match.length, '0');
					}
				} else if (mm === 'd') {
					rv = ('' + d).padLeft(match.length, '0');
				} else if (mm === 'F') {
					rv = ('' + diw).padLeft(match.length, '0');
				} else if (mm === 'E') {
					if (match.length >= 4) {
						rv = calendar_day_names[diw - 1];
					} else if (match.length >= 2) {
						rv = calendar_day_names[diw - 1].substring(0, match.length);
					} else {
						rv = calendar_day_names_compact[diw - 1];
					}
				} else if (mm === 'a') {
					rv = ampm.substring(0, Math.min(match.length, 2));
				} else if (mm === 'H') {
					rv = ('' + H).padLeft(match.length, '0');
				} else if (mm === 'k') {
					rv = ('' + (H + 1)).padLeft(match.length, '0');
				} else if (mm === 'K') {
					rv = ('' + (h - 1)).padLeft(match.length, '0');
				} else if (mm === 'h') {
					rv = ('' + h).padLeft(match.length, '0');
				} else if (mm === 'm') {
					rv = ('' + m).padLeft(match.length, '0');
				} else if (mm === 's') {
					rv = ('' + s).padLeft(match.length, '0');
				} else if (mm === 'S') {
					rv = ('' + S).padLeft(match.length, '0');
				} else {
					rv = match;
				}
				break;
			}
			//			alert("'" + match + "'.length = " + match.length + "\nreplaced with: '" + rv + "'.length = " + rv.length);
			var num = parseInt(rv);
			var isNum = !isNaN(num);
			var mod = '';
			for (var i = 0; i < mods.length; i++) {
				mod = mods[i];
				if (/^(st|nd|rd|th)$/i.test(mod) && isNum) {
					rv += Number.getSuffix(num);
				} else if (/^upper(case)?$/i.test(mod) && !isNum) {
					rv = rv.toUpperCase();
				} else if (/^lower(case)?$/i.test(mod) && !isNum) {
					rv = rv.toLowerCase();
				}
			}
			return rv;
		};
		out = ('' + format).replace(PATTERN_ALL_SYMBOLS, regexReplace, 'gm');
		return out;
	};
	Date.prototype.format = function(format) {
		return Date.format(this, format);
	};
	Date.isLeapYear = function(year) {
		return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0);
	};
	Date.prototype.isLeapYear = function() {
		return Date.isLeapYear(this.getFullYear());
	};
	Date.prototype.getPreviousMonth = function() {
		var mi = this.getMonth();
		var yo = 0;
		if (mi === 0) {
			mi = 11;
			yo = -1;
		} else {
			mi--;
		}
		return new Date(this.getFullYear() + yo, mi, 1);
	};
	Date.prototype.getNextMonth = function() {
		var mi = this.getMonth();
		var yo = 0;
		if (mi === 11) {
			mi = 0;
			yo = 1;
		} else {
			mi++;
		}
		return new Date(this.getFullYear() + yo, mi, 1);
	};
	Date.getCompactDayName = function(day) {
		return (calendar_day_names_compact[day]);
	};
	Date.getDayName = function(day) {
		return (calendar_day_names[day]);
	};
	Date.prototype.getCompactDayName = function() {
		return Date.getCompactDayName(this.getDay());
	};
	Date.prototype.getDayName = function() {
		return Date.getDayName(this.getDay());
	};
	Date.prototype.getMonthStartingDay = function() {
		var date = new Date(this.getFullYear(), this.getMonth(), 1);
		return date.getDay();
	};
	Date.getMonthName = function(month) {
		return (calendar_month_names[month]);
	};
	Date.prototype.getMonthName = function() {
		return Date.getMonthName(this.getMonth());
	};
	Date.prototype.getMonthLength = function() {
		var mi = this.getMonth();
		var c = (calendar_days_in_month[mi]);
		if (mi === 1) { // February only!
			if (this.isLeapYear()) {
				c = 29;
			}
		}
		return c;
	};
	Date.prototype.getMonthRowCount = function() {
		var mLength = this.getMonthLength();
		var dOffset = this.getMonthStartingDay();
		return Math.ceil(((mLength + dOffset) / 7));
	};
	String.prototype.padLeft = function(size, c) {
		if (this.length >= size) {
			return this;
		}
		c = c.substring(0, 1);
		var p = '';
		for (var i = this.length; i < size; i++) {
			p += c;
		}
		return (p + this);
	};
	String.prototype.padRight = function(size, c) {
		if (this.length >= size) {
			return this;
		}
		c = c.substring(0, 1);
		var p = '';
		for (var i = this.length; i < size; i++) {
			p += c;
		}
		return (this + p);
	};
})();
