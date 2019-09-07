import ResumeLoader, {ResumeResponseBundle} from '../ResumeLoader/ResumeLoader';
import XPath from '../../XPath/XPath';
import {Duration, DurationResult, TemporalUnit} from "../../Env/Env";
import GA from "../../GA/GA";

declare global {
    interface JQuery {
        templateProperties: () => object;
    }
}

export interface ResumeFieldValue {
    originalValue?: string;
    value?: string;
}

export interface AttributeRenderer {
    template: string;
    attr: string;
}

export interface SortingProperties {
    field: string,
    sortDirection: string
}

export default class ResumeSkillsTable {
    private _loader: ResumeLoader;
    private _element: JQuery;
    private _categoriesContainer: JQuery;
    private _options: object;
    private _xpath: XPath;
    private _response: ResumeResponseBundle;

    private static DEFAULT_SORT_COLUMN = 'level';
    private static PATTERN_DATA_RENDER_PREFIX = /^data-render-(.+)$/i;

    constructor(loader: ResumeLoader, element: JQuery | HTMLElement | string, categoriesContainer: JQuery | HTMLElement | string = null, options: object = {}) {
        this._loader = loader;
        this._options = options;
        this._xpath = new XPath();
        this._loader.then((response => {
            this._response = response;
            this._xpath.initNamespaceFrom(response.xml.document);
        }));
        if (element instanceof HTMLElement || typeof element === 'string' || element instanceof String) {
            this._element = $(<any>element);
        } else {
            this._element = element;
        }
        if (categoriesContainer instanceof HTMLElement || typeof categoriesContainer === 'string' || categoriesContainer instanceof String) {
            this._categoriesContainer = $(<any>categoriesContainer);
        } else {
            this._categoriesContainer = categoriesContainer;
        }
        this._initElement();
    }

    get element(): JQuery {
        return this._element;
    }

    private _initElement(): ResumeSkillsTable {
        const self: ResumeSkillsTable = this;
        let $element: JQuery = this._element;
        $element.on('mouseenter.iresume mouseleave.iresume', 'tbody > tr', function (event) {
            const $this: JQuery = $(this);
            const isEnter: boolean = (event.type === 'mouseenter');
            const activeElement: Element = document.activeElement;
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
            const $this: JQuery = $(this);
            const isEnter: boolean = (event.type === 'focusin');
            if (isEnter) {
                $element.removeData('last-blurred');
            } else {
                $element.data('last-blurred', this);
            }
            $this.children()[isEnter ? 'addClass' : 'removeClass']('ui-state-hover');
        });
        $element.on('tap.iresume', 'tbody > tr', function (event) {
            const $this: JQuery = $(this);
            const lastBlurred: Element = $element.data('last-blurred');
            if (document.activeElement === this) {
                if (typeof lastBlurred === 'undefined' && lastBlurred !== this) {
                    $this.trigger('blur');
                    event.stopPropagation();
                    event.preventDefault();
                }
            }
        });
        $element.find('> thead > tr > th[data-order-by]').on('keydown.iresume', function (event, options) {
            const key: string = event.key;
            if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
                event.preventDefault();
                const $target: JQuery = $(event.target);
                $target.trigger('click');
                return false;
            }
        });
        $element.on('click.iresume', 'th[data-order-by]', function (event, options) {
            const $this: JQuery = $(this);
            const orderBy: string[] = $.trim($this.attr('data-order-by')).split(/\s*,+\s*/);
            const fieldName: string = $.trim($this.attr('data-field'));
            let sortOrder: string = $.trim($this.attr('data-sort-order'));
            if (sortOrder.length === 0) {
                const m: RegExpExecArray = /:(asc|desc)$/.exec(orderBy[0]);
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
                if (typeof options !== 'object' || options.simulated !== true) {
                    GA.fireEvent('UX', 'Sort Skills Table: ' + fieldName + ':' + sortOrder);
                }
                self._sortSkills(fieldName);
            }
        });
        this._loader.then(response => {
            const $xmlRoot: JQuery<Node> = this._xpath.evaluate(response.xml.document, '/r:resume', 'node');
            const authorName: string = $.trim(this._xpath.evaluate($xmlRoot, 'r:author/@name', 'string'));
            $('.author-name').text(authorName);
            this._buildSkillsTable();
            const defaultSortColumn: string = $.trim(this._element.attr('data-default-sort-column') || this._element.children('thead:first').children('tr:first').children('th[data-field]:first').attr('data-field'));
            this._element.find('> thead > tr > th[data-field="' + defaultSortColumn + '"]').first().trigger('click', {
                simulated: true
            });
            this._element.closest('.tab-panel').addClass('final-rendering');

            if (this._categoriesContainer !== null && this._categoriesContainer.length > 0) {
                this._initCategories(this._categoriesContainer, $xmlRoot);
                const defaultCategory: string = $.trim(this._categoriesContainer.attr('data-default-category'));
                $('#is-relevant-category').trigger('change', {
                    simulated: true,
                    checked: (defaultCategory === 'relevant')
                });
                if (defaultCategory.length > 0) {
                    const $select: JQuery = this._categoriesContainer.find('select#categories');
                    const $defaultCategory: JQuery = $select.find('option[value="' + defaultCategory + '"]');
                    if ($defaultCategory.length > 0) {
                        $defaultCategory.prop('selected', true);
                        try {
                            $select.selectmenu('refresh');
                        } catch (ex) {
                            console.error(ex);
                        }
                        $select.triggerHandler('change', {
                            simulated: true
                        });
                    }
                }
            }
        });
        return this;
    }

    private _initCategories($categories: JQuery, $xml: JQuery<Node>): ResumeSkillsTable {
        $categories.html('');
        const relevantKey: string = 'relevant';
        const $xmlCategories: JQuery<Node> = this._xpath.evaluate($xml, 'r:meta/r:skill/r:categories/r:category', 'nodeset')
        .filter((nodeIndex, node) => {
            const $node: JQuery<Node> = $(node);
            const isVisible: boolean = !/^true|yes|on|1$/.test($.trim($node.attr('hidden')));
            return isVisible;
        });
        // Array.prototype.sort.call($xmlCategories, function (a, b) {
        //     const $a: JQuery = $(a);
        //     const $b: JQuery = $(b);
        //     const aName: string = $.trim($a.text());
        //     const bName: string = $.trim($b.text());
        //     if ($a.attr('value') === relevantKey) {
        //         return -1;
        //     } else if ($b.attr('value') === relevantKey) {
        //         return 1;
        //     }
        //     if (aName < bName) {
        //         return -1;
        //     } else if (aName > bName) {
        //         return 1;
        //     }
        //     return 0;
        // });

        const relevantText: string = $.trim(this._xpath.evaluate($xmlCategories, 'self::*[@value = "' + relevantKey + '"]', 'node').text());

        const $isRelevantLabel: JQuery = $('<label/>').attr({
            'for': 'is-relevant-category'
        })
        .addClass('ui-shadow')
        .text('Relevant')
        .appendTo($categories);
        const $isRelevant: JQuery = $('<input type="checkbox"/>')
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
            const selectChangeEventOptions: object = {
                simulated: (options && options.simulated)
            };
            $select.trigger('change', selectChangeEventOptions);
        })
        .appendTo($categories);

        const $categoriesSelectContainer: JQuery = $('<div/>')
        .addClass('select-category-container')
        .prependTo($categories);

        $('<label/>').attr({
            'for': 'categories'
        })
        .addClass('ui-hidden-accessible')
        .text('Category: ')
        .appendTo($categoriesSelectContainer);

        const $select: JQuery = $('<select/>')
        .attr({
            id: 'categories'
        });
        $('<option/>').val('*').text('All Categories').prependTo($select);
        $xmlCategories.each(function () {
            const $category: JQuery<Node> = $(this);
            const id: string = $.trim($category.attr('value'));
            const name: string = $.trim($category.text());
            $('<option/>').attr({
                value: id
            })
            .text(name)
            .appendTo($select);
        });

        $select.on('change', (event, options) => {
            const $rows: JQuery = this._element.find('> tbody > tr');
            const $this: JQuery = $(event.target);
            const categoryKey: string = $.trim(('' + $this.val()));
            const categoryName: string = $.trim($this.find('option[value="' + categoryKey + '"]').text());
            const $captionAttributes = this._element
            .children('caption')
            .children('.text')
            .addBack();
            if (categoryKey === '*') {
                $rows.removeClass('ui-screen-hidden');
                $captionAttributes.removeAttr('data-filter');
            } else {
                let $filteredRows: JQuery = $rows.filter('.category-' + categoryKey);
                $filteredRows.removeClass('ui-screen-hidden');
                $rows.not($filteredRows).addClass('ui-screen-hidden');
                $captionAttributes.attr('data-filter', categoryName);
            }
            if (typeof options !== 'object' || options.simulated !== true) {
                GA.fireEvent('UX', 'Filter Skills Table: ' + categoryName);
            }
            this._refreshTable();
        })
        .appendTo($categoriesSelectContainer);
        if (('enhanceWithin' in $.fn) && typeof $.fn.enhanceWithin === 'function') {
            $categories.enhanceWithin();
        }
        return this;
    }

    private _refreshTable(): ResumeSkillsTable {
        this._element.find('> tbody > tr:not(.ui-screen-hidden)').each(function (index) {
            const $this: JQuery = $(this);
            const isOdd: boolean = (index % 2 === 0);
            $this
            .removeClass(isOdd ? 'even' : 'odd')
            .addClass(isOdd ? 'odd' : 'even');
        });
        return this;
    }

    private _sortSkills(sortBy: string): ResumeSkillsTable {
        const $columnHeader: JQuery = this._element.find('> thead > tr > th[data-field="' + sortBy + '"]');
        if ($columnHeader.length > 0) {
            $columnHeader
            .addClass('sort-by')
            .closest('thead').find('th')
            .each(function () {
                const $this: JQuery = $(this);
                if (!$this.is('[data-default-sort-order]')) {
                    const sortOrder: string = $.trim($this.attr('data-sort-order'));
                    $this.attr('data-default-sort-order', sortOrder);
                }
            })
            .not($columnHeader)
            .each(function () {
                const $this: JQuery = $(this);
                const defaultSortOrder: string = $.trim($this.attr('data-default-sort-order'));
                $this[(defaultSortOrder.length > 0 ? 'attr' : 'removeAttr')]('data-sort-order', defaultSortOrder);
            })
            .removeClass('ui-state-default')
            .removeClass('sort-by');
            const sortOrder: string = $.trim($columnHeader.attr('data-sort-order'));
            let sorting: string[] = [$.trim($columnHeader.attr('data-order-by'))];
            if (sorting[0].length > 0) {
                sorting = sorting[0].split(/\s*,+\s*/);
            } else {
                sorting = [sortBy];
            }
            const $rows: JQuery = this._element.find('> tbody > tr');
            if ($rows.length === 0) {
                this._buildSkillsTable();
                this._sortTableRows(sortBy, sorting, sortOrder);
                return;
            }
            this._sortTableRows(sortBy, sorting, sortOrder);
        }
        return this;
    }

    private _sortTableRows(fieldName: string, sorting: string[], defaultSortOrder: string): ResumeSkillsTable {
        const $table: JQuery = this._element;
        const $rows: JQuery = $table.find('> tbody > tr');
        const sortOrder: string = $.trim(defaultSortOrder);
        const sortingProperties: SortingProperties = this._getSortingProperties(fieldName, sorting[0], sortOrder);
        const firstSortBy: string = $.trim($table.find('> thead th[data-field="' + fieldName + '"]').attr('data-header'));
        const $captionAttributeTargets: JQuery = $table
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
        this._refreshTable();
        return this;
    }

    private _getSortingProperties(fieldName: string, rule: string, defaultSortOrder: string): SortingProperties {
        const sortOrder: string = $.trim(defaultSortOrder);
        const sortRule: string[] = rule.split(':', 2);
        let sortDirection;
        if (sortOrder.length > 0) {
            sortDirection = sortOrder;
        } else if (sortRule.length > 1) {
            sortDirection = sortRule[1];
        } else {
            sortDirection = 'asc';
        }
        return {
            field: fieldName,
            sortDirection: sortDirection
        };
    }

    private _buildSkillsTable(): ResumeSkillsTable {
        const $table: JQuery = this._element;
        const self: ResumeSkillsTable = this;
        const response: ResumeResponseBundle = this._response;
        let $xml: JQuery = $(response.xml.document.documentElement);
        let $skillsTableHead: JQuery = $table.children('thead');
        let $skillsTableBody: JQuery = $table.children('tbody');
        $skillsTableBody.children().remove();
        let $xmlSkillLevels: JQuery<Node> = self._xpath.evaluate($xml, 'r:meta/r:skill/r:experience/r:level', 'nodeset');
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
            let $level: JQuery<Node> = $(this);
            let m: number = parseFloat($.trim($level.attr('value')));
            if (m > maxLevel) {
                maxLevel = m;
            }
        });
        $table.attr('data-template-properties', JSON.stringify({
            experience: {
                max: maxLevel,
                type: self._xpath.evaluate($xml, 'r:meta/r:skill/r:experience/@type', 'string') || 'experience',
                preposition: self._xpath.evaluate($xml, 'r:meta/r:skill/r:experience/@preposition', 'string') || 'at'
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
            let props: object = self._loader.getSkillProperties($skill);
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
                .addClass('field-' + columnFieldName.replace(/\./g, '-'))
                .addClass('ui-widget-content')
                .appendTo($skillRow);
                let $cellData: JQuery = $('<span/>').addClass('data').appendTo($cell);
                if (String.format('${' + columnFieldName + '}', props, ['value', 'originalValue']).length > 0) {
                    $cell.attr('data-value', String.format('${' + columnFieldName + '.value}', props));
                    $cell.attr('data-original-value', String.format('${' + columnFieldName + '.originalValue}', props));
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
        return this;
    }

    getSkillProperties(skillName: string): object {
        let props: object = this._loader.getSkillProperties(skillName);
        let renderProps: object = $.extend(true, this._element.templateProperties(), props);
        return renderProps;
    }
}
