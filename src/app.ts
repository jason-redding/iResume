import * as $ from 'jquery';
import './app/Env/Env';
import {addMediaQueryListener, Duration, DurationResult, Param} from './app/Env/Env';
import ResumeSkillsTable from './app/iResume/ResumeSkillsTable/ResumeSkillsTable';
import ResumeComponent, {ResumeTransformParameters} from './app/iResume/ResumeComponent/ResumeComponent';
import ResumeLoader from './app/iResume/ResumeLoader/ResumeLoader';
import CodeViewer from './app/CodeViewer/CodeViewer';
import GA from './app/metrics/GA';

onReady();

function onReady() {
    initPrintHandler();
    initHashHandling();
    initThemeUI();
    // initExplainUI();

    initPreferences();
    const resumeLoader: ResumeLoader = loadResume();
    const resumeSkillsTable: ResumeSkillsTable = initSkillsTable(resumeLoader);
    initTooltips(resumeLoader);
    const resumeComponent: ResumeComponent = initResumeComponent(resumeLoader);
    // initExportUI(resumeComponent);
    applyRenderDecorations(resumeComponent);
    resumeComponent.onRenderComplete(() => {
        handleUrlParams(resumeSkillsTable);
    });
    initHighlightThemePicker();
    initCodeViewer();
    initTabs();
}

function applyRenderDecorations(resumeComponent: ResumeComponent): ResumeComponent {
    resumeComponent.onRenderComplete(() => {
        const $viewport: JQuery = resumeComponent.viewport;
        let $printButton: JQuery = $viewport.closest('body').find('.resume-print-button');
        if ($printButton.length === 0) {
            const $authorContainer = $viewport.find('.header > .author > .author-contact');
            let $printButtonContainer: JQuery = $('<div/>')
            .addClass('hide-on-print')
            .addClass('resume-print-button-container');

            $printButton = $('<button/>').text('Print...')
            .addClass('resume-print-button')
            .attr({
                'data-inline': true,
                'data-mini': true,
                'type': 'button'
            })
            .appendTo($printButtonContainer);
            $printButtonContainer.prependTo($authorContainer);
            $printButtonContainer.enhanceWithin();
        }
        $printButton.on('click', function (event) {
            setTimeout(function () {
                GA.fireEvent('UX', 'Print', 'Button');
                window.print();
            }, 10);
        });
    });
    return resumeComponent;
}

function loadResume(): ResumeLoader {
    const resumeLoader: ResumeLoader = new ResumeLoader('/resume');
    resumeLoader
    .onLoadStart(() => {
        $.mobile.loading('show', {
            text: 'Loading and transforming résumé XML...',
            textVisible: true
        });
    })
    .onLoadFail(response => {
        $.mobile.loading('hide');
    })
    .onLoadComplete(response => {
        $.mobile.loading('hide');
    })
    .load();
    return resumeLoader;
}

function initExplainUI() {
    console.debug('Initializing explaination UI...');
    $('#explain-button').on('click', function (event, options) {
        const $html: JQuery = $('html');
        $html[($html.is('.r-explain') ? 'removeClass' : 'addClass')]('r-explain');
    });
}

function initHashHandling() {
    console.debug('Initializing URL hash handler...');
    $(window).on('pagecontainerbeforechange.iresume', function (event, ui) {
        if (typeof ui.toPage === 'string' || ui.toPage instanceof String) {
            const url: ParsedPath = $.mobile.path.parseUrl(ui.toPage);
            const mPosition: RegExpExecArray = /^#(position-.+)$/.exec(url.hash);
            if (mPosition !== null && mPosition.length > 0) {
                let $targetElement: JQuery = $('a[name="' + mPosition[1] + '"]', ui.prevPage);
                if ($targetElement.length === 0) {
                    $targetElement = $('[id="' + mPosition[1] + '"]', ui.prevPage);
                }
                if ($targetElement.length > 0) {
                    event.preventDefault();
                    const isAnchor = $targetElement.is('a');
                    const headerAdjustment: number = (isAnchor ? 0 : (($('> .ui-header-fixed', ui.prevPage).outerHeight() || 0) + 8));
                    let $scrollableRoot = $('html, body');
                    let scrollOffset: number = $scrollableRoot.filter((index, element) => {
                        return ($(element).prop('scrollTop') > 0);
                    }).prop('scrollTop') || 0;
                    $scrollableRoot.prop('scrollTop', 1);
                    $scrollableRoot = $scrollableRoot.filter((index, element) => {
                        return ($(element).prop('scrollTop') > 0);
                    });
                    $scrollableRoot.prop('scrollTop', scrollOffset);
                    $scrollableRoot
                    .animate({
                        scrollTop: $targetElement.offset().top - headerAdjustment
                    }, {
                        easing: 'easeInOutBack',
                        duration: 1800
                    })
                    .promise()
                    .always(($elements) => {
                        const $highlightElement: JQuery = (isAnchor ? $targetElement.parent() : $targetElement);
                        scrollOffset = $scrollableRoot.prop('scrollTop');
                        $highlightElement.trigger('focus');
                        if (!$highlightElement.is(':focus')) {
                            $highlightElement.attr('tabindex', '-1');
                            $highlightElement.trigger('focus');
                        }
                        $scrollableRoot.prop('scrollTop', scrollOffset);
                        const beginState: JQuery.PlainObject = {};
                        const endState: JQuery.PlainObject = {};
                        if ($highlightElement.closest('.ui-page-theme-b').length > 0) {
                            $.extend(beginState, {
                                'background-color': 'hsl(196, 40%, 60%)'
                            });
                        } else {
                            $.extend(beginState, {
                                'background-color': 'hsl(60, 100%, 80%)'
                            });
                        }
                        for (let property in beginState) {
                            endState[property] = $highlightElement.css(property);
                        }
                        $highlightElement.stop(true, true).css(beginState)
                        .delay(400)
                        .animate(endState, {
                            always: (animation, jumpedToEnd) => {
                                for (let property in endState) {
                                    $highlightElement.css(property, '');
                                }
                            },
                            duration: 2000
                        });
                    });
                }
            }
        }
    });
}

function forEachParam(query: string, consumer: (name: string, value: string, index: number) => boolean) {
    const paramsList: string[] = query.replace(/^\?+/g, '').split('&');
    for (let paramIndex = 0; paramIndex < paramsList.length; paramIndex++) {
        const paramLine: string = paramsList[paramIndex];
        const paramParts: string[] = paramLine.split('=', 2);
        const paramName: string = paramParts[0];
        const paramValue: string = paramParts[1];
        if (false === consumer(paramName, paramValue, paramIndex)) {
            break;
        }
    }
}

function paramIterator(query: string): Iterable<Param> {
    const pi: any = new String(query);
    pi[Symbol.iterator] = () => {
        return {
            next(args: any): IteratorResult<Param> {
                const isDone: boolean = !(this._paramIndex < this._paramList.length);
                let item: Param;
                if (!isDone) {
                    const line: string[] = this._paramList[this._paramIndex].split('=', 2);
                    const value: string = line[1];
                    const hasValue: boolean = (typeof value !== 'undefined' && value !== null);
                    const hasText: boolean = (hasValue && value.trim().length > 0);
                    item = {
                        name: line[0],
                        value: decodeURIComponent(value),
                        index: this._paramIndex++,
                        hasText: hasText,
                        hasValue: hasValue
                    };
                }
                const iterator: IteratorResult<Param> = {
                    value: item,
                    done: isDone
                };
                return iterator;
            },
            _paramList: query.replace(/^\?+/g, '').split('&'),
            _paramIndex: 0
        };
    };
    return pi;
}

function handleUrlParams(resumeComponent: ResumeComponent, resumeSkillsTable: ResumeSkillsTable) {
    console.debug('Handling URL parameters...');
    const location: Location = window.location;
    const query: string = location.search.replace(/^\?+/g, '');
    const paramsList: string[] = query.split('&');

    const invokePrint: Function = () => {
        console.debug('Invoking print!');
        let query: string = '';
        forEachParam(window.location.search.replace(/^\?+/g, ''), (paramName, paramValue, paramIndex) => {
            if (paramName === 'print') {
                return true;
            }
            if (query.length > 0) {
                query += '&';
            }
            query += paramName + ((typeof paramValue !== 'undefined') ? '=' + paramValue : '');
        });
        window.history.replaceState(null, document.title, window.location.pathname + (query.length > 0 ? '?' + query : ''));
        GA.fireEvent('UX', 'Print', 'URL');
        window.print();
    };

    const invokeChangeTab: Function = (tab: number | string) => {
        console.debug('Invoking select-tab!');
        const $tabNav: JQuery = $('#tabs-nav');
        const $tabs: JQuery = $tabNav.find('input:radio[name="tabs"]');
        let $selectedTab: JQuery;
        if ((typeof tab === 'number')) {
            $selectedTab = $tabs.eq(tab);
        } else if ((typeof tab === 'string')) {
            $selectedTab = $tabs.filter('[value="' + tab + '"]');
        }
        if ($selectedTab.length === 0) {
            return;
        }

        $selectedTab.trigger('click', {simulated: true});
        if (('checkboxradio' in $selectedTab)) {
            $selectedTab.checkboxradio('refresh');
        }

        const tabLabel: string = $.trim($selectedTab.closest('.ui-radio').find('label[for="' + $selectedTab.attr('id') + '"]').text());

        GA.fireEvent('UX', 'Init Main Tab', tabLabel);
    };

    const invokeViewRelevantSkills: Function = (value: boolean = true) => {
        console.debug('Invoking view-relevant-skills!');
        const $isRelevantCategory: JQuery = $('#is-relevant-category');
        const $categorySelect: JQuery = $('select#categories');
        $isRelevantCategory.trigger('change', {
            simulated: true,
            checked: value
        });
        const categoryKey: string = <string>$categorySelect.val();
        const categoryName: string = $.trim($categorySelect.find('option[value="' + categoryKey + '"]').text());
        GA.fireEvent('UX', 'Init Skills Table Filter', categoryName);
    };

    const invokeSetColorScheme: Function = (scheme: string) => {
        if (!/^(|auto|light|dark)$/.test(scheme)) {
            return;
        }
        console.debug('Invoking set-color-scheme!');
        const $selectColorScheme: JQuery = $('#color-scheme-select');
        if (scheme === 'auto') {
            scheme = '';
        }
        $selectColorScheme.val(scheme)
        .trigger('change', {simulated: true})
        .selectmenu('refresh');
    };

    const invokeSortSkillsTable: Function = (sortBy: string) => {
        const sortByColumnParts: string[] = sortBy.split(/\s*:+\s*/g);
        const sortByColumn: string = sortByColumnParts[0];
        let sortColumnOrder: string = (sortByColumnParts.length > 1 ? sortByColumnParts[1] === 'desc' ? 'desc' : 'asc' : null);
        if (sortColumnOrder !== null) {
            const $skillsTable: JQuery = $('#skills-table');
            const $column: JQuery = $skillsTable.find('> thead > tr > th[data-field="' + sortByColumn + '"]');
            $column.attr('data-sort-order', sortColumnOrder);
        }

        resumeSkillsTable.sortSkills(sortBy);
    };

    const invokeViewSkillCategory: Function = (category?: string) => {
        if ((typeof category ===  'undefined') || category === null || category === '') {
            category = '*';
        }
        if (category === 'relevant') {
            invokeViewRelevantSkills(true);
            return;
        }
        const $categorySelect: JQuery = $('select#categories');
        if ($categorySelect.find('option[value="' + category + '"]').length === 0) {
            return;
        }
        $categorySelect.val(category).trigger('change', {simulated: true});
        if (('selectmenu' in $categorySelect)) {
            $categorySelect.selectmenu('refresh');
        }

        const categoryName: string = $.trim($categorySelect.find('option[value="' + category + '"]').text());
        GA.fireEvent('UX', 'Init Skills Table Filter', categoryName);
    };

    const seenParams: Set<string> = new Set<string>();
    let lastTabChange: string | number;
    let shouldPrint: boolean = false;
    for (let paramLine of paramsList) {
        const paramParts: string[] = paramLine.split('=', 2);
        let paramName: string = paramParts[0];
        let paramValue: string = paramParts[1];
        if (seenParams.has(paramName)) {
            continue;
        }
        seenParams.add(paramName);
        if (paramName === 'print') {
            shouldPrint = true;
        } else if (paramName === 'tab') {
            if ((typeof paramValue !== 'undefined') && paramValue !== null && paramValue.length > 0) {
                let tabValue: number | string = (!isNaN(parseInt(paramValue)) ? (parseInt(paramValue) - 1) : paramValue);
                lastTabChange = tabValue;
            }
        } else if (/^(resume|skills|code)$/.test(paramName)) {
            if (!seenParams.has('tab')) {
                lastTabChange = paramName;
            }

            if (paramName === 'skills') {
                if ((typeof paramValue !== 'undefined') && paramValue !== null && paramValue.length > 0) {
                    invokeSortSkillsTable(paramValue);
                }
            }
        } else if (paramName === 'relevant') {
            invokeViewRelevantSkills(true);
        } else if (paramName === 'category') {
            invokeViewSkillCategory(paramValue);
        } else if (paramName === 'scheme') {
            if ((typeof paramValue !== 'undefined') && paramValue !== null) {
                if (/^(|auto|light|dark)$/.test(paramValue)) {
                    invokeSetColorScheme(paramValue);
                }
            }
        }
    }

    if ((typeof lastTabChange !== 'undefined') && lastTabChange !== null) {
        invokeChangeTab(lastTabChange);
    }

    if (shouldPrint) {
        setTimeout(invokePrint, 500);
    }
}

function initPrintHandler() {
    const printHandler: Function = (event: MediaQueryListEvent) => {
        if (event.matches) {
            GA.fireEvent('UX', 'Print', '@media print');
        }
    };
    addMediaQueryListener('print', printHandler);
}

function initSkillsTable(resumeLoader: ResumeLoader): ResumeSkillsTable {
    console.debug('Initializing skills table...');

    const resumeSkillsTable: ResumeSkillsTable = new ResumeSkillsTable(resumeLoader, $('#skills-table'), $('#skill-categories'));
    return resumeSkillsTable;
}

function initResumeComponent(resumeLoader: ResumeLoader): ResumeComponent {
    console.debug('Initializing component...');
    const transformParameters: ResumeTransformParameters = {
        'author-name': '0',
        'employer-sort': 'descending',
        'position-sort': 'descending',
        'show-projects': '0',
        'show-expired-certifications': '0',
        'skills-layout': 'categories',
        'projects-layout': 'list',
        'skill-level-print-min': 2,
        'skill-level-screen-min': 1,
        'system-date': Date.format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
    };
    const resumeComponent: ResumeComponent = new ResumeComponent(resumeLoader, $('.resume-xslt'), transformParameters);
    resumeComponent
    .onRenderStart(response => {
        $.mobile.loading('show', {
            text: 'Transforming résumé XML...',
            textVisible: true
        });
    })
    .onRenderComplete(() => {
        $.mobile.loading('hide');
    });
    return resumeComponent;
}

function initCodeViewer() {
    console.debug('Initializing code viewer...');

    const codeViewer: CodeViewer = new CodeViewer('#code-viewer');
    codeViewer
    .addFile('/main.ts')
    .addFile('/app/Namespace/Namespace.ts')
    .addFile('/app/Env/Env.ts')
    .addFile('/app/CodeViewer/CodeViewer.ts')
    .addFile('/app/iResume/ResumeLoader/ResumeLoader.ts')
    .addFile('/app/iResume/ResumeComponent/ResumeComponent.ts')
    .addFile('/app/iResume/ResumeSkillsTable/ResumeSkillsTable.ts')
    .addFile('/app/XPath/XPath.ts')
    .addFile('/index.html')
    .addFile('/resume.xml', true)
    .addFile('/resume.presentation.xml')
    .addFile('/xsd/resume.xsd')
    .addFile('/resume.xsl')
    .addFile('/scss/resume.scss')
    .addFile('/scss/resume-print.scss')
    .addFile('/scss/_common.scss')
    .init();
}

function initTooltips(resumeLoader?: ResumeLoader) {
    console.debug('Initializing tooltips...');
    const $document: JQuery<Document> = $(document);

    const tooltipShowDuration: number = 400;
    const tooltipShowDelay: number = 500;

    $document.tooltip({
        items: 'table.skills > tbody *[title]:not([data-no-tooltip]), #tab-panel-resume *[title]:not([data-no-tooltip]), #tab-panel-resume time[datetime^="P"]',
        show: {
            duration: tooltipShowDuration,
            delay: tooltipShowDelay
        },
        open: function (event: any, ui: any) {
            const now: Date = new Date();
            $document.data('GA.event.tooltip.last-time', now.getTime());
        },
        close: function (event: any, ui: any) {
            let lastTime: number = $document.data('GA.event.tooltip.last-time');
            if ((typeof lastTime !== 'number')) {
                return;
            }
            const now: Date = new Date();
            let elapsedTime: number = (now.getTime() - lastTime);
            let shownTime: number = (tooltipShowDelay + tooltipShowDuration);
            if (elapsedTime > shownTime) {
                let visibleDuration: number = (elapsedTime - shownTime);
                let target: HTMLElement = event.originalEvent.target;
                let $target: JQuery = $(target);
                let triggerType: string = '';
                let triggerContent: string = '';
                if ($target.is('span.text')) {
                    triggerContent = $.trim($target.text());
                    $target = $target.parent();
                }
                if ($target.is('tr')) {
                    triggerType = 'Skill Table Row';
                    triggerContent = $target.attr('data-name');
                } else if ($target.is('abbr')) {
                    triggerType = 'Abbreviation';
                    triggerContent = $.trim($target.text());
                } else if ($target.is('.skill')) {
                    triggerType = 'Skill';
                } else if ($target.is('time')) {
                    let $competencyDuration: JQuery = $target.closest('.competency-duration');
                    if ($competencyDuration.length > 0) {
                        let $competency: JQuery = $competencyDuration.closest('.competency');
                        let competencyName: string = $.trim($competency.children('.competency-name').text());
                        triggerType = 'Competency Duration';
                        triggerContent = competencyName;
                    } else {
                        let datetime: string = $.trim($target.attr('datetime'));
                        if (datetime.charAt(0) === 'P') {
                            triggerType = 'Duration';
                        } else {
                            triggerType = 'DateTime';
                        }
                    }
                } else {
                    triggerContent = $.trim($target.text());
                }

                const tooltipInfo: string = triggerType + ': ' + triggerContent;
                GA.fireEvent('UX', 'Tooltip', tooltipInfo, visibleDuration);
            }
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
        },
        content: function () {
            let $this: JQuery = $(this);
            let title: string = $.trim($this.attr('title'));
            if ($this.is('.certificate')) {
                let issuer: string = $.trim($this.attr('data-issuer'));
                let name: string = $.trim($this.attr('data-name'));
                let displayName: string;
                if (issuer === name.substring(0, Math.min(name.length, issuer.length))) {
                    displayName = name;
                } else {
                    displayName = issuer + ' ' + name;
                }
                let issueDateRaw: string = $.trim($this.attr('data-issue-date'));
                let expireDateRaw: string = $.trim($this.attr('data-expire-date'));
                let score: number = parseFloat($.trim($this.attr('data-score')));
                let maxScore: number = parseFloat($.trim($this.attr('data-max-score')));
                let issueDate: Date = Date.from(issueDateRaw);
                let expireDate: Date = Date.from(expireDateRaw);
                let now: Date = new Date();
                let issueDateKey: string;
                let expireDateKey: string;
                let issueDatePrecision: string = 'yyyy-MM';
                let expireDatePrecision: string = 'yyyy-MM';
                if (issueDateRaw.length > 8) {
                    issueDatePrecision = 'yyyy-MM-dd';
                }
                if (expireDateRaw.length > 8) {
                    expireDatePrecision = 'yyyy-MM-dd';
                }
                let issueDateMasks: object = {
                    'yyyy-MM': '${issue-date#date(\'MMMM yyyy\')}',
                    'yyyy-MM-dd': '${issue-date#date(\'MMMM d\')}<sup>${issue-day-of-month#suffix}</sup> ${issue-date#date(\'yyyy\')}'
                };
                let expireDateMasks: object = {
                    'yyyy-MM': '${expire-date#date(\'MMMM yyyy\')}',
                    'yyyy-MM-dd': '${expire-date#date(\'MMMM d\')}<sup>${expire-day-of-month#suffix}</sup> ${expire-date#date(\'yyyy\')}'
                };
                let props: object = {
                    'expire-day-of-month': (expireDate !== null ? expireDate.getDate() : ''),
                    'issue-day-of-month': (issueDate !== null ? issueDate.getDate() : ''),
                    'expire-date': expireDate,
                    'issue-date': issueDate
                };
                let r: string = '<div class="header" style="font-size: 1.3em; margin-bottom: 0.5em; text-align: center;">';

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
                    issueDateKey = Date.format(issueDate, issueDatePrecision);
                    r += '<div>Issue Date: <strong>' + String.format(issueDateMasks[issueDatePrecision], props) + '</strong></div>';

                }
                if (expireDate !== null) {
                    expireDateKey = Date.format(expireDate, expireDatePrecision);
                    r += '<div>' + (Date.format(now, expireDatePrecision) <= expireDateKey ? 'Expires' : 'Expired') + ': <strong>' + String.format(expireDateMasks[expireDatePrecision], props) + '</strong></div>';
                }

                r += '</div>';
                return r;
            } else if ($this.is('a[title][href]:not(.skill)')) {
                let r: string = '<div>' + $.trim(title) + '</div>';
                r += '<div style="font-size:0.65em;margin-top: 1em">' + $.trim($this.attr('href')) + '</div>';
                return r;
            } else if ($this.is('[data-name][data-level][data-level-value][data-level-percentage]')) {
                let skillVersion: string = $.trim($this.attr('data-version'));
                let skillVersionHint: string = $.trim($this.attr('data-version-hint'));
                let skillName: string = $.trim($this.attr('data-name'));
                let skillLongName: string = $.trim($this.attr('data-long-name'));
                let skillKey: string = (skillName.length > 0 ? skillName : $.trim($this.text()));
                let skillProperties: object = (resumeLoader ? resumeLoader.getSkillProperties(skillKey) : {});
                let r: string = '<div class="header" style="font-size: 1.3em; text-align: center;">';
                if (skillLongName.length > 0) {
                    r += skillLongName;
                } else if (skillName.length > 0) {
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
                r += '<div style="white-space:pre-wrap; margin-top: 0.8em;">' + String.format(title, skillProperties, ['value', 'originalValue']) + '</div>';

                return r;
            } else if ($this.is('time[datetime^="P"]') && title.length === 0) {
                let datetimeAttr: string = $this.attr('datetime');
                let duration: DurationResult = Duration.getDuration(datetimeAttr);
                let durationText: string[] = Duration.text(duration);
                title = durationText.join(', ');
            }
            return title;
        }
    });
}

function initExportUI(resumeComponent: ResumeComponent) {
    let isBlobSupported = false;
    try {
        isBlobSupported = !!new Blob;
    } catch (e) {
    }
    if (!isBlobSupported) {
        console.debug('This browser does not support Blob. Skipping feature.');
        return;
    }
    console.debug('Initializing export UI...');
    $('#export-button').on('click', function (event, options) {
        resumeComponent.exportToDocx();
    });
}

function initThemeUI() {
    console.debug('Initializing theme UI...');
    let mediaLightScheme = window.matchMedia('(prefers-color-scheme: light)');
    let mediaDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    let $colorSchemeSelect = $('#color-scheme-select');
    $colorSchemeSelect.on('change', function (event, options) {
        let $this: JQuery = $(this);
        let $body: any = $('body');
        let oldPageTheme: string;
        let newPageTheme: string = '';
        let targetValue: string;
        if ($.isPlainObject(options) && ('theme' in options)) {
            targetValue = options.theme;
            // oldPageTheme = (targetValue !== 'a' ? 'a' : 'b');
        } else {
            // oldPageTheme = ($body.pagecontainer('option', 'theme') !== 'a' ? 'b' : 'a');
            // newPageTheme = (oldPageTheme !== 'a' ? 'a' : 'b');
            let $target: any = $(event.target);
            targetValue = $.trim($target.val());
        }

        if ((typeof targetValue === 'undefined') || targetValue === null || targetValue.length === 0) {
            let prefersLightScheme = mediaLightScheme.matches;
            let prefersDarkScheme = mediaDarkScheme.matches;
            targetValue = '';
            newPageTheme = (prefersLightScheme ? 'a' : prefersDarkScheme ? 'b' : 'a');
        } else if (targetValue === 'light') {
            newPageTheme = 'a';
        } else if (targetValue === 'dark') {
            newPageTheme = 'b';
        }
        if (newPageTheme.length === 0) {
            newPageTheme = 'a';
        }

        oldPageTheme = (newPageTheme !== 'b' ? 'b' : 'a');

        savePreference('theme', targetValue);

        $('#highlight-theme').attr('href', '/css/highlight/atom-one-' + (newPageTheme !== 'a' ? 'dark' : 'light') + '.css');
        $('#jqueryui-theme').attr('href', '/css/jquery-ui.' + (newPageTheme !== 'a' ? 'dark-hive' : 'cupertino') + '.theme.min.css');

        $('*[class], *[data-theme]')
        .each(function () {
            const $this: JQuery = $(this);
            const pageTheme: string = $this.attr('data-theme') || newPageTheme;
            if ($this.is('[data-theme]') && (pageTheme !== newPageTheme)) {
                $this.attr('data-theme', newPageTheme);
            }
            const classes: string[] = $.trim($this.attr('class')).split(/\s+/);
            const themeSuffix: RegExp = /^(.+?)((-theme-|-)(a|b))$/;
            $.each(classes, function (index, className) {
                const matcher: RegExpExecArray = themeSuffix.exec(className);
                if (matcher !== null && matcher.length > 0) {
                    if (/^ui-(block|grid)-/.test(matcher[1])) {
                        return true;
                    }
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
        });

        $body.pagecontainer('option', 'theme', newPageTheme);

        if ((typeof options !== 'object') || options.simulated !== true) {
            const themeName: string = (targetValue === '' ? 'Auto' : targetValue === 'light' ? 'Light' : targetValue === 'dark' ? 'Dark' : targetValue);
            GA.fireEvent('UX', 'Change Theme', themeName);
        }
    });

    addMediaQueryListener(mediaDarkScheme, (event) => {
        $colorSchemeSelect.trigger('change', {
            simulated: true
        });
    });
}

function initHighlightThemePicker() {
    console.debug('Initializing highlight theme picker...');

    $('#highlight-theme-picker')
    .find('option[value="' + $.trim($('#highlight-theme').attr('href'))
    .replace(/^.*?\/([a-z0-9_-]+\.css)$/, '$1') + '"]')
    .first()
    .each(function () {
        let $this = $(this);
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
}

function initPreferences() {
    console.debug('Initializing preferences...');

    if (('localStorage' in window)) {
        let theme = null;
        try {
            theme = window.localStorage.getItem('theme');
        } catch (ex) {
        }
        if (theme !== null) {
            $('#color-scheme-select')
            .val(theme)
            .trigger('change', {
                theme: theme,
                simulated: true
            });
        }
    }
}

function initTabs() {
    console.debug('Initializing tabs...');

    let $defaultSelected: JQuery = $();
    const $tabsNav: JQuery = $('#tabs-nav');
    const $tabsNavRadios: JQuery = $tabsNav.find(':radio');
    $tabsNavRadios
    .on('click', function (event, options) {
        const $this: JQuery = $(this);
        $(document.activeElement).trigger('blur');
        const tooltipInstance: any = $(document).tooltip('instance');
        if (typeof tooltipInstance !== 'undefined' && ('tooltips' in tooltipInstance)) {
            let allTooltips: {element: JQuery}[] = tooltipInstance.tooltips;
            $.each(tooltipInstance.tooltips, function (id, tooltipData) {
                tooltipData.element.trigger('focusout').trigger('mouseleave');
            });
        }
        const selectedTabText: string = $.trim($this.closest('.ui-radio').find('label[for="' + $this.attr('id') + '"]').text());
        const $selectedPanel: JQuery = $('.tab-panel[data-panel="' + $this.val() + '"]');
        $('.tab-panel').not($selectedPanel).addClass('ui-screen-hidden');
        $selectedPanel.removeClass('ui-screen-hidden');

        if (typeof options !== 'object' || options.simulated !== true) {
            GA.fireEvent('UX', 'Change Main Tab', selectedTabText);
        }
    });
    $tabsNavRadios.each(function () {
        let $this: JQuery = $(this);
        if ($this.is(':checked')) {
            $defaultSelected = $this;
            return false;
        }
    });
    if ($defaultSelected.length === 0) {
        $tabsNavRadios
        .each(function () {
            let $this: JQuery = $(this);
            let ds: boolean = ($.trim($this.attr('data-default-selected')) === 'true');
            if (ds) {
                $defaultSelected = $this;
                return false;
            }
        });
        if ($defaultSelected.length === 0) {
            $defaultSelected = $tabsNavRadios.first();
        }
    }
    if ($defaultSelected.length > 0) {
        $defaultSelected.trigger('click', {
            simulated: true
        });
        if (('checkboxradio' in $defaultSelected)) {
            $defaultSelected.checkboxradio('refresh');
        }
    }
}

function savePreference(name: string, value: string) {
    if (('localStorage' in window)) {
        try {
            window.localStorage.setItem(name, value);
        } catch (ex) {
        }
    }
}
