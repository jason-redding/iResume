import {Duration, TemporalUnit} from "../../Env/Env";
import XPath, {XPathResultValue} from "../../XPath/XPath";

export interface ResumeResponse {
    id: string;
    type: string;
    xhr: JQuery.jqXHR<any> | XMLHttpRequest;
    document: XMLDocument;
    text: string;
}

export interface ResumeResponseBundle {
    [key: string]: ResumeResponse;
}

export enum ResumeFileType {
    DATA = 'xml',
    TRANSFORM = 'xsl',
    DEFINITION = 'xsd'
}

export interface jqXHRBundle {
    [key: string]: JQuery.jqXHR;
}

export default class ResumeLoader {
    private _onLoadStart: JQuery.Callbacks;
    private _onLoadComplete: JQuery.Callbacks;
    private _onLoadFail: JQuery.Callbacks;
    private _onLoadEnd: JQuery.Callbacks;
    private _file: string;
    private _xpath: XPath;
    private _response: ResumeResponseBundle;

    static PATTERN_PATH: RegExp = /^(.*?\/?)([^/]*)$/;

    constructor(file: string) {
        this.file = file;
        this._onLoadStart = $.Callbacks('memory unique');
        this._onLoadComplete = $.Callbacks('memory unique');
        this._onLoadFail = $.Callbacks('memory unique');
        this._onLoadEnd = $.Callbacks('memory unique');
        this._xpath = new XPath();
    }

    private static _constructPathFor(file_path: string, type: ResumeFileType) {
        let matcher: RegExpExecArray = this.PATTERN_PATH.exec(file_path);
        if (matcher && matcher.length > 0) {
            return `${matcher[1]}${matcher[2]}.${type}`;
        }
        return '';
    }

    private static _xhrToBundle(xhrs: jqXHRBundle): ResumeResponseBundle {
        const responseBundle: ResumeResponseBundle = {};
        if (typeof xhrs === 'object') {
            for (let responseId in xhrs) {
                let matcher: RegExpMatchArray = /\.([^.]+)$/.exec(responseId);
                if (matcher && matcher.length > 0) {
                    let xhr: JQuery.jqXHR = xhrs[responseId];
                    responseBundle[matcher[1]] = {
                        id: responseId,
                        type: matcher[1],
                        xhr: xhr,
                        document: xhr.responseXML,
                        text: xhr.responseText || ''
                    };
                }
            }
        }
        return responseBundle;
    }

    get file(): string {
        return this._file;
    }

    set file(value: string) {
        this._file = value;
    }

    load(): ResumeLoader {
        let xmlPath = this.getDataPath();
        let xslPath = this.getTransformPath();
        let jobs: string[] = [xmlPath, xslPath];
        let xhrList: JQuery.jqXHR[] = [];
        let _jobs: jqXHRBundle = {};
        for (let job of jobs) {
            _jobs[job] = $.get({
                cache: false,
                url: job
            });
            xhrList.push(_jobs[job]);
        }
        this._onLoadStart.fireWith(this, [_jobs]);
        $.when.apply($.when, xhrList)
        .fail((xhr, type, ex) => {
            this._response = null;
            this._xpath.namespace.reset();
            this._onLoadFail.fireWith(this, [null]);
            this._onLoadEnd.fireWith(this, [null]);
        })
        .done(() => {
            this._response = ResumeLoader._xhrToBundle(_jobs);
            this._xpath.initNamespaceFrom(this._response.xml.document);
            this._onLoadComplete.fireWith(this, [this._response]);
            this._onLoadEnd.fireWith(this, [this._response]);
        });
        return this;
    }

    getDataPath() {
        return ResumeLoader._constructPathFor(this.file, ResumeFileType.DATA);
    }

    getTransformPath() {
        return ResumeLoader._constructPathFor(this.file, ResumeFileType.TRANSFORM);
    }

    getDefinitionPath() {
        return ResumeLoader._constructPathFor(this.file, ResumeFileType.DEFINITION);
    }

    onLoadStart(callback: (jobs?: jqXHRBundle) => any | void): ResumeLoader {
        this._onLoadStart.add(callback);
        return this;
    }

    onLoadComplete(callback: (response: ResumeResponseBundle) => any | void): ResumeLoader {
        this._onLoadComplete.add(callback);
        return this;
    }

    onLoadFail(callback: (response: null) => any | void): ResumeLoader {
        this._onLoadFail.add(callback);
        return this;
    }

    onLoadEnd(callback: (response: ResumeResponseBundle | null) => any | void): ResumeLoader {
        this._onLoadEnd.add(callback);
        return this;
    }

    xpath<T extends 'string' | 'number' | 'boolean' | 'node' | 'nodeset' | 'nodes' | 'any'>(context: Node | Node[] | JQuery<Node>, expression: string, type: T): XPathResultValue<T> {
        return this.xpath(context, expression, type);
    }

    getSkillProperties(skillNode: JQuery<Node>): object;
    getSkillProperties(skillName: string): object;
    getSkillProperties(skill: string | JQuery<Node>): object {
        if (!(typeof this._response === 'object' && ('xml' in this._response) && ('document' in this._response.xml) && this._response.xml.document instanceof XMLDocument)) {
            return null;
        }
        let $skill: JQuery<Node>;
        if (typeof skill === 'string' || skill instanceof String) {
            $skill = this._xpath.evaluate(this._response.xml.document, "/r:resume/r:skills/r:skill[translate(normalize-space(r:name), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ', 'abcdefghijklmnopqrstuvwxyz-') = '" + skill.toLowerCase().replace('"\'', '').replace(/\s/gi, '-') + "']", 'node');
        } else {
            $skill = skill;
        }
        const $xmlSkillLevels: JQuery<Node> = this._xpath.evaluate(this._response.xml.document, '/r:resume/r:meta/r:skill/r:levels/r:level', 'nodeset');
        const $xmlCategories: JQuery<Node> = this._xpath.evaluate(this._response.xml.document, '/r:resume/r:meta/r:skill/r:categories/r:category', 'nodeset');
        let maxSkillLevel: number = 0;
        $xmlSkillLevels.each((levelIndex, levelNode) => {
            const level: number = parseFloat($.trim($(levelNode).attr('value')));
            if (level > maxSkillLevel) {
                maxSkillLevel = level;
            }
        });

        const props: object = {
            levels: {
                max: maxSkillLevel,
                preposition: this._xpath.evaluate(this._response.xml.document, '/r:resume/r:meta/r:skill/r:levels/@preposition', 'string') || 'at'
            }
        };

        let totalSkillExperienceRaw: number = 0;
        $.each($skill.children(), (index, element: Element) => {
            const $skillProperty: JQuery<Node> = $(element);
            const skillPropertyName: string = $skillProperty.prop('nodeName');
            const $items: JQuery<Node> = $skillProperty.children();
            if (!(skillPropertyName in props)) {
                props[skillPropertyName] = {};
            }
            if (skillPropertyName === 'experience') {
                let foundSince: boolean = false;
                let firstExperience: Date = null;
                let lastExperience: Date = null;
                props[skillPropertyName].precision = $skillProperty.attr('precision') || TemporalUnit.MONTHS;
                $.each($items, (experienceChildIndex, experienceChild) => {
                    const $experienceChild: JQuery<Node> = $(experienceChild);
                    const experienceType: string = $experienceChild.prop('nodeName');
                    let since: Date = null;
                    let until: Date = null;
                    if (experienceType === 'spanning') {
                        since = Date.from($experienceChild.attr('from-date'));
                        until = Date.from($experienceChild.attr('to-date'));
                        if (lastExperience === null || lastExperience.getTime() < until.getTime()) {
                            lastExperience = until;
                        }
                    } else if (experienceType === 'since') {
                        since = Date.from($experienceChild.attr('date'));
                        until = new Date();
                        foundSince = true;
                    } else {
                        return true;
                    }
                    if (firstExperience === null || firstExperience.getTime() > since.getTime()) {
                        firstExperience = since;
                    }
                    totalSkillExperienceRaw += Math.abs(until.getTime() - since.getTime())
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
                const text: string = $.trim($skillProperty.text());
                $.extend(true, props[skillPropertyName], {
                    value: text
                });
                if (skillPropertyName === 'level') {
                    let levelValue: number = parseFloat($skillProperty.attr('value'));
                    let $metaSkillLevel: JQuery<Node> = $();
                    if (levelValue === 0) {
                        $metaSkillLevel = $xmlSkillLevels.filter('[value="-1"]');
                    }
                    if ($metaSkillLevel.length === 0) {
                        $metaSkillLevel = $xmlSkillLevels.filter('[value="' + Math.floor(levelValue) + '"]');
                    }
                    $metaSkillLevel.each((levelIndex, levelNode) => {
                        $.each((<Element>levelNode).attributes, function (attrIndex, attr) {
                            const attrName: string = attr.localName;
                            let attrValue: string | number = attr.nodeValue;
                            if (!isNaN(parseFloat(attrValue))) {
                                attrValue = parseFloat(attrValue);
                            }
                            props[skillPropertyName][attrName] = attrValue;
                        });
                    });
                }
                $.each(element.attributes, (attrIndex, attr) => {
                    const attrName: string = attr.localName;
                    let attrValue: string | number = attr.nodeValue;
                    if (!isNaN(parseFloat(attrValue))) {
                        attrValue = parseFloat(attrValue);
                    }
                    props[skillPropertyName][attrName] = attrValue;
                });
            } else {
                let value: Array<string | number> = [];
                $items.each((itemIndex, item) => {
                    const $item: JQuery<Node> = $(item);
                    let v: string | number = $item.attr('value');
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
                let $metaSkillLevel: JQuery<Node> = $();
                if (originalValue === 0) {
                    $metaSkillLevel = $xmlSkillLevels.filter('[value="-1"]');
                }
                if ($metaSkillLevel.length === 0) {
                    $metaSkillLevel = $xmlSkillLevels.filter('[value="' + Math.floor(originalValue) + '"]');
                }
                adjustedValue = $.trim((<JQuery>$metaSkillLevel).text());
                $.extend(true, propValue, {
                    percentage: (parseFloat(originalValue) / parseFloat(('' + maxSkillLevel)))
                });
            } else if (propName === 'categories') {
                let cv: string[] = [];
                $.each(adjustedValue, function (index, id) {
                    let value: string = $.trim($xmlCategories.filter('[value="' + id + '"]').text());
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

    then<TResult1 = ResumeResponseBundle, TResult2 = never>(onfulfilled?: ((response: ResumeResponseBundle) => (PromiseLike<TResult1> | TResult1)) | undefined | null, onrejected?: ((reason: any) => (PromiseLike<TResult2> | TResult2)) | undefined | null): ResumeLoader {
        if (typeof onfulfilled !== 'undefined') {
            this._onLoadComplete.add(onfulfilled);
        }
        if (typeof onrejected !== 'undefined') {
            this._onLoadFail.add(onrejected);
        }
        return this;
    }

    catch<TResult = never>(onrejected?: ((reason: any) => (PromiseLike<TResult> | TResult)) | undefined | null): ResumeLoader {
        if (typeof onrejected !== 'undefined') {
            this._onLoadFail.add(onrejected);
        }
        return this;
    }

    finally(onfinally?: () => void): ResumeLoader {
        if (typeof onfinally !== 'undefined') {
            this._onLoadEnd.add(onfinally);
        }
        return this;
    }
}
