import ResumeLoader, {ResumeResponseBundle} from '../ResumeLoader/ResumeLoader';
import XPath from '../../XPath/XPath';
import {Duration, DurationResult, TemporalUnit} from "../../Env/Env";

declare global {
    interface JQuery {
        templateProperties: () => object;
    }
}

interface ResumeFieldValue {
    originalValue?: string;
    value?: string;
}

interface AttributeRenderer {
    template: string;
    attr: string;
}

export default class ResumeSkillsTable {
    private _loader: ResumeLoader;
    private _element: JQuery;
    private _options: object;
    private _xpath: XPath;
    private _response: ResumeResponseBundle;

    private static DEFAULT_SORT_COLUMN = 'level';
    private static PATTERN_DATA_RENDER_PREFIX = /^data-render-(.+)$/i;

    constructor(loader: ResumeLoader, element: JQuery, options: object = {}) {
        this._loader = loader;
        this._options = options;
        this._xpath = new XPath();
        this._loader.then((response => {
            this._response = response;
            this._xpath.initNamespaceFrom(response.xml.document);
        }));
        this.element = element;
    }

    get element(): JQuery {
        return this._element;
    }

    set element(element: JQuery) {
        if (this._element instanceof jQuery) {
            this._element.off('.iresume');
        }
        this._element = element;
        this._initElement();
    }

    private _initElement() {
        const self = this;
        let $element: JQuery = this._element;
        $element.on('mouseenter.iresume mouseleave.iresume', 'tbody > tr', function (event) {
            var $this: JQuery = $(this);
            var isEnter = (event.type === 'mouseenter');
            var activeElement: Element = document.activeElement;
            $(activeElement).trigger('blur');
            if (isEnter) {
                if (activeElement !== this) {
                    $this.trigger('focus');
                }
            }
        });
        $element.on('focusin.iresume focusout.iresume', 'tbody > tr', function (event) {
            if (!$(event.target).is('tr')) {
                return;
            }
            var $this: JQuery = $(this);
            var isEnter: boolean = (event.type === 'focusin');
            if (isEnter) {
                $element.removeData('last-blurred');
            } else {
                $element.data('last-blurred', this);
            }
            $this.children()[isEnter ? 'addClass' : 'removeClass']('ui-state-hover');
        });
        $element.on('tap.iresume', 'tbody > tr', function (event) {
            var $this: JQuery = $(this);
            var lastBlurred: Element = $element.data('last-blurred');
            if (document.activeElement === this) {
                if (typeof lastBlurred === 'undefined' && lastBlurred !== this) {
                    $this.trigger('blur');
                    event.stopPropagation();
                    event.preventDefault();
                }
            }
        });
        $element.on('click.iresume', 'th[data-order-by]', function (event) {
            var $this: JQuery = $(this);
            var sortOrder: string = $.trim($this.attr('data-sort-order'));
            var orderBy: string[] = $.trim($this.attr('data-order-by')).split(/\s*,+\s*/);
            var fieldName: string = $.trim($this.attr('data-field'));
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
                self._sortSkills(fieldName);
            }
        });
        this._loader.then(responses => {
            const $initTableContainer: JQuery = $('#init-table-container');
            $initTableContainer.remove();
            const $skillsTable: JQuery = $('#skills-table');
            const $xmlRoot: JQuery<Element> = this._xpath.evaluate(responses.xml.document, '/r:resume', 'node');
            const authorName: string = $.trim(this._xpath.evaluate($xmlRoot, 'r:author/@name', 'string'));
            $('.author-name').text(authorName);
            const $skillCategories: JQuery = $('#skill-categories');
            const defaultCategory: string = $.trim($skillCategories.attr('data-default-category'));
            this._initCategories($skillCategories, $xmlRoot);
            this._buildSkillsTable()
            .done((response) => {
                $skillsTable.find('> thead > tr > th[data-field="' + ResumeSkillsTable.DEFAULT_SORT_COLUMN + '"]').trigger('click');
                $skillsTable.closest('.tab-panel').addClass('final-rendering');
                if (defaultCategory.length > 0) {
                    let $select: JQuery = $skillCategories.find('select#categories');
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
            })
        });
    }

    private _initCategories($categories, $xml) {
        $categories.html('');
        var $xmlCategories: JQuery<Element> = this._xpath.evaluate($xml, 'r:meta/r:skill/r:categories/r:category', 'nodeset');
        var relevantKey: string = 'relevant';
        Array.prototype.sort.call($xmlCategories, function (a, b) {
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

        let relevantText: string = $.trim(this._xpath.evaluate($xmlCategories, 'self::*[@value = "' + relevantKey + '"]', 'node').text());

        let $isRelevantLabel: JQuery = $('<label/>').attr({
            'for': 'is-relevant-category'
        })
        .addClass('ui-shadow')
        .text('Relevant')
        .appendTo($categories);
        let $isRelevant: JQuery = $('<input type="checkbox"/>')
        .attr({
            'data-wrapper-class': 'relevant-checkbox',
            'data-iconpos': 'right',
            value: '1',
            id: 'is-relevant-category'
        })
        .on('change', function (event, options) {
            let $this: JQuery = $(this);
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
            let $select: JQuery = $('select#categories');
            let isChecked: boolean = $this.is(':checked');
            if (isChecked) {
                if (!$select.is('[data-last-value]')) {
                    $select.attr('data-last-value', $.trim(('' + $select.find('option:selected').val())));
                }
                let $relevant: JQuery = $select.find('option[value="' + relevantKey + '"]');
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
                let lastValue: string = $.trim($select.attr('data-last-value'));
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

        let $categoriesSelectContainer: JQuery = $('<div/>')
        .addClass('select-category-container')
        .prependTo($categories);

        $('<label/>').attr({
            'for': 'categories'
        })
        .addClass('ui-hidden-accessible')
        .text('Category: ')
        .appendTo($categoriesSelectContainer);

        let $select: JQuery = $('<select/>')
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

        $select.on('change', (event) => {
            let $table: JQuery = $('#skills-table');
            let $rows: JQuery = $table.find('> tbody > tr');
            let $this: JQuery = $(event.target);
            let skillKey: string = $.trim(('' + $this.val()));
            let skillName: string = $.trim($this.find('option[value="' + skillKey + '"]').text());
            let $captionAttributes = $table
            .children('caption')
            .children('.text')
            .addBack();
            if (skillKey === '*') {
                $rows.removeClass('ui-screen-hidden');
                $captionAttributes.removeAttr('data-filter');
            } else {
                let $filteredRows: JQuery = $rows.filter('.category-' + skillKey);
                $filteredRows.removeClass('ui-screen-hidden');
                $rows.not($filteredRows).addClass('ui-screen-hidden');
                $captionAttributes.attr('data-filter', skillName);
            }
            this._refreshTable($table);
        })
        .appendTo($categoriesSelectContainer);
        $categories.enhanceWithin();
    }

    private _refreshTable($table) {
        $table.find('> tbody > tr:not(.ui-screen-hidden)').each(function (index) {
            var $this = $(this);
            var isOdd = (index % 2 === 0);
            $this
            .removeClass(isOdd ? 'even' : 'odd')
            .addClass(isOdd ? 'odd' : 'even');
        });
    }

    private _sortSkills(sortBy) {
        let $table: JQuery = this._element;
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
            var sortOrder: string = $.trim($columnHeader.attr('data-sort-order'));
            var sorting: string | string[] = $.trim($columnHeader.attr('data-order-by'));
            if (sorting.length > 0) {
                sorting = sorting.split(/\s*,+\s*/);
            } else {
                sorting = [sortBy];
            }
            var $rows = $table.find('> tbody > tr');
            if ($rows.length === 0) {
                this._buildSkillsTable()
                .done(() => {
                    this._sortTableRows(sorting, sortOrder);
                });
                return;
            }
            this._sortTableRows(sorting, sortOrder);
        }
    }

    private _sortTableRows(sorting, defaultSortOrder) {
        let $table: JQuery = this._element;
        let $rows = $table.find('> tbody > tr');
        let sortOrder = $.trim(defaultSortOrder);
        let sortingProperties = this._getSortingProperties(sorting[0], sortOrder);
        let firstSortBy = $.trim($table.find('> thead th[data-field="' + sortingProperties.field + '"]').attr('data-header'));
        let $captionAttributeTargets = $table
        .children('caption')
        .children('.text')
        .addBack();
        let firstSortDirection = (sortingProperties.sortDirection === 'desc' ? 'descending' : 'ascending');
        $captionAttributeTargets.attr({
            'data-sort-direction': firstSortDirection,
            'data-order-by': firstSortBy
        });
        $table.attr({
            'data-sort-order': sortingProperties.sortDirection,
            'data-order-by': sortingProperties.field
        });
        Array.prototype.sort.call($rows, function (a, b) {
            let aRow = $(a).templateProperties();
            let bRow = $(b).templateProperties();
            let sortReturn = 0;
            $.each(sorting, function (ruleIndex, rule) {
                let sortRule = rule.split(':', 2);
                let sortColumn = sortRule[0];
                let sortDirection;
                if (ruleIndex === 0 && sortOrder.length > 0) {
                    sortDirection = sortOrder;
                } else if (sortRule.length > 1) {
                    sortDirection = sortRule[1];
                } else {
                    sortDirection = 'asc';
                }
                let aValue: string | number | Array<string | number> = String.format('${' + sortColumn + '}', aRow, ['value', 'originalValue']);
                let bValue: string | number | Array<string | number> = String.format('${' + sortColumn + '}', bRow, ['value', 'originalValue']);
                if (typeof aValue === 'undefined') {
                    aValue = '';
                }
                if (typeof bValue === 'undefined') {
                    bValue = '';
                }
                if (Array.isArray(aValue)) {
                    aValue = aValue.join('');
                }
                if (Array.isArray(bValue)) {
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
        this._refreshTable($table);
    }

    private _getSortingProperties(rule, defaultSortOrder) {
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

    private _extractSkillFromXML($skill: JQuery<Element>) {
        const self = this;
        let props: object = {};
        let $xmlSkillLevels: JQuery<Element> = this._xpath.evaluate($skill, 'ancestor::r:resume/r:meta/r:skill/r:levels/r:level', 'nodeset');
        let $xmlCategories: JQuery<Element> = this._xpath.evaluate($skill, 'ancestor::r:resume/r:meta/r:skill/r:categories/r:category', 'nodeset');
        let maxSkillLevel: number = 0;
        $xmlSkillLevels.each(function () {
            let level: number = parseFloat($.trim($(this).attr('value')));
            if (level > maxSkillLevel) {
                maxSkillLevel = level;
            }
        });
        let totalSkillExperienceRaw: number = 0;
        $.each($skill.children(), (index, element: Element) => {
            let $skillProperty: JQuery<Element> = $(element);
            let skillPropertyName: string = $skillProperty.prop('nodeName');
            let $items: JQuery<Element> = $skillProperty.children();
            if (!(skillPropertyName in props)) {
                props[skillPropertyName] = {};
            }
            if (skillPropertyName === 'experience') {
                let foundSince: boolean = false;
                let firstExperience: Date = null;
                let lastExperience: Date = null;
                props[skillPropertyName].precision = $skillProperty.attr('precision') || TemporalUnit.MONTHS;
                $.each($items, (experienceChildIndex, experienceChild) => {
                    let $experienceChild: JQuery<Element> = $(experienceChild);
                    let experienceType: string = $experienceChild.prop('nodeName');
                    let since: Date = null;
                    let until: Date = null;
                    if (experienceType === 'spanning') {
                        since = Date.from(self._xpath.evaluate(experienceChild, '@from', 'string'));
                        until = Date.from(self._xpath.evaluate(experienceChild, '@to', 'string'));
                        if (lastExperience === null || lastExperience.getTime() < until.getTime()) {
                            lastExperience = until;
                        }
                    } else if (experienceType === 'since') {
                        since = Date.from(self._xpath.evaluate(experienceChild, 'text()', 'string'));
                        until = new Date();
                        foundSince = true;
                    } else {
                        return true;
                    }
                    if (firstExperience === null || firstExperience.getTime() > since.getTime()) {
                        firstExperience = since;
                    }
                    totalSkillExperienceRaw += (until.getTime() - since.getTime())
                });
                props[skillPropertyName].duration = Duration.getDuration(totalSkillExperienceRaw);
                props[skillPropertyName].duration.text = Duration.text.bind(props[skillPropertyName].duration, props[skillPropertyName].duration, props[skillPropertyName].precision);
                if (firstExperience !== null) {
                    $.extend(true, props[skillPropertyName], {
                        first: {
                            value: firstExperience
                        }
                    });
                }
                if (!foundSince) {
                    $.extend(true, props[skillPropertyName], {
                        last: {
                            value: lastExperience
                        }
                    });
                }
                return true;
            }
            if ($items.length === 0) {
                let text = $.trim($skillProperty.text());
                $.extend(true, props[skillPropertyName], {
                    value: text
                });
                if (skillPropertyName === 'level') {
                    (<JQuery>this._xpath.evaluate($xmlSkillLevels, 'self::*[@value = "' + Math.floor(parseFloat($skillProperty.attr('value'))) + '"]', 'nodeset'))
                    .each(function () {
                        $.each(this.attributes, function (attrIndex, attr) {
                            let attrName: string = attr.localName;
                            let attrValue: string | number = attr.nodeValue;
                            if (!isNaN(parseFloat(attrValue))) {
                                attrValue = parseFloat(attrValue);
                            }
                            props[skillPropertyName][attrName] = attrValue;
                        });
                    });
                }
                $.each(element.attributes, function (attrIndex, attr) {
                    let attrName: string = attr.localName;
                    let attrValue: string | number = attr.nodeValue;
                    if (!isNaN(parseFloat(<string>attrValue))) {
                        attrValue = parseFloat(<string>attrValue);
                    }
                    props[skillPropertyName][attrName] = attrValue;
                });
            } else {
                let value: Array<string | number> = [];
                $items.each(function () {
                    var $item = $(this);
                    var v: string | number = $item.attr('value');
                    if (!isNaN(parseFloat(v))) {
                        v = parseFloat(v);
                    }
                    value.push(v);
                });
                $.extend(true, props[skillPropertyName], {
                    value: value
                });
            }
        });
        $.each(props, (propName: string, propValue: any) => {
            let originalValue: any = propValue.value;
            let adjustedValue: any = originalValue;
            if (propName === 'experience') {
                if (typeof propValue.duration.text === 'function') {
                    originalValue = propValue.duration.text();
                    adjustedValue = originalValue.join(', ');
                }
                $.extend(true, propValue, {
                    duration: {
                        originalValue: originalValue,
                        value: adjustedValue
                    }
                });
                return true;
            } else if (propName === 'level') {
                adjustedValue = $.trim((<JQuery>this._xpath.evaluate($xmlSkillLevels, 'self::*[@value = "' + Math.floor(originalValue) + '"]', 'nodeset')).text());
                $.extend(true, propValue, {
                    percentage: (parseFloat(originalValue) / parseFloat(('' + maxSkillLevel)))
                });
            } else if (propName === 'categories') {
                let cv = [];
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

    private _buildSkillsTable() {
        const $table: JQuery = this._element;
        const self: ResumeSkillsTable = this;
        const dfd: JQueryDeferred<ResumeResponseBundle> = $.Deferred();
        this._loader.then( (response) => {
            let $xml: JQuery = $(response.xml.document.documentElement);
            let $skillsTableHead: JQuery = $table.children('thead');
            let $skillsTableBody: JQuery = $table.children('tbody');
            $skillsTableBody.children().remove();
            let $xmlSkillLevels: JQuery = <JQuery>self._xpath.evaluate($xml, 'r:meta/r:skill/r:levels/r:level', 'nodeset');
            let columnAttrRenderers: {
                [key: string]: AttributeRenderer[]
            } = {};
            let rowAttrRenderers: Array<AttributeRenderer[]> = [];
            $skillsTableHead.children('tr').each(function (rowIndex) {
                let $this: JQuery = $(this);
                let rr: AttributeRenderer[];
                rowAttrRenderers.push(rr = []);
                $.each(this.attributes, function (attrIndex, attr) {
                    let attrName: string = attr.localName;
                    let attrValue: string = $this.attr(attrName);
                    let m: RegExpExecArray = ResumeSkillsTable.PATTERN_DATA_RENDER_PREFIX.exec(attrName);
                    if (m !== null && m.length > 0) {
                        let targetAttrName: string = m[1];
                        rr.push({
                            template: attrValue,
                            attr: targetAttrName
                        });
                    }
                });
            });
            $skillsTableHead.find('> tr > th').each(function () {
                let $this: JQuery = $(this);
                let columnFieldName: string = $.trim($this.attr('data-field'));
                $.each(this.attributes, function (attrIndex, attr) {
                    let attrName: string = attr.localName;
                    let attrValue: string = $this.attr(attrName);
                    let m: RegExpExecArray = ResumeSkillsTable.PATTERN_DATA_RENDER_PREFIX.exec(attrName);
                    if (m !== null && m.length > 0) {
                        let targetAttrName: string = m[1];
                        let columnList: AttributeRenderer[];
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

            let maxLevel: number = 0;
            $xmlSkillLevels.each(function () {
                let $level: JQuery = $(this);
                let m: number = parseFloat($.trim($level.attr('value')));
                if (m > maxLevel) {
                    maxLevel = m;
                }
            });
            $table.attr('data-template-properties', JSON.stringify({
                levels: {
                    max: maxLevel,
                    preposition: self._xpath.evaluate($xml, 'r:meta/r:skill/r:levels/@preposition', 'string') || 'at'
                }
            }));

            self._xpath.evaluate($xml, 'r:skills/r:skill', 'nodeset').each(function (index, skill) {
                const $skill: JQuery = $(<any>skill);
                let skillHiddenValue: string = $.trim($skill.attr('hidden')).toLowerCase();
                let skillHidden: boolean = (skillHiddenValue === 'true' || skillHiddenValue === 'yes' || skillHiddenValue === 'on' || skillHiddenValue === '1');
                if (skillHidden) {
                    return;
                }
                let $skillRow: JQuery = $('<tr/>').appendTo($skillsTableBody);
                let props: object = self._extractSkillFromXML($skill);
                let renderProps: object = $.extend(true, $table.templateProperties(), props);
                let categories: any = props['categories'];
                if (typeof categories === 'object' && ('originalValue' in categories)) {
                    $.each(categories.originalValue, function () {
                        $skillRow.addClass('category-' + this);
                    });
                }
                if (Array.isArray(rowAttrRenderers) && rowAttrRenderers.length > 0) {
                    $.each(rowAttrRenderers[0], function (renderIndex, render) {
                        $skillRow.attr(render.attr, String.format(render.template, renderProps, ['value', 'originalValue']));
                    });
                }
                $skillRow.attr('data-template-properties', JSON.stringify(props));
                $skillsTableHead.find('> tr > th').each(function () {
                    let $this: JQuery = $(this);
                    let columnHeader: string = $.trim($this.attr('data-header'));
                    let columnFieldName: string = $.trim($this.attr('data-field'));
                    let columnFieldRender: string = $.trim($this.attr('data-render'));
                    if (columnFieldRender.length === 0) {
                        columnFieldRender = '${' + columnFieldName + '}';
                    }
                    let $cell: JQuery = $('<td/>')
                    .addClass('field-' + columnFieldName)
                    .addClass('ui-widget-content')
                    .appendTo($skillRow);
                    let $cellData: JQuery = $('<span/>').addClass('data').appendTo($cell);
                    if (columnFieldName in props) {
                        $cell.attr('data-value', props[columnFieldName].value);
                        $cell.attr('data-original-value', props[columnFieldName].originalValue);
                        if (Array.isArray(columnAttrRenderers[columnFieldName])) {
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
            dfd.resolve(response);
        });
        return dfd.promise();
    }

    getSkillProperties(skillKey: string) {
        let $skill: JQuery<Element> = this._xpath.evaluate(this._response.xml.document, "/r:resume/r:skills/r:skill[translate(normalize-space(r:name), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ', 'abcdefghijklmnopqrstuvwxyz-') = '" + skillKey.replace(/[^a-z0-9/#*()-]/gi, '') + "']", 'node');
        let props: object = this._extractSkillFromXML($skill);
        let renderProps: object = $.extend(true, this._element.templateProperties(), props);
        return renderProps;
    }
}
