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
(function ($, document, window) {
    'use strict';

    var DEFAULT_SORT_COLUMN = 'level';
    var PATTERN_DATA_RENDER_PREFIX = /^data-render-(.+)$/i;

    function onReady() {
        var $tabsNav = $('#tabs-nav');
        $tabsNav
        .find(':radio')
        .on('click', function (event) {
            var $this = $(this);
            $(document.activeElement).blur();
            var tooltipInstance = $(document).tooltip('instance');
            if ($.type(tooltipInstance) !== 'undefined') {
                $.each(tooltipInstance.tooltips, function (id, tooltipData) {
                    tooltipData.element.trigger('focusout').trigger('mouseleave');
                });
            }
            var $selectedPanel = $('.tab-panel[data-panel="' + $this.val() + '"]');
            $('.tab-panel').not($selectedPanel).addClass('ui-screen-hidden');
            $selectedPanel.removeClass('ui-screen-hidden');
        });

        var $skillsTable = $('#skills-table');
        $skillsTable.on('mouseenter mouseleave', 'tbody > tr', function (event) {
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
        $skillsTable.on('focusin focusout', 'tbody > tr', function (event) {
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
        $skillsTable.on('tap', 'tbody > tr', function (event) {
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
        $skillsTable.on('click', 'th[data-order-by]', function (event) {
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
            items: 'table.skills > tbody *[title], #tab-panel-resume *[title]',
            content: function () {
                var $this = $(this);
                var title = $.trim($this.attr('title'));
                if ($this.is('.certificate')) {
                    var issuer = $.trim($this.attr('data-issuer'));
                    var name = $.trim($this.attr('data-name'));
                    var displayName;
                    if (issuer === name.substring(0, Math.min(name.length, issuer.length))) {
                        displayName = name;
                    } else {
                        displayName = issuer + ' ' + name;
                    }
                    var issueDateRaw = $.trim($this.attr('data-issue-date'));
                    var expireDateRaw = $.trim($this.attr('data-expire-date'));
                    var score = parseFloat($.trim($this.attr('data-score')));
                    var maxScore = parseFloat($.trim($this.attr('data-max-score')));
                    var issueDate = Date.from(issueDateRaw);
                    var expireDate = Date.from(expireDateRaw);
                    var now = new Date();
                    var issueDateKey;
                    var expireDateKey;
                    var issueDatePrecision = 'yyyy-MM';
                    var expireDatePrecision = 'yyyy-MM';
                    if (issueDateRaw.length > 8) {
                        issueDatePrecision = 'yyyy-MM-dd';
                    }
                    if (expireDateRaw.length > 8) {
                        expireDatePrecision = 'yyyy-MM-dd';
                    }
                    var issueDateMasks = {
                        'yyyy-MM': '${issue-date#date(\'MMMM yyyy\')}',
                        'yyyy-MM-dd': '${issue-date#date(\'MMMM d\')}<sup>${issue-day-of-month#suffix}</sup> ${issue-date#date(\'yyyy\')}'
                    };
                    var expireDateMasks = {
                        'yyyy-MM': '${expire-date#date(\'MMMM yyyy\')}',
                        'yyyy-MM-dd': '${expire-date#date(\'MMMM d\')}<sup>${expire-day-of-month#suffix}</sup> ${expire-date#date(\'yyyy\')}'
                    };
                    var props = {
                        'expire-day-of-month': (expireDate !== null ? expireDate.getDate() : ''),
                        'issue-day-of-month': (issueDate !== null ? issueDate.getDate() : ''),
                        'expire-date': expireDate,
                        'issue-date': issueDate
                    };
                    var r = '<div class="header" style="font-size: 1.3em; margin-bottom: 0.5em; text-align: center;">';

                    r += '<div>' + displayName + '</div>';
                    if (!isNaN(score)) {
                        r += '<div style="font-size: 0.5em; font-weight: normal;">Scored <strong>' + score + '</strong>';
                        if (!isNaN(maxScore)) {
                            r += ' of <strong>' + maxScore + '</strong>';
                        }
                        r += '</div>';
                    }

                    r += '</div>';

                    r += '<div style="font-size: 0.65em;margin-top: 1em">';

                    r += '<div>Issued by: <strong>' + issuer + '</strong></div>';

                    if (issueDate !== null) {
                        issueDateKey = issueDate.format(issueDatePrecision);
                        r += '<div>Issue Date: <strong>' + issueDateMasks[issueDatePrecision].format(props) + '</strong></div>';

                    }
                    if (expireDate !== null) {
                        expireDateKey = expireDate.format(expireDatePrecision);
                        r += '<div>' + (now.format(expireDatePrecision) <= expireDateKey ? 'Expires' : 'Expired') + ': <strong>' + expireDateMasks[expireDatePrecision].format(props) + '</strong></div>';
                    }

                    r += '</div>';
                    return r;
                } else if ($this.is('a[title][href]:not(.skill)')) {
                    var r = '<div>' + $.trim(title) + '</div>';
                    r += '<div style="font-size:0.65em;margin-top: 1em">' + $.trim($this.attr('href')) + '</div>';
                    return r;
                } else if ($this.is('[data-name][data-level][data-level-value][data-level-percentage]')) {
                    var skillVersion = $.trim($this.attr('data-version'));
                    var skillVersionHint = $.trim($this.attr('data-version-hint'));
                    var skillName = $.trim($this.attr('data-name'));
                    var r = '<div class="header" style="font-size: 1.3em; text-align: center;">';
                    if (skillName.length > 0) {
                        r += skillName;
                    } else {
                        r += $.trim($this.text());
                    }
                    if (skillVersion.length > 0 || skillVersionHint.length > 0) {
                        if (skillVersion.length > 0) {
                            r += ' ' + skillVersion;
                        }
                        if (skillVersionHint.length > 0) {
                            r += '<span style="display: block; font-size: 0.7em; font-style: italic;">';
                            if (skillVersion.length > 0) {
                                r += ' ';
                            }
                            r += '(' + skillVersionHint + ')';
                            r += '</span>';
                        }
                    }
                    r += '</div>';
                    r += '<div style="white-space:pre-wrap; margin-top: 0.8em;">' + title + '</div>';
                    return r;
                }
                return title;
            },
            show: {
                delay: 500
            },
            open: function (event, ui) {
            },
            position: {
                my: 'center bottom',
                at: 'center top-15',
                collision: 'flipfit',
                using: function (position, feedback) {
                    $(this).css(position);
                    $('<div>')
                    .addClass('arrow')
                    .addClass(feedback.vertical)
                    .addClass(feedback.horizontal)
                    .appendTo(this);
                }
            }
        });

        // $('#tab-panel-resume').on('click', 'span.skill', function(event, options) {
        //   var $this = $(this);
        //   openSkillInfo($this);
        // });

        $('#theme-toggle-button').on('click', function (event, options) {
            var $body = $('body');
            var oldPageTheme;
            var newPageTheme;
            if ($.isPlainObject(options) && ('theme' in options)) {
                newPageTheme = (options.theme !== 'a' ? 'b' : 'a');
                oldPageTheme = (newPageTheme !== 'a' ? 'a' : 'b');
            } else {
                oldPageTheme = ($body.pagecontainer('option', 'theme') !== 'a' ? 'b' : 'a');
                newPageTheme = (oldPageTheme !== 'a' ? 'a' : 'b');
            }

            savePreference('theme', newPageTheme);

            $('#highlight-theme').attr('href', '/css/highlight/atom-one-' + (newPageTheme !== 'a' ? 'dark' : 'light') + '.css');
            $('#jqueryui-theme').attr('href', '/css/jquery-ui.' + (newPageTheme !== 'a' ? 'dark-hive' : 'cupertino') + '.theme.min.css');

            $('*[class], *[data-theme]')
            .each(function () {
                var $this = $(this);
                var rv;
                var pageTheme = $this.attr('data-theme') || newPageTheme;
                if ($this.is('[data-theme]') && (pageTheme !== newPageTheme)) {
                    $this.attr('data-theme', newPageTheme);
                }
                var classes = $.trim($this.attr('class')).split(/\s+/);
                var themeSuffix = /^(.+?)((-theme-|-)(a|b))$/;
                $.each(classes, function (index, className) {
                    var matcher = themeSuffix.exec(className);
                    if (matcher !== null && matcher.length > 0) {
                        if (/^ui-(block|grid)-/.test(matcher[1])) {
                            return true;
                        }
                        rv = true;
                        if ($this.is('.ui-loader')) {
                            if (matcher[4] === oldPageTheme) {
                                return true;
                            }
                            $this.removeClass(matcher[0]);
                            $this.addClass(matcher[1] + matcher[3] + oldPageTheme);
                        } else {
                            if (matcher[4] === newPageTheme) {
                                return true;
                            }
                            $this.removeClass(matcher[0]);
                            $this.addClass(matcher[1] + matcher[3] + newPageTheme);
                        }
                        return true;
                    }
                });
                return rv;
            });

            $body
            .pagecontainer('option', 'theme', newPageTheme);
        });

        $('#highlight-theme-picker')
        .find('option[value="' + $.trim($('#highlight-theme').attr('href'))
        .replace(/^.*?\/([a-z0-9_-]+\.css)$/, '$1') + '"]')
        .first()
        .each(function () {
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
        .on('change', function (event) {
            $('#highlight-theme').attr('href', '/css/highlight/' + $(this).val());
        });

        $('#select-code')
        .on('change', function (event) {
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
            .always(function (data, status, xhr) {
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
        $allInitButtons.one('click.init', function (event) {
            loadOnlyResumeData();
        });

        enforcePreferences();

        var $navTabRadios = $tabsNav.find(':radio');
        var $defaultSelected = $();
        $navTabRadios.each(function () {
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

    function openSkillInfo(skillNode) {

    }

    function enforcePreferences() {
        if (('localStorage' in window)) {
            var theme = null;
            try {
                theme = window.localStorage.getItem('theme');
            } catch (ex) {
            }
            if (theme !== null) {
                $('#theme-toggle-button').trigger('click', {
                    theme: theme
                });
            }
        }
    }

    function savePreference(name, value) {
        if (('localStorage' in window)) {
            try {
                window.localStorage.setItem(name, value);
            } catch (ex) {
            }
        }
    }

    function loadCode(path) {
        var dfd = $.Deferred();
        path = $.trim(path);
        if (path.length > 0) {
            $.ajax({
                dataType: 'text',
                url: path
            }).done(function (data, status, xhr) {
                dfd.resolve(data, status, xhr);
            })
            .fail(function (xhr, status, ex) {
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
        .done(function () {
            $initTableButton
            .on('click.build', function (event) {
                initSkillsTable();
            })
            .text('Build Skills Table');
            $initResumeBlobButton
            .on('click.build', function (event) {
                buildResumeBlob();
            })
            .text('Apply XSLT to XML');
            $allInitButtons.prop('disabled', false);
        });
    }

    function loadEverything() {
        return loadResume()
        .done(function () {
            initSkillsTable();
            buildResumeBlob();
        });
    }

    function loadResume() {
        var resume;
        var $document = $(document);
        resume = $document.data('resume');
        if ($.type(resume) === 'undefined') {
            $document.data('resume', resume = loadResumeXML());
        }

        resume.done(function (docs) {
            var xmlDoc = docs[0].data;

            $.xmlns.reset(xmlDoc);
            console.groupCollapsed('Namespace Prefixes');
            console.dir($.xmlns.prefixes());
            console.groupEnd();
            var $xmlCode = $('.data-xml > code');
            $xmlCode.each(function () {
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
        resume.done(function (docs) {
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
            .done(function (docs) {
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
                $('#is-relevant-category').trigger('change', {
                    checked: true
                });
                dfd.resolve(docs);
            });
        });
        return dfd.promise();
    }

    function initCategories($categories, $xml) {
        $categories.html('');
        var $xmlCategories = $xml.xpath('r:meta/r:skill/r:categories/r:category', 'nodeset');
        var relevantKey = 'relevant';
        $xmlCategories.sort(function (a, b) {
            var $a = $(a);
            var $b = $(b);
            var aName = $.trim($a.text());
            var bName = $.trim($b.text());
            if ($a.attr('value') === relevantKey) {
                return -1;
            } else if ($b.attr('value') === relevantKey) {
                return 1;
            }
            if (aName < bName) {
                return -1;
            } else if (aName > bName) {
                return 1;
            }
            return 0;
        });

        var relevantText = $.trim($xmlCategories.xpath('self::*[@value = "' + relevantKey + '"]').text());

        var $isRelevantLabel = $('<label/>').attr({
            'for': 'is-relevant-category'
        })
        .addClass('ui-shadow')
        .text('Relevant')
        .appendTo($categories);
        var $isRelevant = $('<input type="checkbox"/>')
        .attr({
            'data-wrapper-class': 'relevant-checkbox',
            'data-iconpos': 'right',
            value: '1',
            id: 'is-relevant-category'
        })
        .on('change', function (event, options) {
            var $this = $(this);
            if ($.isPlainObject(options)) {
                if ('checked' in options) {
                    $this.prop('checked', options.checked === true);
                    try {
                        $this.checkboxradio('refresh');
                    } catch (ex) {
                        console.error(ex);
                    }
                }
            }
            var $select = $('select#categories');
            var isChecked = $this.is(':checked');
            if (isChecked) {
                if (!$select.is('[data-last-value]')) {
                    $select.attr('data-last-value', $.trim($select.find('option:selected').val()));
                }
                var $relevant = $select.find('option[value="' + relevantKey + '"]');
                if ($relevant.length === 0) {
                    $relevant = $('<option/>').attr('value', relevantKey)
                    .text(relevantText)
                    .insertAfter($select.find('option[value="*"]'));
                }
                $relevant.prop('selected', true);
                $select.prop('disabled', true);
                try {
                    $select.selectmenu('disable');
                } catch (ex) {
                    console.error(ex);
                }
            } else {
                var lastValue = $.trim($select.attr('data-last-value'));
                $select.removeAttr('data-last-value');
                $select.prop('disabled', false);
                if (lastValue.length === 0 || lastValue === 'relevant') {
                    lastValue = '*';
                }
                if (lastValue.length > 0) {
                    $select.find('option[value="' + lastValue + '"]').prop('selected', true);
                }
                $select.find('option[value="' + relevantKey + '"]').remove();
                try {
                    $select.selectmenu('enable');
                } catch (ex) {
                    console.error(ex);
                }
            }
            try {
                $select.selectmenu('refresh');
            } catch (ex) {
                console.error(ex);
            }
            $select.trigger('change');
        })
        .appendTo($categories);

        var $categoriesSelectContainer = $('<div/>')
        .addClass('select-category-container')
        .prependTo($categories);

        $('<label/>').attr({
            'for': 'categories'
        })
        .addClass('ui-hidden-accessible')
        .text('Category: ')
        .appendTo($categoriesSelectContainer);

        var $select = $('<select/>')
        .attr({
            id: 'categories'
        });
        $('<option/>').val('*').text('All Categories').prependTo($select);
        $xmlCategories.each(function () {
            var $category = $(this);
            var id = $.trim($category.attr('value'));
            var name = $.trim($category.text());
            $('<option/>').attr({
                value: id
            })
            .text(name)
            .appendTo($select);
        });

        $select.on('change', function (event) {
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
        .appendTo($categoriesSelectContainer);
        $categories.enhanceWithin();
    }

    function refreshTable($table) {
        $table.find('> tbody > tr:not(.ui-screen-hidden)').each(function (index) {
            var $this = $(this);
            var isOdd = (index % 2 === 0);
            $this
            .removeClass(isOdd ? 'even' : 'odd')
            .addClass(isOdd ? 'odd' : 'even');
        });
    }

    function loadResumeXML() {
        $.mobile.loading('show', {
            text: 'Transforming résumé from XML...',
            textVisible: true
        });

        var dfd = $.Deferred();
        var jobs = [];
        jobs.push($.get('/resume.xml'));
        jobs.push($.get('/resume.xsl'));
        $.when.apply($.when, jobs)
        .fail(function (xhr, type, ex) {
            console.error(ex);
            dfd.reject(jobs);
        })
        .done(function () {
            $.each(arguments, function (ajaxIndex, args) {
                jobs[ajaxIndex] = {
                    data: args[0],
                    status: args[1],
                    xhr: args[2]
                };
            });
            dfd.resolve(jobs);
        });
        dfd.always(function () {
            $.mobile.loading('hide');
        });
        return dfd.promise();
    }

    function getLatestModifiedDate(docs) {
        if (!$.isArray(docs)) {
            docs = [docs];
        }
        var lastModifiedDate = null;
        $.each(docs, function () {
            var doc = this;
            if (('xhr' in doc)) {
                if (('getResponseHeader' in doc.xhr) && $.isFunction(doc.xhr.getResponseHeader)) {
                    var lastModified = new Date($.trim(doc.xhr.getResponseHeader('Last-Modified')));
                    if (lastModifiedDate === null || lastModifiedDate.getTime() < lastModified.getTime()) {
                        lastModifiedDate = lastModified;
                    }
                }
            }
        });
        return lastModifiedDate;
    }

    function buildResumeBlob() {
        var dfd = $.Deferred();
        var resume = $(document).data('resume');
        resume.done(function (docs) {
            if (docs.length < 2) {
                dfd.reject(docs);
                return;
            }
            var xmlDoc = docs[0].data;
            var xslDoc = docs[1].data;
            var resultDoc = null;
            var systemDate = Date.format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss');
            var latestModifiedDate = getLatestModifiedDate(docs);
            var transformParameters = {
                'author-name': '0',
                'position-sort': 'descending',
                'factor-relevance': '1',
                'system-date': systemDate
            };
            $.mobile.loading('show', {
                text: 'Applying XML Transform...',
                textVisible: true
            });
            try {
                var xslTransformer = new XSLTProcessor();
                xslTransformer.importStylesheet(xslDoc);
                $.each(transformParameters, function (name, value) {
                    xslTransformer.setParameter(null, name, value);
                });
                resultDoc = xslTransformer.transformToDocument(xmlDoc);
            } catch (ex) {
                console.error(ex);
            }
            if ($.isXMLDoc(resultDoc)) {
                $('.resume-xslt').each(function () {
                    var $xslt = $(this);
                    $xslt
                    .closest('.tab-panel')
                    .addClass('transform-applied')
                    .addClass('final-rendering');
                    var $pageContent = $('body > .page-wrapper > *', resultDoc);
                    $xslt.html($pageContent);
                    if ($.type(latestModifiedDate) === 'date') {
                        $xslt.find('.author-contact-info-value.author-last-updated').each(function () {
                            var $lastUpdated = $(this);
                            var dateFormat = $.trim($lastUpdated.attr('data-date-format'));
                            $lastUpdated.attr('data-detected-date', Date.format(latestModifiedDate, 'yyyy-MM-dd\'T\'HH:mm:ss'));
                            $lastUpdated.text(Date.format(latestModifiedDate, dateFormat));
                        });
                    }
                    if ($.isFunction($.fn.enhanceWithin)) {
                        $xslt.enhanceWithin();
                    }
                });
                dfd.resolve(docs);
            } else {
                dfd.reject(docs);
            }
        });
        dfd.always(function () {
            $.mobile.loading('hide');
        });
        return dfd.promise();
    }

    function buildSkillsTable($table) {
        var dfd = $.Deferred();
        var resume = $(document).data('resume');
        resume.done(function (docs) {
            var $xml = $(docs[0].data.documentElement);
            var $skillsTableHead = $table.children('thead');
            var $skillsTableBody = $table.children('tbody');
            $skillsTableBody.children().remove();
            var $xmlSkillLevels = $xml.xpath('r:meta/r:skill/r:levels/r:level', 'nodeset');
            var columnAttrRenderers = {};
            var rowAttrRenderers = [];
            $skillsTableHead.children('tr').each(function (rowIndex) {
                var $this = $(this);
                var rr;
                rowAttrRenderers.push(rr = []);
                $.each(this.attributes, function (attrIndex, attr) {
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
            $skillsTableHead.find('> tr > th').each(function () {
                var $this = $(this);
                var columnFieldName = $.trim($this.attr('data-field'));
                $.each(this.attributes, function (attrIndex, attr) {
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
            $xmlSkillLevels.each(function () {
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

            $xml.xpath('r:skills/r:skill', 'nodeset').each(function (index, skill) {
                var $skillRow = $('<tr/>').appendTo($skillsTableBody);
                var $skill = $(skill);
                var props = extractSkillFromXML($skill);
                var renderProps = $.extend(true, $table.templateProperties(), props);
                var categories = props['categories'];
                if (typeof categories === 'object' && ('originalValue' in categories)) {
                    $.each(categories.originalValue, function () {
                        $skillRow.addClass('category-' + this);
                    });
                }
                if ($.isArray(rowAttrRenderers) && rowAttrRenderers.length > 0) {
                    $.each(rowAttrRenderers[0], function (renderIndex, render) {
                        $skillRow.attr(render.attr, String.format(render.template, renderProps, ['value', 'originalValue']));
                    });
                }
                $skillRow.attr('data-template-properties', JSON.stringify(props));
                $skillsTableHead.find('> tr > th').each(function () {
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
                            $.each(columnAttrRenderers[columnFieldName], function (renderIndex, render) {
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
            .each(function () {
                var $this = $(this);
                if (!$this.is('[data-default-sort-order]')) {
                    var sortOrder = $.trim($this.attr('data-sort-order'));
                    $this.attr('data-default-sort-order', sortOrder);
                }
            })
            .not($columnHeader)
            .each(function () {
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
                .done(function () {
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
        $table.attr({
            'data-sort-order': sortingProperties.sortDirection,
            'data-order-by': sortingProperties.field
        });
        Array.prototype.sort.call($rows, function (a, b) {
            var aRow = $(a).templateProperties();
            var bRow = $(b).templateProperties();
            var sortReturn = 0;
            $.each(sorting, function (ruleIndex, rule) {
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
        $xmlSkillLevels.each(function () {
            var level = parseFloat($.trim($(this).attr('value')));
            if (level > maxSkillLevel) {
                maxSkillLevel = level;
            }
        });
        $.each($skill.children(), function (index, element) {
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
                    .each(function () {
                        $.each(this.attributes, function (attrIndex, attr) {
                            var attrName = attr.localName;
                            var attrValue = attr.nodeValue;
                            if (!isNaN(parseFloat(attrValue))) {
                                attrValue = parseFloat(attrValue);
                            }
                            props[nodeName][attrName] = attrValue;
                        });
                    });
                }
                $.each(element.attributes, function (attrIndex, attr) {
                    let attrName = attr.localName;
                    let attrValue = attr.nodeValue;
                    if (!isNaN(parseFloat(attrValue))) {
                        attrValue = parseFloat(attrValue);
                    }
                    props[nodeName][attrName] = attrValue;
                });
            } else {
                value = [];
                $items.each(function () {
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
        $.each(props, function (propName, propValue) {
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
                $.each(adjustedValue, function (index, id) {
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
