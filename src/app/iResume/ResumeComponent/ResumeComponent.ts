import ResumeLoader, {ResumeResponse, ResumeResponseBundle} from '../ResumeLoader/ResumeLoader';
import XPath from "../../XPath/XPath";
import {Duration, DurationResult} from "../../Env/Env";

interface ResumeViewportProperties {
    latestModifiedDate: Date;
}

export default class ResumeComponent {
    private _loader: ResumeLoader;
    private _viewport: JQuery = null;
    private _viewportProperties: Partial<ResumeViewportProperties>;
    private _responseBundle: ResumeResponseBundle = null;
    private _transformedDocument: Document = null;
    private _xpath: XPath;
    private _runBefore: Array<(response?: ResumeResponseBundle) => any | void> = [];
    private _runAfter: Array<() => any | void> = [];

    constructor(loader: ResumeLoader, viewport: JQuery) {
        this.viewport = viewport;
        this.viewportProperties = {};
        this._xpath = new XPath();
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

    then(callback) {
        this.getLoader().then(callback);
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

    onBeforeRender(callback: (response: ResumeResponseBundle) => any | void) {
        this._runBefore.push(callback);
    }

    onAfterRender(callback: () => any | void) {
        this._runAfter.push(callback);
    }

    private _applyTransform() {
        const response: ResumeResponseBundle = this._responseBundle;
        for (let run of this._runBefore) {
            try {
                run.call(response, response);
            } catch (ex) {
                console.error(ex);
            }
        }
        let resultDoc: XMLDocument = null;
        const systemDate = Date.format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
        const latestModifiedDate = this._getLatestModifiedDate(response);
        const transformParameters = {
            'author-name': '0',
            'position-sort': 'descending',
            'factor-relevance': '1',
            'system-date': systemDate
        };
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
        this.viewportProperties = {
            latestModifiedDate: latestModifiedDate
        };
        this._applyToViewport();
        for (let run of this._runAfter) {
            try {
                run.call(this._transformedDocument, this._transformedDocument, response.xml.document, response.xsl.document);
            } catch (ex) {
                console.error(ex);
            }
        }
    }

    private _applyToViewport(properties: Partial<ResumeViewportProperties> = this.viewportProperties) {
        if ($.isXMLDoc(this._transformedDocument)) {
            let latestModifiedDate: Date = properties.latestModifiedDate;
            this.viewport.each((viewportIndex, viewportElement) => {
                let $viewportElement: JQuery = $(viewportElement);
                $viewportElement
                .closest('.tab-panel')
                .addClass('transform-applied')
                .addClass('final-rendering');
                let $pageContent: any = $('body > .page-wrapper > *', this._transformedDocument);
                $viewportElement.html($pageContent);
                if (latestModifiedDate instanceof Date) {
                    $viewportElement.find('.author-contact-info-value.author-last-updated').each((lastUpdatedIndex, lastUpdatedElement) => {
                        let $lastUpdated = $(lastUpdatedElement);
                        let dateFormat = $.trim($lastUpdated.attr('data-date-format'));
                        $lastUpdated.attr('data-detected-date', Date.format(latestModifiedDate, "yyyy-MM-dd'T'HH:mm:ss"));
                        $lastUpdated.text(Date.format(latestModifiedDate, dateFormat));
                    });
                }
                $viewportElement.find('.skill').each((skillIndex, skillElement) => {
                    let $skill: JQuery = $(skillElement);
                    let skillName: string = $skill.attr('data-name');
                    let $experienceNodes: JQuery<Element> = this._xpath.evaluate(this._responseBundle.xml.document, '/r:resume/r:skills/r:skill[r:name = "' + skillName.replace('"', '') + '"]/r:experience/*', 'nodeset');
                    let totalSkillExperience: number = 0;
                    $experienceNodes.each((experienceNodeIndex, experienceNode) => {
                        let $experienceNode: JQuery<Element> = $(experienceNode);
                        let experienceType: string = $experienceNode.prop('nodeName');
                        let since: Date = null;
                        let until: Date = null;
                        if (experienceType === 'spanning') {
                            since = Date.from(this._xpath.evaluate(experienceNode, '@from', 'string'));
                            until = Date.from(this._xpath.evaluate(experienceNode, '@to', 'string'));
                        } else if (experienceType === 'since') {
                            since = Date.from(this._xpath.evaluate(experienceNode, 'text()', 'string'));
                            until = new Date();
                        } else {
                            return;
                        }
                        totalSkillExperience += Math.abs(until.getTime() - since.getTime());
                    });
                    let skillDuration: DurationResult = Duration.getDuration(totalSkillExperience);
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
                if (('enhanceWithin' in $.fn) && typeof $.fn.enhanceWithin === 'function') {
                    $viewportElement.enhanceWithin();
                }
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
