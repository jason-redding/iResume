import * as $ from "jquery";
import * as hljs from '../../js/highlight.pack';
import GA from "../GA/GA";

const FILE_TYPES: {
    [key: string]: string
} = {
    'ts': 'TypeScript',
    'js': 'JavaScript',
    'html': 'HTML',
    'xml': 'XML Data',
    'xsd': 'XML Schema Definition',
    'xsl': 'XML Stylesheet',
    'scss': 'SCSS',
    'css': 'CSS'
};

export default class CodeViewer {
    private _files: string[];
    private _defaultFile: string;
    private _element: JQuery | HTMLElement | string;

    constructor(element: JQuery | HTMLElement | string) {
        this._element = element;
        this._files = [];
        this._defaultFile = null;
    }

    addFile(file: string, isSelected: boolean = false): CodeViewer {
        this._files.push(file);
        if (isSelected) {
            this._defaultFile = file;
        }
        return this;
    }

    init(): CodeViewer {
        let $element: JQuery;
        if (typeof this._element === 'string' || this._element instanceof String) {
            $element = $(<string>this._element);
        } else if (this._element instanceof HTMLElement) {
            $element = $(this._element);
        } else {
            $element = this._element;
        }
        $element.html('');

        const uniqueId: number = new Date().getTime();

        const groupList: string[] = [];
        const groups: {
            [key: string]: string[]
        } = {};

        const $pickerContainer: JQuery = $('<div class="select-code-container"/>');

        $('<label/>').addClass('ui-hidden-accessible').attr('for', 'select-code_' + uniqueId)
        .text('Select file:')
        .appendTo($pickerContainer);
        const $select = $('<select/>').attr('id', 'select-code_' + uniqueId)
        .appendTo($pickerContainer);

        for (let file of this._files) {
            let extension: string = CodeViewer.getFileExtension(file);
            if (extension === null) {
                continue;
            }
            let fileList: string[];
            if ((extension in groups)) {
                fileList = groups[extension];
            } else {
                groupList.push(extension);
                groups[extension] = (fileList = []);
            }
            fileList.push(file);
        }

        for (let group of groupList) {
            let groupLabel: string = FILE_TYPES[group];
            let $group = $('<optgroup/>').attr('label', groupLabel)
            .appendTo($select);
            for (let file of groups[group]) {
                let $option = $('<option/>').val(file).text(CodeViewer.getFileName(file));
                if (this._defaultFile === file) {
                    $option.attr('selected', 'selected');
                }
                $option.appendTo($group);
            }
        }

        const $codeViewport: JQuery = $('<pre class="code-container show-when-data-loaded"><code></code></pre>');

        $element
        .append($pickerContainer)
        .append($codeViewport);

        if (('enhanceWithin' in $.fn) && typeof $.fn.enhanceWithin === 'function') {
            $element.enhanceWithin();
        }

        const handleLoadedResource = (data, status, xhr) => {
            let v: any = data;
            if (typeof v === 'string' || v instanceof String) {
                v = $.trim((<JQuery.jqXHR>xhr).responseText);
            } else {
                v = '';
            }
            const $codeView: JQuery = $codeViewport.children('code');
            $codeView.text(v);
            $codeView.attr('class', $.trim($codeView.attr('data-original-classes')));
            try {
                hljs.highlightBlock($codeView[0]);
            } catch (ex) {
                console.error(ex);
            }
            $codeViewport.closest('.tab-panel')
            .removeClass('data-loading')
            [v.length > 0 ? 'addClass' : 'removeClass']('data-loaded');
        };

        $select.on('change.code-viewer', function (event, options) {
            let $this: JQuery = $(this);
            let path: string = $.trim('' + $this.val());
            let $codeView: JQuery = $codeViewport.children('code');
            if (!$codeView.is('[data-original-classes]')) {
                $codeView.attr('data-original-classes', $.trim($codeView.attr('class')));
            }
            let $codePanel: JQuery = $codeView.closest('.tab-panel');
            $codePanel.addClass('data-loading');
            if (typeof options !== 'object' || options.simulated !== true) {
                GA.fireEvent('UX', 'View Code: ' + path);
            }
            $.ajax({
                dataType: 'text',
                url: path
            })
            .always(handleLoadedResource);
        }).triggerHandler('change', {
            simulated: true
        });

        return this;
    }

    static getFileExtension(file: string): string {
        const m: RegExpExecArray = /\.([^./]*)$/.exec(file);
        if (m !== null && m.length > 0) {
            return m[1];
        }
        return null;
    }

    static getFileName(file: string): string {
        const m: RegExpExecArray = /([^/]+)$/.exec(file);
        if (m !== null && m.length > 0) {
            return m[1];
        }
        return null;
    }
}
