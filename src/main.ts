import * as $ from 'jquery';
import './app/Env/Env';
import ResumeSkillsTable from './app/iResume/ResumeSkillsTable/ResumeSkillsTable';
import ResumeComponent, {ResumeTransformParameters} from './app/iResume/ResumeComponent/ResumeComponent';
import ResumeLoader from './app/iResume/ResumeLoader/ResumeLoader';
import CodeViewer from "./app/CodeViewer/CodeViewer";
import GA from "./app/GA/GA";

onReady();

function onReady() {
    initPrintHandler();
    initHashHandling();
    initThemeUI();
    initPreferences();
    loadResume();
    initHighlightThemePicker();
    initCodeSelector();
    initTabs();
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
        initSkillsTable(resumeLoader);
        initTooltips(resumeLoader);
        initResumeComponent(resumeLoader);
    })
    .load();
    return resumeLoader;
}

function initHashHandling() {
    $(window).on('pagecontainerbeforechange.iresume', function (event, ui) {
        if (typeof ui.toPage === 'string' || ui.toPage instanceof String) {
            const url: ParsedPath = $.mobile.path.parseUrl(ui.toPage);
            const m: RegExpExecArray = /^#(position-.+)$/.exec(url.hash);
            if (m !== null && m.length > 0) {
                let $targetElement: JQuery = $('a[name="' + m[1] + '"]', ui.prevPage);
                if ($targetElement.length === 0) {
                    $targetElement = $('[id="' + m[1] + '"]', ui.prevPage);
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

function initPrintHandler() {
    const mediaQuery: MediaQueryList = window.matchMedia('print');
    const printHandler: Function = (event) => {
        if (event.matches) {
            GA.fireEvent('UX', 'print', 'Print Resume');
        }
    };
    for (let method of [{name: 'addListener', arguments: [printHandler]}, {name: 'addEventListener', arguments: ['change', printHandler]}]) {
        const methodName: string = method.name;
        if ((methodName in mediaQuery)) {
            (<Function>mediaQuery[methodName]).apply(mediaQuery, method.arguments);
            break;
        }
    }
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
        'show-projects': '1',
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

function initCodeSelector() {
    console.debug('Initializing code selector...');

    const codeViewer: CodeViewer = new CodeViewer('#code-viewer');
    codeViewer
    .addFile('/main.ts')
    .addFile('/app/Namespace/Namespace.ts')
    .addFile('/app/Env/Env.ts')
    .addFile('/app/iResume/ResumeLoader/ResumeLoader.ts')
    .addFile('/app/iResume/ResumeComponent/ResumeComponent.ts')
    .addFile('/app/iResume/ResumeSkillsTable/ResumeSkillsTable.ts')
    .addFile('/app/XPath/XPath.ts')
    .addFile('/index.html')
    .addFile('/resume.xml', true)
    .addFile('/xsd/resume.xsd')
    .addFile('/resume.xsl')
    .addFile('/scss/resume.scss')
    .addFile('/scss/resume-print.scss')
    .addFile('/scss/_common.scss')
    .init();
}

function initTooltips(resumeLoader?: ResumeLoader) {
    console.debug('Initializing tooltips...');

    $(document).tooltip({
        items: 'table.skills > tbody *[title], #tab-panel-resume *[title]',
        content: function () {
            let $this: JQuery = $(this);
            let title: string = $.trim($this.attr('title'));
            if ($this.is('.certificate')) {
                let issuer = $.trim($this.attr('data-issuer'));
                let name = $.trim($this.attr('data-name'));
                let displayName;
                if (issuer === name.substring(0, Math.min(name.length, issuer.length))) {
                    displayName = name;
                } else {
                    displayName = issuer + ' ' + name;
                }
                let issueDateRaw = $.trim($this.attr('data-issue-date'));
                let expireDateRaw = $.trim($this.attr('data-expire-date'));
                let score = parseFloat($.trim($this.attr('data-score')));
                let maxScore = parseFloat($.trim($this.attr('data-max-score')));
                let issueDate = Date.from(issueDateRaw);
                let expireDate = Date.from(expireDateRaw);
                let now = new Date();
                let issueDateKey;
                let expireDateKey;
                let issueDatePrecision = 'yyyy-MM';
                let expireDatePrecision = 'yyyy-MM';
                if (issueDateRaw.length > 8) {
                    issueDatePrecision = 'yyyy-MM-dd';
                }
                if (expireDateRaw.length > 8) {
                    expireDatePrecision = 'yyyy-MM-dd';
                }
                let issueDateMasks = {
                    'yyyy-MM': '${issue-date#date(\'MMMM yyyy\')}',
                    'yyyy-MM-dd': '${issue-date#date(\'MMMM d\')}<sup>${issue-day-of-month#suffix}</sup> ${issue-date#date(\'yyyy\')}'
                };
                let expireDateMasks = {
                    'yyyy-MM': '${expire-date#date(\'MMMM yyyy\')}',
                    'yyyy-MM-dd': '${expire-date#date(\'MMMM d\')}<sup>${expire-day-of-month#suffix}</sup> ${expire-date#date(\'yyyy\')}'
                };
                let props = {
                    'expire-day-of-month': (expireDate !== null ? expireDate.getDate() : ''),
                    'issue-day-of-month': (issueDate !== null ? issueDate.getDate() : ''),
                    'expire-date': expireDate,
                    'issue-date': issueDate
                };
                let r = '<div class="header" style="font-size: 1.3em; margin-bottom: 0.5em; text-align: center;">';

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
                let skillKey: string = (skillName.length > 0 ? skillName : $.trim($this.text()));
                let skillProperties: object = (resumeLoader ? resumeLoader.getSkillProperties(skillKey) : {});
                let r: string = '<div class="header" style="font-size: 1.3em; text-align: center;">';
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
                r += '<div style="white-space:pre-wrap; margin-top: 0.8em;">' + String.format(title, skillProperties, ['value', 'originalValue']) + '</div>';
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
}

function initThemeUI() {
    console.debug('Initializing theme UI...');
    $('#theme-toggle-button').on('click', function (event, options) {
        let $body: any = $('body');
        let oldPageTheme: string;
        let newPageTheme: string;
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
            let $this: JQuery = $(this);
            let pageTheme: string = $this.attr('data-theme') || newPageTheme;
            if ($this.is('[data-theme]') && (pageTheme !== newPageTheme)) {
                $this.attr('data-theme', newPageTheme);
            }
            let classes: string[] = $.trim($this.attr('class')).split(/\s+/);
            let themeSuffix: RegExp = /^(.+?)((-theme-|-)(a|b))$/;
            $.each(classes, function (index, className) {
                let matcher = themeSuffix.exec(className);
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

        if (typeof options !== 'object' || options.simulated !== true) {
            GA.fireEvent('UX', 'Change Theme: ' + (newPageTheme === 'a' ? 'Light' : 'Dark'));
        }
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
            $('#theme-toggle-button').trigger('click', {
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
            GA.fireEvent('UX', 'Change Main Tab: ' + selectedTabText);
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

function loadSourceFile(path: string): JQueryPromise<any> {
    let dfd: JQueryDeferred<any> = $.Deferred();
    path = $.trim(path);
    if (path.length > 0) {
        $.ajax({
            dataType: 'text',
            url: path
        })
        .done(function (data, status, xhr) {
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

function savePreference(name: string, value: string) {
    if (('localStorage' in window)) {
        try {
            window.localStorage.setItem(name, value);
        } catch (ex) {
        }
    }
}
