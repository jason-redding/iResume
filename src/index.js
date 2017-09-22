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
	var DEFAULT_SORT_COLUMN = 'name';
	var PATTERN_DATA_RENDER_PREFIX = /^data-render-(.+)$/i;

	function onReady() {
		var $tabsNav = $('#tabs-nav');
		$tabsNav
		.find(':radio')
		.on('click', function(event) {
			var $this = $(this);
			$(document.activeElement).blur();
			var tooltipInstance = $(document).tooltip('instance');
			if ($.type(tooltipInstance) !== 'undefined') {
				$.each(tooltipInstance.tooltips, function(id, tooltipData) {
					tooltipData.element.trigger('focusout').trigger('mouseleave');
				});
			}
			var $selectedPanel = $('.tab-panel[data-panel="' + $this.val() + '"]');
			$('.tab-panel').not($selectedPanel).addClass('ui-screen-hidden');
			$selectedPanel.removeClass('ui-screen-hidden');
		});

		var $skillsTable = $('#skills-table');
		$skillsTable.on('mouseenter mouseleave', 'tbody > tr', function(event) {
			var $this = $(this);
			var isEnter = (event.type === 'mouseenter');
			var activeElement = document.activeElement;
			$(activeElement).blur();
			//console.log(event.type + '!', String.format('Current: "${name}"', $this.templateProperties(), ['value', 'originalValue']), String.format('lastBlurred: "${name}"', $(activeElement).templateProperties(), ['value', 'originalValue']));
			if (isEnter) {
				if (activeElement !== this) {
					$this.focus();
				}
			}
		});
		$skillsTable.on('focusin focusout', 'tbody > tr', function(event) {
			if (!$(event.target).is('tr')) {
				return;
			}
			var $this = $(this);
			var isEnter = (event.type === 'focusin');
			//var lastBlurred = $skillsTable.data('last-blurred');
			//console.log(event.type + '!', String.format('Current: "${name}"', $this.templateProperties(), ['value', 'originalValue']), String.format('lastBlurred: "${name}"', $(lastBlurred).templateProperties(), ['value', 'originalValue']));
			if (isEnter) {
				$skillsTable.removeData('last-blurred');
				//console.log('lastBlurred set to null');
			} else {
				$skillsTable.data('last-blurred', this);
				//console.log(String.format('lastBlurred set to "${name}"', $this.templateProperties(), ['value', 'originalValue']));
			}
			$this.children()[isEnter ? 'addClass' : 'removeClass']('ui-state-hover');
		});
		$skillsTable.on('tap', 'tbody > tr', function(event) {
			var $this = $(this);
			var lastBlurred = $skillsTable.data('last-blurred');
			//console.log('tap!', String.format('Current: "${name}"', $this.templateProperties(), ['value', 'originalValue']), String.format('lastBlurred: "${name}"', $(lastBlurred).templateProperties(), ['value', 'originalValue']));
			if (document.activeElement === this) {
				if ($.type(lastBlurred) === 'undefined' && lastBlurred !== this) {
					$this.blur();
					event.stopPropagation();
					event.preventDefault();
				}
			}
		});
		//$skillsTable.on('mouseenter mouseleave', 'thead > tr > th', function(event) {
		//	var $this = $(this);
		//	var isEnter = (event.type === 'mouseenter');
		//	if ($this.is('.sort-by')) {
		//		return;
		//	}
		//	$this[isEnter ? 'addClass' : 'removeClass']('ui-state-default');
		//});
		$skillsTable.on('click', 'th[data-order-by]', function(event) {
			var $this = $(this);
			var sortOrder = $.trim($this.attr('data-sort-order'));
			var orderBy = $.trim($this.attr('data-order-by')).split(/\s*,+\s*/);
			var fieldName = $.trim($this.attr('data-field'));
			if (sortOrder.length === 0) {
				var m = /:(asc|desc)$/.exec(orderBy[0]);
				if (m !== null && m.length > 0) {
					sortOrder = m[1];
				} else {
					sortOrder = 'asc';
				}
			}
			if ($this.is('.sort-by')) {
				sortOrder = (sortOrder === 'asc' ? 'desc' : 'asc');
			}
			$this.attr('data-sort-order', sortOrder);
			if (fieldName.length > 0) {
				sortSkills($skillsTable, fieldName);
			}
		});

		$(document).tooltip({
			items: 'table.skills > tbody [title], #tab-panel-resume [title]',
			content: function() {
				var $this = $(this);
				var title = $.trim($this.attr('title'));
				if ($this.is('span.skill')) {
					var r = '<div class="header" style="font-size: 1.3em; margin-bottom: 0.5em; text-align: center;">' + $.trim($this.text()) + '</div>';
					r += '<div style="white-space:pre-wrap">' + title + '</div>';
					return r;
				}
				return title;
			},
			show: {
				delay: 500
			},
			open: function(event, ui) {
			},
			position: {
				my: 'center bottom',
				at: 'center top-15',
				collision: 'flipfit',
				using: function(position, feedback) {
					$(this).css(position);
					$('<div>')
					.addClass('arrow')
					.addClass(feedback.vertical)
					.addClass(feedback.horizontal)
					.appendTo(this);
				}
			}
		});

		$('#theme-toggle-button').on('click', function(event) {
			var $body = $('body');
			var pageTheme = $body.pagecontainer('option', 'theme');
			var newPageTheme = (pageTheme !== 'a' ? 'a' : 'b');
			$body
			.pagecontainer('option', 'theme', newPageTheme);

			$('#highlight-theme').attr('href', '/css/highlight/atom-one-' + (newPageTheme !== 'a' ? 'dark' : 'light') + '.css');
			$('#jqueryui-theme').attr('href', '/css/jquery-ui.' + (newPageTheme !== 'a' ? 'dark-hive' : 'cupertino') + '.theme.min.css');

			$('*[class], *[data-theme]')
			.each(function() {
				var $this = $(this);
				var rv;
				var attrTheme = $.trim($this.attr('data-theme'));
				if (attrTheme.length > 0) {
					$this.attr('data-theme', (attrTheme !== 'a' ? 'a' : 'b'));
				}
				var classes = $.trim($this.attr('class')).split(/\s+/);
				var themeSuffix = /^(.+?)((-theme-|-)(a|b))$/;
				$.each(classes, function(index, className) {
					var matcher = themeSuffix.exec(className);
					if (matcher !== null && matcher.length > 0) {
						if (/^ui-(block|grid)-/.test(matcher[1])) {
							return true;
						}
						rv = true;
						$this.removeClass(matcher[0]);
						if ($this.is('.ui-loader')) {
							$this.addClass(matcher[1] + matcher[3] + pageTheme);
						} else {
							$this.addClass(matcher[1] + matcher[3] + newPageTheme);
						}
						return false;
					}
				});
				return rv;
			});
		});

		$('#highlight-theme-picker')
		.find('option[value="' + $.trim($('#highlight-theme').attr('href'))
		.replace(/^.*?\/([a-z0-9_-]+\.css)$/, '$1') + '"]')
		.first()
		.each(function() {
			var $this = $(this);
			$this.prop('selected', true);
			try {
				$this.closest('select')
				.selectmenu('refresh');
			} catch (ex) {
			}
		})
		.end()
		.end()
		.on('change', function(event) {
			$('#highlight-theme').attr('href', '/css/highlight/' + $(this).val());
		});

		$('#select-code')
		.on('change', function(event) {
			var $this = $(this);
			var path = $.trim($this.val());
			var $codeView = $('pre#view-code > code');
			var originalClasses;
			if ($codeView.is('[data-original-classes]')) {
				originalClasses = $.trim($codeView.attr('data-original-classes'));
			} else {
				$codeView.attr('data-original-classes', originalClasses = $.trim($codeView.attr('class')));
			}
			loadCode(path)
			.always(function(data, status, xhr) {
				var v = data;
				if ($.type(v) === 'string') {
					v = $.trim(xhr.responseText);
				} else {
					v = '';
				}
				$codeView.text(v);
				$codeView.attr('class', originalClasses);
				hljs.highlightBlock($codeView[0]);
				$codeView
				.closest('.tab-panel')
				[v.length > 0 ? 'addClass' : 'removeClass']('data-loaded');
			});
		})
		.triggerHandler('change');

		var $allInitButtons = $('.init-button');
		$allInitButtons.one('click.init', function(event) {
			loadOnlyResumeData();
		});

		var $navTabRadios = $tabsNav.find(':radio');
		var $defaultSelected = $();
		$navTabRadios.each(function() {
			var $this = $(this);
			var ds = ($.trim($this.attr('data-default-selected')) === 'true');
			if (ds) {
				$defaultSelected = $this;
				return false;
			}
		});
		if ($defaultSelected.length === 0) {
			$defaultSelected = $navTabRadios.first();
		}
		if ($defaultSelected.length > 0) {
			$defaultSelected.trigger('click').checkboxradio('refresh');
		}

		loadEverything();
	}

	function loadCode(path) {
		var dfd = $.Deferred();
		path = $.trim(path);
		if (path.length > 0) {
			$.ajax({
				dataType: 'text',
				url: path
			}).done(function(data, status, xhr) {
				dfd.resolve(data, status, xhr);
			})
			.fail(function(xhr, status, ex) {
				dfd.reject(xhr, status, ex);
			});
		} else {
			dfd.reject();
		}
		return dfd.promise();
	}

	function loadOnlyResumeData() {
		var $initTableButton = $('#init-table-button');
		var $initResumeBlobButton = $('#init-resume-blob-button');
		var $allInitButtons = $('.init-button');
		$allInitButtons.prop('disabled', true);
		$allInitButtons.off('click.init');
		return loadResume()
		.done(function() {
			$initTableButton
			.on('click.build', function(event) {
				initSkillsTable();
			})
			.text('Build Skills Table');
			$initResumeBlobButton
			.on('click.build', function(event) {
				buildResumeBlob();
			})
			.text('Apply XSLT to XML');
			$allInitButtons.prop('disabled', false);
		});
	}

	function loadEverything() {
		return loadResume()
		.done(function() {
			initSkillsTable();
			buildResumeBlob();
		});
	}

	function loadResume() {
		var resume;
		$(document).data('resume', resume = loadResumeXML());

		resume.done(function(docs) {
			var xmlDoc = docs[0].data;
			$.xmlns.reset(xmlDoc);
			$.xmlns.addNamespace('r', 'http://witcraft.com/xsd/resume');
			console.groupCollapsed('Namespace Prefixes');
			console.dir($.xmlns.prefixes());
			console.groupEnd();
			var $xmlCode = $('.data-xml > code');
			$xmlCode.each(function() {
				var $this = $(this);
				//$this.text(xmlDoc.documentElement.outerHTML);
				$this.text(docs[0].xhr.responseText);
				hljs.highlightBlock(this);
				$this
				.closest('.tab-panel')
				.addClass('data-loaded');
			});
		});
		return resume;
	}

	function initSkillsTable() {
		var dfd = $.Deferred();
		var resume = $(document).data('resume');
		resume.done(function(docs) {
			var xmlDoc = docs[0].data;
			var $initTableContainer = $('#init-table-container');
			$initTableContainer.remove();
			var $skillsTable = $('#skills-table');
			var $xml = $(xmlDoc).xpath('/r:resume');
			$('.author-name').text($.trim($xml.xpath('r:author/@name', 'string')));
			var $skillCategories = $('#skill-categories');
			var defaultCategory = $.trim($skillCategories.attr('data-default-category'));
			initCategories($skillCategories, $xml);
			buildSkillsTable($skillsTable)
			.done(function(docs) {
				$skillsTable.find('> thead > tr > th[data-field="' + DEFAULT_SORT_COLUMN + '"]').trigger('click');
				$skillsTable.closest('.tab-panel').addClass('final-rendering');
				if (defaultCategory.length > 0) {
					var $select = $skillCategories.find('select#categories');
					$select.find('option[value="' + defaultCategory + '"]').prop('selected', true);
					try {
						$select.selectmenu('refresh');
					} catch (ex) {
						console.error(ex);
					}
					$select.triggerHandler('change');
				}
				dfd.resolve(docs);
			});
		});
		return dfd.promise();
	}

	function initCategories($categories, $xml) {
		$categories.html('');
		var $xmlCategories = $xml.xpath('r:meta/r:skill/r:categories/r:category', 'nodeset');
		$xmlCategories.sort(function(a, b) {
			var $a = $(a);
			var $b = $(b);
			var aName = $.trim($a.text());
			var bName = $.trim($b.text());
			if (aName < bName) {
				return -1;
			} else if (aName > bName) {
				return 1;
			}
			return 0;
		});

		$('<label/>').attr({
			'for': 'categories'
		})
		.addClass('ui-hidden-accessible')
		.text('Categories: ')
		.appendTo($categories);
		var $select = $('<select/>')
		.attr({
			id: 'categories'
		});
		$('<option/>').val('*').text('Show All Skills').appendTo($select);
		$xmlCategories.each(function() {
			var $category = $(this);
			var id = $.trim($category.attr('value'));
			var name = $.trim($category.text());
			$('<option/>').attr({
				value: id
			})
			.text(name)
			.appendTo($select);
		});

		$select.on('change', function(event) {
			var $table = $('#skills-table');
			var $rows = $table.find('> tbody > tr');
			var $this = $(this);
			var skillKey = $.trim($this.val());
			var skillName = $.trim($this.find('option[value="' + skillKey + '"]').text());
			var $captionAttributes = $table
			.children('caption')
			.children('.text')
			.addBack();
			if (skillKey === '*') {
				$rows.removeClass('ui-screen-hidden');
				$captionAttributes.removeAttr('data-filter');
			} else {
				var $filteredRows = $rows.filter('.category-' + skillKey);
				$filteredRows.removeClass('ui-screen-hidden');
				$rows.not($filteredRows).addClass('ui-screen-hidden');
				$captionAttributes.attr('data-filter', skillName);
			}
			refreshTable($table);
		})
		.appendTo($categories);
		$categories.enhanceWithin();
	}

	function refreshTable($table) {
		$table.find('> tbody > tr:not(.ui-screen-hidden)').each(function(index) {
			var $this = $(this);
			var isOdd = (index % 2 === 0);
			$this
			.removeClass(isOdd ? 'even' : 'odd')
			.addClass(isOdd ? 'odd' : 'even');
		});
	}

	function loadResumeXML() {
		var dfd = $.Deferred();
		var jobs = [];
		jobs.push($.get('/resume.xml'));
		jobs.push($.get('/resume.xsl'));
		$.when.apply($.when, jobs)
		.fail(function(xhr, type, ex) {
			console.error(ex);
			dfd.reject(jobs);
		})
		.done(function() {
			$.each(arguments, function(ajaxIndex, args) {
				jobs[ajaxIndex] = {
					data: args[0],
					status: args[1],
					xhr: args[2]
				};
			});
			dfd.resolve(jobs);
		});
		return dfd.promise();
	}

	function buildResumeBlob() {
		var dfd = $.Deferred();
		var resume = $(document).data('resume');
		resume.done(function(docs) {
			if (docs.length < 2) {
				dfd.reject(docs);
				return;
			}
			var xmlDoc = docs[0].data;
			var xslDoc = docs[1].data;
			var resultDoc = null;
			var systemDate = Date.format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
			var xslTransformer = new XSLTProcessor();
			xslTransformer.importStylesheet(xslDoc);
			xslTransformer.setParameter(null, 'author-name', '0');
			xslTransformer.setParameter(null, 'system-date', systemDate);
			try {
				resultDoc = xslTransformer.transformToDocument(xmlDoc);
			} catch (ex) {
				console.error(ex);
			}
			if ($.isXMLDoc(resultDoc)) {
				$('.resume-xslt').each(function() {
					var $this = $(this);
					$this
					.closest('.tab-panel')
					.addClass('transform-applied')
					.addClass('final-rendering');
					var $pageContent = $('body > .page-wrapper > *', resultDoc);
					$this.html($pageContent);
				});
				dfd.resolve(docs);
			} else {
				dfd.reject(docs);
			}
		});
		return dfd.promise();
	}

	function buildSkillsTable($table) {
		var dfd = $.Deferred();
		var resume = $(document).data('resume');
		resume.done(function(docs) {
			var $xml = $(docs[0].data.documentElement);
			var $skillsTableHead = $table.children('thead');
			var $skillsTableBody = $table.children('tbody');
			$skillsTableBody.children().remove();
			var $xmlSkillLevels = $xml.xpath('r:meta/r:skill/r:levels/r:level', 'nodeset');
			var columnAttrRenderers = {};
			var rowAttrRenderers = [];
			$skillsTableHead.children('tr').each(function(rowIndex) {
				var $this = $(this);
				var rr;
				rowAttrRenderers.push(rr = []);
				$.each(this.attributes, function(attrIndex, attr) {
					var attrName = attr.localName;
					var attrValue = $this.attr(attrName);
					var m = PATTERN_DATA_RENDER_PREFIX.exec(attrName);
					if (m !== null && m.length > 0) {
						var targetAttrName = m[1];
						rr.push({
							template: attrValue,
							attr: targetAttrName
						});
					}
				});
			});
			$skillsTableHead.find('> tr > th').each(function() {
				var $this = $(this);
				var columnFieldName = $.trim($this.attr('data-field'));
				$.each(this.attributes, function(attrIndex, attr) {
					var attrName = attr.localName;
					var attrValue = $this.attr(attrName);
					var m = PATTERN_DATA_RENDER_PREFIX.exec(attrName);
					if (m !== null && m.length > 0) {
						var targetAttrName = m[1];
						var columnList;
						if (columnFieldName in columnAttrRenderers) {
							columnList = columnAttrRenderers[columnFieldName];
						} else {
							columnList = (columnAttrRenderers[columnFieldName] = []);
						}
						columnList.push({
							template: attrValue,
							attr: targetAttrName
						});
					}
				});
			});

			var maxLevel = 0;
			$xmlSkillLevels.each(function() {
				var $level = $(this);
				var m = parseFloat($.trim($level.attr('value')));
				if (m > maxLevel) {
					maxLevel = m;
				}
			});
			$table.attr('data-template-properties', JSON.stringify({
				levels: {
					max: maxLevel,
					preposition: $xml.xpath('r:meta/r:skill/r:levels/@preposition', 'string') || 'at'
				}
			}));

			$xml.xpath('r:skills/r:skill', 'nodeset').each(function(index, skill) {
				var $skillRow = $('<tr/>').appendTo($skillsTableBody);
				var $skill = $(skill);
				var props = extractSkillFromXML($skill);
				var renderProps = $.extend(true, $table.templateProperties(), props);
				$.each(props['categories'].originalValue, function() {
					$skillRow.addClass('category-' + this);
				});
				if ($.isArray(rowAttrRenderers) && rowAttrRenderers.length > 0) {
					$.each(rowAttrRenderers[0], function(renderIndex, render) {
						$skillRow.attr(render.attr, String.format(render.template, renderProps, ['value', 'originalValue']));
					});
				}
				$skillRow.attr('data-template-properties', JSON.stringify(props));
				$skillsTableHead.find('> tr > th').each(function() {
					var $this = $(this);
					var columnHeader = $.trim($this.attr('data-header'));
					var columnFieldName = $.trim($this.attr('data-field'));
					var columnFieldRender = $.trim($this.attr('data-render'));
					if (columnFieldRender.length === 0) {
						columnFieldRender = '${' + columnFieldName + '}';
					}
					var $cell = $('<td/>')
					.addClass('field-' + columnFieldName)
					.addClass('ui-widget-content')
					.appendTo($skillRow);
					var $cellData = $('<span/>').addClass('data').appendTo($cell);
					if (columnFieldName in props) {
						$cell.attr('data-value', props[columnFieldName].value);
						$cell.attr('data-original-value', props[columnFieldName].originalValue);
						if ($.isArray(columnAttrRenderers[columnFieldName])) {
							$.each(columnAttrRenderers[columnFieldName], function(renderIndex, render) {
								$cell.attr(render.attr, String.format(render.template, renderProps, ['value', 'originalValue']));
							});
						}
						$cell
						.attr({
							'data-field': columnFieldName,
							'data-header': columnHeader
						});
						$cellData.html(String.format(columnFieldRender, renderProps, ['value', 'originalValue']));
					}
				});
			});

			$table.closest('.tab-panel').addClass('final-rendering');
			dfd.resolve(docs);
		});
		return dfd.promise();
	}

	function sortSkills($table, sortBy) {
		var $columnHeader = $table.find('> thead > tr > th[data-field="' + sortBy + '"]');
		if ($columnHeader.length > 0) {
			$columnHeader
			.addClass('sort-by')
			.closest('thead').find('th')
			.each(function() {
				var $this = $(this);
				if (!$this.is('[data-default-sort-order]')) {
					var sortOrder = $.trim($this.attr('data-sort-order'));
					$this.attr('data-default-sort-order', sortOrder);
				}
			})
			.not($columnHeader)
			.each(function() {
				var $this = $(this);
				var defaultSortOrder = $.trim($this.attr('data-default-sort-order'));
				$this[(defaultSortOrder.length > 0 ? 'attr' : 'removeAttr')]('data-sort-order', defaultSortOrder);
			})
			.removeClass('ui-state-default')
			.removeClass('sort-by');
			var sortOrder = $.trim($columnHeader.attr('data-sort-order'));
			var sorting = $.trim($columnHeader.attr('data-order-by'));
			if (sorting.length > 0) {
				sorting = sorting.split(/\s*,+\s*/);
			} else {
				sorting = [sortBy];
			}
			var $rows = $table.find('> tbody > tr');
			if ($rows.length === 0) {
				buildSkillsTable($table)
				.done(function() {
					sortTableRows($table, sorting, sortOrder);
				});
				return;
			}
			sortTableRows($table, sorting, sortOrder);
		}
	}

	function sortTableRows($table, sorting, defaultSortOrder) {
		var $rows = $table.find('> tbody > tr');
		var sortOrder = $.trim(defaultSortOrder);
		var sortingProperties = getSortingProperties(sorting[0], sortOrder);
		var firstSortBy = $.trim($table.find('> thead th[data-field="' + sortingProperties.field + '"]').attr('data-header'));
		var $captionAttributeTargets = $table
		.children('caption')
		.children('.text')
		.addBack();
		var firstSortDirection = (sortingProperties.sortDirection === 'desc' ? 'descending' : 'ascending');
		$captionAttributeTargets.attr({
			'data-sort-direction': firstSortDirection,
			'data-order-by': firstSortBy
		});
		$table.attr('data-order-by', sortingProperties.field);
		Array.prototype.sort.call($rows, function(a, b) {
			var aRow = $(a).templateProperties();
			var bRow = $(b).templateProperties();
			var sortReturn = 0;
			$.each(sorting, function(ruleIndex, rule) {
				var sortRule = rule.split(':', 2);
				var sortColumn = sortRule[0];
				var sortDirection;
				if (ruleIndex === 0 && sortOrder.length > 0) {
					sortDirection = sortOrder;
				} else if (sortRule.length > 1) {
					sortDirection = sortRule[1];
				} else {
					sortDirection = 'asc';
				}
				var aValue = String.format('${' + sortColumn + '}', aRow, ['value', 'originalValue']);
				var bValue = String.format('${' + sortColumn + '}', bRow, ['value', 'originalValue']);
				if ($.type(aValue) === 'undefined') {
					aValue = '';
				}
				if ($.type(bValue) === 'undefined') {
					bValue = '';
				}
				if ($.isArray(aValue)) {
					aValue = aValue.join('');
				}
				if ($.isArray(bValue)) {
					bValue = bValue.join('');
				}
				if (!isNaN(parseFloat(aValue))) {
					aValue = parseFloat(aValue);
				}
				if (!isNaN(parseFloat(bValue))) {
					bValue = parseFloat(bValue);
				}
				if (typeof aValue === 'string') {
					aValue = aValue.toUpperCase();
				}
				if (typeof bValue === 'string') {
					bValue = bValue.toUpperCase();
				}
				if (aValue < bValue) {
					sortReturn = -1;
				} else if (aValue > bValue) {
					sortReturn = 1;
				} else {
					sortReturn = 0;
				}
				if (sortReturn !== 0) {
					if (sortDirection === 'desc') {
						sortReturn *= -1;
					}
					return false;
				}
			});
			return sortReturn;
		});
		$rows.parent().append($rows);
		refreshTable($table);
	}

	function getSortingProperties(rule, defaultSortOrder) {
		var sortOrder = $.trim(defaultSortOrder);
		var sortRule = rule.split(':', 2);
		var sortColumn = sortRule[0].split('.', 2)[0];
		var sortDirection;
		if (sortOrder.length > 0) {
			sortDirection = sortOrder;
		} else if (sortRule.length > 1) {
			sortDirection = sortRule[1];
		} else {
			sortDirection = 'asc';
		}
		return {
			field: sortColumn,
			sortDirection: sortDirection
		};
	}

	function extractSkillFromXML($skill) {
		var props = {};
		var $xmlSkillLevels = $skill.xpath('ancestor::r:resume/r:meta/r:skill/r:levels/r:level');
		var $xmlCategories = $skill.xpath('ancestor::r:resume/r:meta/r:skill/r:categories/r:category');
		var maxSkillLevel = 0;
		$xmlSkillLevels.each(function() {
			var level = parseFloat($.trim($(this).attr('value')));
			if (level > maxSkillLevel) {
				maxSkillLevel = level;
			}
		});
		$.each($skill.children(), function(index, element) {
			var $element = $(element);
			var nodeName = $element.prop('nodeName');
			var $items = $element.children();
			if (nodeName === 'experience') {
				var since = Date.from($.trim($element.xpath('r:since', 'string')));
				var until = Date.from($.trim($element.xpath('r:until', 'string')));
				if (!(nodeName in props)) {
					props[nodeName] = {};
				}
				$.extend(true, props[nodeName], {
					since: {
						value: since
					}
				});
				if (until !== null) {
					$.extend(true, props[nodeName], {
						until: {
							value: until
						}
					});
				}
				return true;
			}
			var text, value;
			text = $.trim($element.text());
			if ($items.length === 0) {
				if (!(nodeName in props)) {
					props[nodeName] = {};
				}
				$.extend(true, props[nodeName], {
					value: text
				});
				if (nodeName === 'level') {
					$xmlSkillLevels
					.xpath('self::*[@value = "' + Math.floor($element.attr('value')) + '"]', 'nodeset')
					.each(function() {
						$.each(this.attributes, function(attrIndex, attr) {
							var attrName = attr.localName;
							var attrValue = attr.nodeValue;
							if (!isNaN(parseFloat(attrValue))) {
								attrValue = parseFloat(attrValue);
							}
							props[nodeName][attrName] = attrValue;
						});
					});
				}
				$.each(element.attributes, function(attrIndex, attr) {
					var attrName = attr.localName;
					var attrValue = attr.nodeValue;
					if (!isNaN(parseFloat(attrValue))) {
						attrValue = parseFloat(attrValue);
					}
					props[nodeName][attrName] = attrValue;
				});
			} else {
				value = [];
				$items.each(function() {
					var $item = $(this);
					var v = $item.attr('value');
					if (!isNaN(parseFloat(v))) {
						v = parseFloat(v);
					}
					value.push(v);
				});
				if (!(nodeName in props)) {
					props[nodeName] = {};
				}
				$.extend(true, props[nodeName], {
					value: value
				});
			}
		});
		$.each(props, function(propName, propValue) {
			var originalValue = propValue.value;
			var adjustedValue = originalValue;
			if (propName === 'experience') {
				var sinceValue = propValue.since.value;
				var untilValue;
				if ('until' in propValue) {
					untilValue = propValue.until.value;
				} else {
					untilValue = new Date();
				}
				adjustedValue = Math.max(1, Math.abs(untilValue.getFullYear() - sinceValue.getFullYear()));
				$.extend(true, propValue, {
					duration: {
						value: adjustedValue
					}
				});
				return true;
			} else if (propName === 'level') {
				adjustedValue = $.trim($xmlSkillLevels.xpath('self::*[@value = "' + Math.floor(originalValue) + '"]', 'nodeset')
				.text());
				$.extend(true, propValue, {
					percentage: (parseFloat(originalValue) / parseFloat(maxSkillLevel))
				});
			} else if (propName === 'categories') {
				var cv = [];
				$.each(adjustedValue, function(index, id) {
					var value = $.trim($xmlCategories.filter('[value="' + id + '"]').text());
					if (value.length > 0) {
						cv.push(value);
					}
				});
				cv.sort();
				adjustedValue = cv.join(', ');
			}
			$.extend(true, propValue, {
				originalValue: originalValue,
				value: adjustedValue
			});
		});
		return props;
	}

	$(onReady);
})(jQuery, document, window);
