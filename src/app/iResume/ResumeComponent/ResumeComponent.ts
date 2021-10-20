import ResumeLoader, {ResumeFileType, ResumeResponse, ResumeResponseBundle} from '../ResumeLoader/ResumeLoader';
import XPath from '../../XPath/XPath';
import {Duration, DurationResult} from '../../Env/Env';
// import {Document, HeadingLevel, Packer, Paragraph, Table, TableRow, TableCell, TableOfContents, WidthType} from '../../../js/docx/index';
// import {saveAs} from 'file-saver';

export type StringAsBoolean = 'true' | 'yes' | 'on' | '1' | 'false' | 'no' | 'off' | '0';
export type SortOrder = 'ascending' | 'descending';

export type ResumeAuthorLayout = 'split' | 'center' | 'list';
export type ResumeSkillNoteType = 'technical' | 'personal' | 'clarity';

export interface ResumeViewportProperties {
    latestModifiedDate: Date;
}

export interface ResumeTransformParameters {
    'author-name'?: StringAsBoolean;
    'employer-sort'?: SortOrder;
    'position-sort'?: SortOrder;
    'show-projects'?: StringAsBoolean;
    'show-expired-certifications'?: StringAsBoolean;
    'skills-layout'?: 'list' | 'categories';
    'projects-layout'?: 'list' | 'collapsible';
    'skill-level-print-min'?: number | string;
    'skill-level-screen-min'?: number | string;
    'system-date': string;
}

export default class ResumeComponent {
    private _loader: ResumeLoader;
    private _callbacksBefore: JQuery.Callbacks;
    private _callbacksAfter: JQuery.Callbacks;
    private _viewport: JQuery = null;
    private _viewportProperties: Partial<ResumeViewportProperties>;
    private _responseBundle: ResumeResponseBundle = null;
    private _transformedDocument: Document = null;
    private _transformProperties: ResumeTransformParameters = null;
    private _xpath: XPath;

    constructor(loader: ResumeLoader, viewport: JQuery, transformParameters?: ResumeTransformParameters) {
        this.viewport = viewport;
        this.viewportProperties = {};
        this._xpath = new XPath();
        this._callbacksBefore = $.Callbacks('memory unique');
        this._callbacksAfter = $.Callbacks('memory unique');
        const systemDate = Date.format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
        this._transformProperties = $.extend(false, {
            'author-name': '0',
            'employer-sort': 'descending',
            'position-sort': 'descending',
            'show-projects': '1',
            'show-expired-certifications': '0',
            'skills-layout': 'categories',
            'projects-layout': 'list',
            'system-date': systemDate
        }, {}, transformParameters);
        this._loader = loader;
        this._loader.catch(responses => {
            this.viewport.text('Failed to render résumé!');
        });
        this._loader.then(response => {
            if (Object.keys(response).length < 2) {
                console.debug('ERROR!');
                return;
            }
            this._xpath.initNamespaceFrom(response.xml.document);
            this._responseBundle = response;
            this._applyTransform();
        });
    }

    get xmlPath() {
        return this._loader.getDataPath();
    }

    get xslPath(): string {
        return this._loader.getTransformPath();
    }

    get presentationPath(): string {
        return this._loader.getPresentationPath();
    }

    get file(): string {
        if (this._loader instanceof ResumeLoader) {
            return this._loader.file;
        }
        return null;
    }

    set file(value: string) {
        if (this._loader instanceof ResumeLoader) {
            this._loader.file = value;
        }
    }

    get viewport(): JQuery {
        return this._viewport || $();
    }

    set viewport(value: JQuery) {
        let oldVal = (this._viewport || $()).first();
        let newVal = (value || $()).first();
        let isChange = (newVal !== oldVal);
        if (this._viewport) {
            this._viewport.html('');
        }
        this._viewport = value;
        if (isChange) {
            if (this._viewport) {
                this._applyToViewport();
            }
        }
    }

    get viewportProperties(): Partial<ResumeViewportProperties> {
        return this._viewportProperties;
    }

    set viewportProperties(properties: Partial<ResumeViewportProperties>) {
        this._viewportProperties = properties;
    }

    getLoader(): ResumeLoader {
        return this._loader;
    }

    get xmlDocument(): XMLDocument {
        if (this._responseBundle !== null) {
            return this._responseBundle.xml.document;
        }
        return null;
    }

    get xslDocument(): XMLDocument {
        if (this._responseBundle !== null) {
            return this._responseBundle.xsl.document;
        }
        return null;
    }

    get presentationDocument(): XMLDocument {
        let doc: XMLDocument = null;
        if (this._responseBundle === null) {
            return doc;
        }
        let response: ResumeResponse = this._responseBundle['presentation.xml'];
        if ((typeof response !== 'undefined') && $.isXMLDoc(response.document)) {
            doc = response.document;
        }
        return doc;
    }

    get transformedDocument(): XMLDocument {
        return this._transformedDocument;
    }

    onRenderStart(callback: (response: ResumeResponseBundle) => any | void): ResumeComponent {
        this._callbacksBefore.add(callback);
        return this;
    }

    onRenderComplete(callback: () => any | void): ResumeComponent {
        this._callbacksAfter.add(callback);
        return this;
    }

    exportToDocx(): void {
        // const now: Date = new Date();
        // let output: string = '';
        // let authorName: string = this._xpath.evaluate(this.xmlDocument, '/r:resume/r:author/@name', 'string');
        //
        //
        // let doc = new Document({
        //     creator: authorName,
        //     title: authorName + ' - Resume',
        //     description: authorName + '\'s Resume'
        // });
        //
        // const tocResume = new TableOfContents('Summary', {
        //     hyperlink: true
        // });
        //
        // let authorLayoutType: string = this._xpath.evaluate(this.xmlDocument, '/r:resume/r:author/@layout', 'string');
        // let authorItems: JQuery<Node> = this._xpath.evaluate(this.xmlDocument, '/r:resume/r:author/*', 'nodes');
        //
        // let currentCell: TableCell;
        // let currentRow: TableRow = new TableRow({
        //     cantSplit: true,
        //     children: [
        //         currentCell = new TableCell({
        //             children: []
        //         })
        //     ]
        // });
        // let authorTableRows: TableRow[] = [currentRow];
        //
        // for (let i = 0; i < authorItems.length; i++) {
        //     let $authorNode: JQuery<Node> = $(authorItems[i]);
        //     let nodeName: string = $authorNode.prop('nodeName');
        //     if (nodeName === 'split') {
        //         if (i > 0 && i < (authorItems.length - 1)) {
        //
        //         }
        //         continue;
        //     }
        //     if (currentRow === null) {
        //         currentRow = new TableRow({});
        //         authorTableRows.push(currentRow);
        //     }
        //     if (currentCell === null) {
        //         // Time moves *through* you.
        //         currentCell = new TableCell({
        //             children: []
        //         });
        //     }
        //     if (nodeName === 'name') {
        //         currentCell.addChildElement(new Paragraph({
        //             heading: HeadingLevel.HEADING_
        //         }));
        //     } else if (nodeName === 'last-updated') {
        //
        //     } else {
        //
        //     }
        // }
        //
        // let authorTable: Table = new Table({
        //     cantSplit: true,
        //     width: {
        //         size: 100,
        //         type: WidthType.PERCENTAGE
        //     },
        //     rows: authorTableRows
        // });
        //
        // doc.addSection({
        //     properties: {},
        //     children: [
        //         new Paragraph({
        //             heading: HeadingLevel['HEADING_' + 1],
        //             text: authorName
        //         })
        //     ]
        // });
        //
        // doc.addTableOfContents(tocResume);
        //
        // Packer.toBlob(doc).then((blob) => {
        //     saveAs(blob, Date.format(now, 'yyyy-MM-dd') + '_' + authorName.replace(/\s+/g, '_') + '_Resume.docx');
        // });
    }

    private _applyPresentation() {
        const response: ResumeResponseBundle = this._responseBundle;
        const pDoc: XMLDocument = this.presentationDocument;
        const xDoc: XMLDocument = this.xmlDocument;
        const tDoc: JQuery = this.viewport;
        const xp: {
            xml: XPath,
            presentation: XPath,
            transformed: XPath
        } = {
            xml: new XPath(this.xmlDocument),
            presentation: new XPath(this.presentationDocument),
            transformed: new XPath(this.transformedDocument)
        };

        const pSectionMap: {
            [key: string]: JQuery<Node>
        } = {};
        const dSectionMap: {
            [key: string]: JQuery
        } = {};
        const pAuthorMap: {
            [key: string]: JQuery<Node>
        } = {};
        const dAuthorMap: {
            [key: string]: JQuery
        } = {};

        const processAuthorNode: Function = function processAuthorNode($parent: JQuery, $presentationNode: JQuery<Node>, $documentNode: JQuery) {
            const nodeName: string = $presentationNode.prop('nodeName');
            const label: string = ($presentationNode.is('[label]') ? $presentationNode.attr('label') : null);
            const $valueNode: JQuery = ($documentNode ? $documentNode.find('> .author-contact-info-value') : null);

            if (typeof label === 'string') {
                $documentNode.find('> .author-contact-info-label').text(label);
                $valueNode
                .addBack()
                .attr('data-contact-info-label', label);
            }
            if (nodeName === 'last-updated') {
                if ($presentationNode.is('[format]')) {
                    const pFormat: string = $presentationNode.attr('format');
                    const originalDate: string = $valueNode.attr('data-original-date');
                    const detectedDate: string = ($valueNode.is('[data-detected-date]') ? $valueNode.attr('data-detected-date') : null);
                    const lastUpdated: Date = (detectedDate !== null ? Date.from(detectedDate) : Date.from(originalDate));
                    $valueNode.attr('data-date-format', pFormat);
                    let $lastUpdatedTime: JQuery = $valueNode.find('time');
                    if ($lastUpdatedTime.length > 0) {
                        $lastUpdatedTime.attr('datetime', lastUpdated.toISOString());
                    } else {
                        $lastUpdatedTime = $valueNode;
                    }
                    $lastUpdatedTime.attr({
                        'data-no-tooltip': 'true',
                        'title': Date.format(lastUpdated, 'MMMM d{th} yyyy')
                    });
                    $lastUpdatedTime.text(Date.format(lastUpdated, pFormat));
                }
            }
            $parent.append($documentNode);
        };

        const $pageWrapper: JQuery = $('body > .page-wrapper', this.transformedDocument);
        const $mainInner: JQuery = $('body > .page-wrapper > main > .main-inner', this.transformedDocument);
        let $authorWrapper: JQuery = $('body > .page-wrapper > header > .author > .author-contact', this.transformedDocument);
        let $authorItems: JQuery = $authorWrapper.find('.author-contact-info');
        let authorLayout: string = xp.presentation.evaluate(pDoc, '/r:presentation/r:author/@layout', 'string');
        const authorOrder: string[] = [];
        const sectionOrder: string[] = [];

        // Index author presentation nodes
        $.each(xp.presentation.evaluate(pDoc, '/r:presentation/r:author/*', 'nodes'), function (index, node) {
            const $node: JQuery<Node> = $(node);
            const nodeName: string = $node.prop('nodeName');
            authorOrder.push(nodeName);
            pAuthorMap[nodeName] = $node;
        });

        // Index non-author presentation nodes
        $.each(xp.presentation.evaluate(pDoc, '/r:presentation/*[not(local-name() = "author" or local-name() = "meta")]', 'nodes'), function (index, node) {
            const $node: JQuery<Node> = $(node);
            const nodeName: string = $node.prop('nodeName');
            sectionOrder.push(nodeName);
            pSectionMap[nodeName] = $node;
        });

        // Gather non-author document nodes
        $pageWrapper.find('> main > .main-inner > .section-content').each(function (index, element) {
            const $element: JQuery = $(element);
            const sectionKey: string = $.trim($element.attr('data-section'));
            dSectionMap[sectionKey] = $element.add($element.prev('.section-heading[data-section="' + sectionKey + '"]')).detach();
        });

        // Gather author document nodes
        $authorItems.each(function (index, element) {
            const $element: JQuery = $(element);
            const itemKey: string = $.trim($element.attr('data-contact-info-key'));
            dAuthorMap[itemKey] = $element.detach();
        });

        // Now empty author section of document and repopulate using presentation.xml for guidance
        $authorWrapper.html('');
        $authorWrapper
        .removeClass('author-contact-layout-' + ['split', 'center', 'list'].join(' author-contact-layout-'))
        .addClass('author-contact-layout-' + authorLayout);

        const hasSplit: boolean = ('split' in pAuthorMap);
        const splitIndex: number = authorOrder.indexOf('split');
        if (!hasSplit || splitIndex > 0) {
            const $leftAuthor: JQuery = $('<div class="author-contact-left"/>').appendTo($authorWrapper);
            $.each(authorOrder, function (index, key) {
                if (key === 'split') {
                    return false;
                }
                if ((key in pAuthorMap) && (key in dAuthorMap)) {
                    processAuthorNode($leftAuthor, pAuthorMap[key], dAuthorMap[key]);
                }
            });
            if (splitIndex > 0 && authorLayout !== 'split') {
                $('<hr class="author-contact-split"/>').appendTo($authorWrapper);
            }
            if (hasSplit && splitIndex < (authorOrder.length - 1)) {
                const $rightAuthor: JQuery = $('<div class="author-contact-right"/>').appendTo($authorWrapper);
                for (let i = splitIndex + 1; i < authorOrder.length; i++) {
                    const key: string = authorOrder[i];
                    if ((key in pAuthorMap) && (key in dAuthorMap)) {
                        processAuthorNode($rightAuthor, pAuthorMap[key], dAuthorMap[key]);
                    }
                }
            }
        }

        // Now repopulate non-author document nodes using presentation.xml for guidance
        for (let key of sectionOrder) {
            let nodeName: string = pSectionMap[key].prop('nodeName');
            $mainInner.append(dSectionMap[nodeName]);
        }
    }

    private _applyTransform() {
        const response: ResumeResponseBundle = this._responseBundle;
        this._callbacksBefore.fireWith(response, [response]);
        let resultDoc: XMLDocument = null;
        const systemDate = Date.format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
        const latestModifiedDate = this._getLatestModifiedDate(response);
        const transformParameters: Partial<ResumeTransformParameters> = $.extend(false, this._transformProperties, {
            'system-date': systemDate
        });
        try {
            let xslTransformer: XSLTProcessor = new XSLTProcessor();
            xslTransformer.importStylesheet(this.xslDocument);
            for (let pName in transformParameters) {
                xslTransformer.setParameter(null, pName, transformParameters[pName]);
            }
            this._transformedDocument = xslTransformer.transformToDocument(this.xmlDocument);
        } catch (ex) {
            console.error('Failed to apply XSL transform!', ex);
        }

        try {
            this._applyPresentation();
        } catch (ex) {
            console.error('Failed to apply presentation!', ex);
        }

        this.viewport
        .closest('.tab-panel')
        .addClass('transform-applied')
        .addClass('final-rendering');

        let $transformedResume = $('body > .page-wrapper > *', this._transformedDocument);

        this.viewport.html(<any>$transformedResume);
        this.viewportProperties = {
            latestModifiedDate: latestModifiedDate
        };
        this._applyToViewport();
        if (('enhanceWithin' in $.fn) && typeof $.fn.enhanceWithin === 'function') {
            this.viewport.enhanceWithin();
        }
        this._callbacksAfter.fireWith(this.transformedDocument, [this.transformedDocument, this.xmlDocument, this.xslDocument]);
    }

    private _updateTime(node: JQuery, date: Date, format: string, props?: object) {
        let $time: JQuery = node.find('time');
        if (typeof props === 'object') {
            node.attr(props);
        }
        let oldTime: string = null;
        if ($time.length > 0) {
            oldTime = $time.attr('datetime');
            $time.attr('datetime', date.toISOString());
        } else {
            $time = node;
        }
        if ($time.is('[title]') && oldTime !== null) {
            let oldTitle: string = $.trim($time.attr('title'));
            if (Date.format(Date.from(oldTime), 'MMMM d{th} yyyy') === oldTitle) {
                $time.attr('title', Date.format(date, 'MMMM d{th} yyyy'));
            }
        }
        $time.text(Date.format(date, format));
    }

    private _applyToViewport(properties: Partial<ResumeViewportProperties> = this.viewportProperties) {
        if ($.isXMLDoc(this.transformedDocument)) {
            const latestModifiedDate: Date = properties.latestModifiedDate;
            const now = new Date();
            this.viewport.each((viewportIndex, viewportElement) => {
                const $viewportElement: JQuery = $(viewportElement);
                if (latestModifiedDate instanceof Date) {
                    $viewportElement.find('.author-contact-info-value.author-last-updated').each((lastUpdatedIndex, lastUpdatedElement) => {
                        const $lastUpdated: JQuery = $(lastUpdatedElement);
                        const dateFormat: string = $.trim($lastUpdated.attr('data-date-format'));
                        const lastUpdatedISO: string = Date.format(latestModifiedDate, "yyyy-MM-dd'T'HH:mm:ss");
                        this._updateTime($lastUpdated, latestModifiedDate, dateFormat, {
                            'data-detected-date': lastUpdatedISO
                        });
                    });
                }
                $viewportElement.find('.skill').each((skillIndex, skillElement) => {
                    const $skill: JQuery = $(skillElement);
                    const skillName: string = $skill.attr('data-name');
                    let totalSkillExperience: number = 0;
                    let since: Date;
                    let until: Date;
                    let experienceAttr: string = $.trim($skill.attr('data-experience'));
                    if (experienceAttr.length === 0) {
                        experienceAttr = '{}';
                    }
                    const experienceJson: JQuery.PlainObject = JSON.parse(experienceAttr);
                    if (('spanning' in experienceJson)) {
                        for (let span of experienceJson.spanning) {
                            since = Date.from(span['from-date']);
                            until = Date.from(span['to-date']);
                            if (since instanceof Date && until instanceof Date) {
                                totalSkillExperience += Math.abs(until.getTime() - since.getTime());
                            }
                        }
                    }
                    if (('since' in experienceJson)) {
                        since = Date.from(experienceJson.since.date);
                        until = now;
                        if (since instanceof Date && until instanceof Date) {
                            totalSkillExperience += Math.abs(until.getTime() - since.getTime());
                        }
                    }
                    const skillDuration: DurationResult = Duration.getDuration(totalSkillExperience);
                    if (skillDuration.iso.length > 1) {
                        $skill.attr('data-experience-duration', skillDuration.iso);
                    }
                });
            });
        }
    }

    private _getLatestModifiedDate(responseBundle: ResumeResponseBundle, includePresentation: boolean = true) {
        let lastModifiedDate: Date = null;
        for (let responseType in responseBundle) {
            if (responseType === 'presentation.xml' && !includePresentation) {
                continue;
            }
            let response = responseBundle[responseType];
            if (('getResponseHeader' in response.xhr) && (response.xhr.getResponseHeader instanceof Function)) {
                let lastModified = new Date(response.xhr.getResponseHeader('Last-Modified'));
                if (lastModifiedDate === null || lastModifiedDate.getTime() < lastModified.getTime()) {
                    lastModifiedDate = lastModified;
                }
            }
        }
        return lastModifiedDate;
    }
}
