import ResumeLoader, {ResumeResponse, ResumeResponseBundle} from '../ResumeLoader/ResumeLoader';
import XPath from "../../XPath/XPath";
import {Duration, DurationResult} from "../../Env/Env";

type StringAsBoolean = 'true' | 'yes' | 'on' | '1' | 'false' | 'no' | 'off' | '0';
type SortOrder = 'ascending' | 'descending';

export interface ResumeViewportProperties {
    latestModifiedDate: Date;
}

export interface ResumeTransformParameters {
    'author-name'?: StringAsBoolean;
    'employer-sort'?: SortOrder;
    'position-sort'?: SortOrder;
    'show-projects'?: StringAsBoolean;
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
        this._callbacksBefore = $.Callbacks('memory unique')
        this._callbacksAfter = $.Callbacks('memory unique');
        const systemDate = Date.format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
        this._transformProperties = $.extend(false, {
            'author-name': '0',
            'employer-sort': 'descending',
            'position-sort': 'descending',
            'show-projects': '1',
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
            xslTransformer.importStylesheet(response.xsl.document);
            for (let pName in transformParameters) {
                xslTransformer.setParameter(null, pName, transformParameters[pName]);
            }
            this._transformedDocument = xslTransformer.transformToDocument(response.xml.document);
        } catch (ex) {
            console.error(ex);
        }

        this.viewport
        .closest('.tab-panel')
        .addClass('transform-applied')
        .addClass('final-rendering');
        this.viewport.html(<any>$('body > .page-wrapper > *', this._transformedDocument));
        this.viewportProperties = {
            latestModifiedDate: latestModifiedDate
        };
        this._applyToViewport();
        if (('enhanceWithin' in $.fn) && typeof $.fn.enhanceWithin === 'function') {
            this.viewport.enhanceWithin();
        }
        this._callbacksAfter.fireWith(this._transformedDocument, [this._transformedDocument, response.xml.document, response.xsl.document]);
    }

    private _applyToViewport(properties: Partial<ResumeViewportProperties> = this.viewportProperties) {
        if ($.isXMLDoc(this._transformedDocument)) {
            const latestModifiedDate: Date = properties.latestModifiedDate;
            const now = new Date();
            this.viewport.each((viewportIndex, viewportElement) => {
                const $viewportElement: JQuery = $(viewportElement);
                if (latestModifiedDate instanceof Date) {
                    $viewportElement.find('.author-contact-info-value.author-last-updated').each((lastUpdatedIndex, lastUpdatedElement) => {
                        const $lastUpdated = $(lastUpdatedElement);
                        const dateFormat = $.trim($lastUpdated.attr('data-date-format'));
                        $lastUpdated.attr('data-detected-date', Date.format(latestModifiedDate, "yyyy-MM-dd'T'HH:mm:ss"));
                        $lastUpdated.text(Date.format(latestModifiedDate, dateFormat));
                    });
                }
                $viewportElement.find('.skill').each((skillIndex, skillElement) => {
                    const $skill: JQuery = $(skillElement);
                    const skillName: string = $skill.attr('data-name');
                    const $experienceNodes: JQuery<Node> = this._xpath.evaluate(this._responseBundle.xml.document, '/r:resume/r:skills/r:skill[translate(normalize-space(r:name), "ABCDEFGHIJKLMNOPQRSTUVWXYZ ", "abcdefghijklmnopqrstuvwxyz-") = "' + skillName.toLowerCase().replace('"', '') + '"]/r:experience/*', 'nodeset');
                    let totalSkillExperience: number = 0;
                    $experienceNodes.each((experienceNodeIndex, experienceNode) => {
                        const $experienceNode: JQuery<Node> = $(experienceNode);
                        const experienceType: string = $experienceNode.prop('nodeName');
                        let since: Date = null;
                        let until: Date = null;
                        if (experienceType === 'spanning') {
                            since = Date.from($experienceNode.attr('from-date'));
                            until = Date.from($experienceNode.attr('to-date'));
                        } else if (experienceType === 'since') {
                            since = Date.from($experienceNode.attr('date'));
                            until = now;
                        } else {
                            return;
                        }
                        totalSkillExperience += Math.abs(until.getTime() - since.getTime());
                    });
                    const skillDuration: DurationResult = Duration.getDuration(totalSkillExperience);
                    let skillDurationISO: string = '';
                    if (skillDuration.years > 0) {
                        skillDurationISO += skillDuration.years + 'Y';
                    }
                    if (skillDuration.months > 0) {
                        skillDurationISO += skillDuration.months + 'M';
                    }
                    if (skillDuration.days > 0) {
                        skillDurationISO += skillDuration.days + 'D';
                    }
                    if (skillDurationISO.length > 0) {
                        $skill.attr('data-experience-duration', 'P' + skillDurationISO);
                    }
                });
            });
        }
    }

    private _getLatestModifiedDate(responseBundle: ResumeResponseBundle) {
        let lastModifiedDate: Date = null;
        for (let responseType in responseBundle) {
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
