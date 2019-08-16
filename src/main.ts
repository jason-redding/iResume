import * as $ from 'jquery';
import './app/Env/Env';
import ResumeSkillsTable from './app/iResume/ResumeSkillsTable/ResumeSkillsTable';
import ResumeComponent from './app/iResume/ResumeComponent/ResumeComponent';
import ResumeLoader from './app/iResume/ResumeLoader/ResumeLoader';
import * as hljs from './js/highlight.pack';

const resumeLoader: ResumeLoader = new ResumeLoader('/resume');

require(['jqueryui'], () => {
    $(document).on('pagecreate', () => {
        initTabs();
    });
    require(['jquerymobile'], onReady);
});

function onReady() {
    const resumeSkillsTable: ResumeSkillsTable = initSkillsTable();
    initTooltips(resumeSkillsTable);
    initThemeUI();
    initHighlightThemePicker();
    initCodeSelector();
    initResumeComponent();
    initPreferences();
}

function initSkillsTable() {
    console.debug('Initializing skills table...');

    const resumeSkillsTable: ResumeSkillsTable = new ResumeSkillsTable(resumeLoader, $('#skills-table'));
    return resumeSkillsTable;
}

function initTooltips(resumeSkillsTable?: ResumeSkillsTable) {
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
                let skillKey: string = (skillName.length > 0 ? skillName : $.trim($this.text())).toLowerCase().replace(/\s+/gi, '-');
                let skillProperties: object = (resumeSkillsTable ? resumeSkillsTable.getSkillProperties(skillKey) : {});
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

        $body
        .pagecontainer('option', 'theme', newPageTheme);
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

function initCodeSelector() {
    console.debug('Initializing code selector...');

    $('#select-code')
    .on('change', function (event) {
        let $this: JQuery = $(this);
        let path: string = $.trim('' + $this.val());
        let $codeView: JQuery = $('pre#view-code > code');
        let originalClasses;
        if ($codeView.is('[data-original-classes]')) {
            originalClasses = $.trim($codeView.attr('data-original-classes'));
        } else {
            $codeView.attr('data-original-classes', originalClasses = $.trim($codeView.attr('class')));
        }
        loadSourceFile(path)
        .always(function (data, status, xhr) {
            let v: any = data;
            if (typeof v === 'string' || v instanceof String) {
                v = $.trim(xhr.responseText);
            } else {
                v = '';
            }
            $codeView.text(v);
            $codeView.attr('class', originalClasses);
            try {
                hljs.highlightBlock($codeView[0]);
            } catch (ex) {
                console.error(ex);
            }
            $codeView.closest('.tab-panel')[v.length > 0 ? 'addClass' : 'removeClass']('data-loaded');
        });
    })
    .triggerHandler('change');
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
                theme: theme
            });
        }
    }
}

function initTabs() {
    console.debug('Initializing tabs...');

    let $defaultSelected: JQuery = $();
    let $tabsNav: JQuery = $('#tabs-nav');
    let $tabsNavRadios: JQuery = $tabsNav.find(':radio');
    $tabsNavRadios
    .on('click', function (event) {
        let $this: JQuery = $(this);
        $(document.activeElement).trigger('blur');
        let tooltipInstance: any = $(document).tooltip('instance');
        if (typeof tooltipInstance !== 'undefined' && ('tooltips' in tooltipInstance)) {
            let allTooltips: {element: JQuery}[] = tooltipInstance.tooltips;
            $.each(tooltipInstance.tooltips, function (id, tooltipData) {
                tooltipData.element.trigger('focusout').trigger('mouseleave');
            });
        }
        let $selectedPanel = $('.tab-panel[data-panel="' + $this.val() + '"]');
        $('.tab-panel').not($selectedPanel).addClass('ui-screen-hidden');
        $selectedPanel.removeClass('ui-screen-hidden');
    })
    .each(function () {
        let $this: JQuery = $(this);
        let ds = ($.trim($this.attr('data-default-selected')) === 'true');
        if (ds) {
            $defaultSelected = $this;
            return false;
        }
    });
    if ($defaultSelected.length === 0) {
        $defaultSelected = $tabsNavRadios.first();
    }
    if ($defaultSelected.length > 0) {
        $defaultSelected.trigger('click');
        if (('checkboxradio' in $defaultSelected)) {
            $defaultSelected.checkboxradio('refresh');
        }
    }
}

function initResumeComponent() {
    console.debug('Initializing component...');

    const resumeComponent: ResumeComponent = new ResumeComponent(resumeLoader, $('.resume-xslt'));

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