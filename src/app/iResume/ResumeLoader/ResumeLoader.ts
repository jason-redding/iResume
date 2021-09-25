import {escapeAsAttributeValue, Duration, escapeAsNodeText, scrubClassNameForAttributeValue, TemporalUnit} from "../../Env/Env";
import XPath, {XPathResultValue} from "../../XPath/XPath";
import {ResumeSkillNoteType} from "../ResumeComponent/ResumeComponent";

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
    PRESENTATION = 'presentation.xml',
    DEFINITION = 'xsd'
}

export namespace ResumeFileType {
    let _keys: Set<string> = null;
    let _values: Set<string> = null;

    function _buildFields() {
        if (_keys === null) {
            _keys = new Set();
            _values = new Set();
            let propValue: any;
            for (let propName in ResumeFileType) {
                propValue = ResumeFileType[propName];
                if (typeof propValue === 'string' || propValue instanceof String) {
                    _keys.add(propName);
                    _values.add(<string>propValue);
                }
            }
        }
    }

    export function keys() {
        _buildFields();
        return _keys;
    }

    export function values() {
        _buildFields();
        return _values;
    }
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
    private _presentation: string = null;
    private _xpath: XPath;
    private _response: ResumeResponseBundle;

    static PATTERN_PATH: RegExp = /^(.*?\/?)([^/]*)$/;

    constructor(file: string) {
        this.file = file;
        this._onLoadStart = $.Callbacks('unique');
        this._onLoadComplete = $.Callbacks('unique');
        this._onLoadFail = $.Callbacks('unique');
        this._onLoadEnd = $.Callbacks('unique');
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
            let matchedExtension: string;
            for (let responseId in xhrs) {
                matchedExtension = null;
                for (let ending of ResumeFileType.values()) {
                    if (responseId.endsWith('.' + ending)) {
                        if (matchedExtension === null || matchedExtension.length < ending.length) {
                            matchedExtension = ending;
                        }
                    }
                }
                if (typeof matchedExtension !== 'string') {
                    let matcher: RegExpMatchArray = /\.([^.]+)$/.exec(responseId);
                    if (matcher && matcher.length > 0) {
                        matchedExtension = matcher[1];
                    }
                }
                if (typeof matchedExtension === 'string') {
                    let xhr: JQuery.jqXHR = xhrs[responseId];
                    responseBundle[matchedExtension] = {
                        id: responseId,
                        type: matchedExtension,
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
        // let xslPath = this.getTransformPath();
        let jobs: string[] = [xmlPath];
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
            // this._onLoadComplete.fireWith(this, [this._response]);
            // this._onLoadEnd.fireWith(this, [this._response]);
            let supplementalJobs: JQuery.jqXHR[] = [];
            supplementalJobs.push(this._loadTransform());
            supplementalJobs.push(this._loadPresentation());
            $.when.apply($.when, supplementalJobs)
            .fail((xhr, type, ex) => {
                console.error('Failed to get supplemental files!', ex);
                this._onLoadFail.fireWith(this, [null]);
                this._onLoadEnd.fireWith(this, [null]);
            })
            .done(() => {
                this._onLoadComplete.fireWith(this, [this._response]);
                this._onLoadEnd.fireWith(this, [this._response]);
            });
        });
        return this;
    }

    _loadTransform(): JQuery.jqXHR {
        const jobPath: string = this.getTransformPath();
        let xhr: JQuery.jqXHR = $.get({
            cache: false,
            url: jobPath
        });
        xhr
        // .fail((xhr, type, ex) => {
        //     this._onLoadFail.fireWith(this, [null]);
        //     this._onLoadEnd.fireWith(this, [null]);
        // })
        .done((data, status, xhr) => {
            const jobsBundle: jqXHRBundle = {};
            jobsBundle[jobPath] = xhr;
            $.extend(true, this._response, ResumeLoader._xhrToBundle(jobsBundle));
            // this._onLoadComplete.fireWith(this, [this._response]);
            // this._onLoadEnd.fireWith(this, [this._response]);
        });
        return xhr;
    }

    _loadPresentation(): JQuery.jqXHR {
        const presentationPath: string = this.getPresentationPath();
        let xhr: JQuery.jqXHR = $.get({
            cache: false,
            url: presentationPath
        });
        xhr
        // .fail((xhr, type, ex) => {
        //     this._onLoadFail.fireWith(this, [null]);
        //     this._onLoadEnd.fireWith(this, [null]);
        // })
        .done((data, status, xhr) => {
            const jobsBundle: jqXHRBundle = {};
            jobsBundle[presentationPath] = xhr;
            $.extend(true, this._response, ResumeLoader._xhrToBundle(jobsBundle));
        });
        return xhr;
    }

    setPresentationName(name: string): ResumeLoader {
        if ((typeof name) === 'string' || (<any>name instanceof String)) {
            this._presentation = name + '.presentation.xml';
        } else if (name === null) {
            this._presentation = null;
        }
        return this;
    }

    getPresentationName(): string {
        let presentationName: string = this._presentation;
        if (((typeof presentationName) !== 'string') && !(<any>presentationName instanceof String)) {
            const presentationPath: string = this.getPresentationPath();
            presentationName = presentationPath.replace(/^.*\/?([^/]+)$/, '$1');
        }
        presentationName = presentationName.replace(/\.presentation\.xml$/, '');
        return presentationName;
    }

    getPresentationPath() {
        const filePath: string = this.file.replace(/(\/?)[^/]+$/, '$1');
        if ((typeof this._presentation) === 'string' || (<any>this._presentation instanceof String)) {
            console.log('overiding presentation name!', filePath + this._presentation);
            return filePath + this._presentation;
        }
        if (this._response && this._response.xml && $.isXMLDoc(this._response.xml.document)) {
            let x: XPath = new XPath(this._response.xml.document);
            let referencedPresentation: string = $.trim(x.evaluate(this._response.xml.document, '/r:resume/xi:include[@r:name = "presentation"][1]/@href', 'string'));
            if (referencedPresentation.length > 0) {
                return filePath + referencedPresentation;
            }
        }
        return ResumeLoader._constructPathFor(this.file, ResumeFileType.PRESENTATION);
    }

    getDataPath() {
        return ResumeLoader._constructPathFor(this.file, ResumeFileType.DATA);
    }

    getTransformPath() {
        if (this._response && this._response.xml && $.isXMLDoc(this._response.xml.document)) {
            let referencedStylesheet: string = $.trim(this._xpath.evaluate(this._response.xml.document, '/processing-instruction("xml-stylesheet")', 'string'));
            if (referencedStylesheet.length > 0) {
                const xmlStylesheetAttributes: JQuery.PlainObject = {};
                const REX_ATTRIBUTE: RegExp = /\s*([^=\s]+)="([^"]*)"/g;
                let match: RegExpExecArray = null;
                while ((match = REX_ATTRIBUTE.exec(referencedStylesheet)) != null) {
                    xmlStylesheetAttributes[match[1]] = match[2];
                }
                if (('href' in xmlStylesheetAttributes) && $.trim(xmlStylesheetAttributes.href).length > 0) {
                    let filePath: string = this.file;
                    filePath = filePath.replace(/(\/?)[^/]+$/, '$1');
                    return filePath + xmlStylesheetAttributes.href;
                }
            }
        }
        return ResumeLoader._constructPathFor(this.file, ResumeFileType.TRANSFORM);
    }

    getPresentationDocument() {
        return this._response['presentation.xml'].document;
    }

    getTransformDocument() {
        return this._response.xsl.document;
    }

    getDataDocument() {
        return this._response.xml.document;
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
        const $xmlSkillExperience: JQuery<Node> = this._xpath.evaluate(this._response.xml.document, '/r:resume/r:meta/r:skill/r:experience', 'node');
        const $xmlSkillLevels: JQuery<Node> = this._xpath.evaluate(this._response.xml.document, '/r:resume/r:meta/r:skill/r:experience/r:level', 'nodeset');
        const $xmlCategories: JQuery<Node> = this._xpath.evaluate(this._response.xml.document, '/r:resume/r:meta/r:skill/r:categories/r:category', 'nodeset');
        let maxSkillLevel: number = 0;
        $xmlSkillLevels.each((levelIndex, levelNode) => {
            const level: number = parseFloat($.trim($(levelNode).attr('value')));
            if (!isNaN(level) && level > maxSkillLevel) {
                maxSkillLevel = level;
            }
        });

        const props: JQuery.PlainObject = {
            experience: {
                type: $xmlSkillExperience.attr('type') || 'experience',
                preposition: $xmlSkillExperience.attr('preposition') || 'at'
            }
        };

        let totalSkillExperienceRaw: number = 0;

        $.each($skill.children(), (index, skillChildElement: Element) => {
            const $skillProperty: JQuery<Node> = $(skillChildElement);
            const skillPropertyName: string = $skillProperty.prop('nodeName');
            const $items: JQuery<Node> = $skillProperty.children();
            if (!(skillPropertyName in props)) {
                props[skillPropertyName] = {};
            }

            if (skillPropertyName === 'notes') {
                let value: Array<object> = [];
                $items.each((noteIndex: number, note) => {
                    const $note: JQuery<Node> = $(note);
                    const noteType: string = $.trim($note.attr('type'));
                    value.push({
                        type: noteType,
                        value: $.trim($note.text())
                    });
                });
                $.extend(true, props[skillPropertyName], {
                    value: value
                });
            } else if (skillPropertyName === 'experience') {
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

                let experienceLevelValue: number = parseFloat($skillProperty.attr('level'));
                let $metaSkillLevel: JQuery<Node> = $();
                if (experienceLevelValue === 0) {
                    $metaSkillLevel = $xmlSkillLevels.filter('[value="-1"]');
                }
                if ($metaSkillLevel.length === 0) {
                    $metaSkillLevel = $xmlSkillLevels.filter('[value="' + Math.floor(experienceLevelValue) + '"]');
                }
                $.extend(true, props[skillPropertyName], {
                    level: {
                        value: experienceLevelValue
                    }
                });
                $metaSkillLevel.each((levelIndex, levelNode) => {
                    $.each((<Element>levelNode).attributes, function (attrIndex, attr) {
                        const attrName: string = attr.localName;
                        if (attrName === 'value') {
                            return true;
                        }
                        let attrValue: string | number = attr.nodeValue;
                        if (!isNaN(parseFloat(attrValue))) {
                            attrValue = parseFloat(attrValue);
                        }
                        props[skillPropertyName]['level'][attrName] = attrValue;
                    });
                });

                $.each(skillChildElement.attributes, function (attrIndex, attr) {
                    const attrName: string = attr.localName;
                    if (attrName === 'level') {
                        return true;
                    }
                    let attrValue: string | number = attr.nodeValue;
                    if (!isNaN(parseFloat(attrValue))) {
                        attrValue = parseFloat(attrValue);
                    }
                    props[skillPropertyName][attrName] = attrValue;
                });
                // return true;
            } else if (skillPropertyName === 'categories') {
                const value: Array<string> = [];
                $items.each((itemIndex, item) => {
                    const $item: JQuery<Node> = $(item);
                    const v: string = $.trim($item.attr('value'));
                    value.push(v);
                })
                $.extend(true, props[skillPropertyName], {
                    value: value
                });
            }

            if ($items.length === 0) {
                const text: string = $.trim($skillProperty.text());
                $.extend(true, props[skillPropertyName], {
                    value: text
                });
                $.each(skillChildElement.attributes, (attrIndex, attr) => {
                    const attrName: string = attr.localName;
                    let attrValue: string | number = attr.nodeValue;
                    if (!isNaN(parseFloat(attrValue))) {
                        attrValue = parseFloat(attrValue);
                    }
                    props[skillPropertyName][attrName] = attrValue;
                });
            // } else {
            //     let value: Array<string | number> = [];
            //     $items.each((itemIndex, item) => {
            //         const $item: JQuery<Node> = $(item);
            //         let v: string | number = $item.attr('value');
            //         if (!isNaN(parseFloat(v))) {
            //             v = parseFloat(v);
            //         }
            //         value.push(v);
            //     });
            //     console.log('BEFORE:', props[skillPropertyName]);
            //     $.extend(true, props[skillPropertyName], {
            //         value: value
            //     });
            //     // console.log('AFTER:', props[skillPropertyName]);
            }
        });

        const adjustValueOf: (propName: string, propValue: any) => any = (propName: string, propValue: any) => {
            if (propValue === null || typeof propValue === 'undefined' || typeof propValue === 'number' || typeof propValue === 'boolean' || typeof propValue === 'string' || propValue instanceof String) {
                propValue = {
                    value: propValue
                };
            }
            let originalValue: any = propValue.value;
            let calculatedValue: any = originalValue;
            if (propName === 'notes') {
                if (Array.isArray(originalValue) && originalValue.length > 0) {
                    let notes: string = '<div class="notes">';
                    notes += '<div class="notes-header">';
                    notes += 'Notes:'
                    notes += '</div>';
                    notes += '<div class="notes-content">';
                    for (let note of originalValue) {
                        const noteType: string = $.trim(note.type);
                        const noteText: string = $.trim(note.value);
                        const noteTypeText: string = noteType.charAt(0).toUpperCase() + noteType.substring(1);

                        notes += '<div class="note note-type-' + scrubClassNameForAttributeValue(noteType) + '"';
                        notes += ' data-note-type="' + escapeAsAttributeValue(noteTypeText) + '"'
                        notes += '>';
                        notes += escapeAsNodeText(noteText)
                        notes += '</div>';
                    }
                    notes += '</div>';
                    notes += '</div>';
                    calculatedValue = notes;
                }
            } else if (propName === 'experience') {
                if (typeof propValue.duration.text === 'function') {
                    originalValue = propValue.duration.text();
                    if (Array.isArray(originalValue)) {
                        calculatedValue = originalValue.join(', ');
                    } else {
                        calculatedValue = originalValue;
                    }
                }
                $.extend(true, propValue, {
                    duration: {
                        originalValue: originalValue,
                        value: calculatedValue
                    }
                });
            } else if (propName === 'level') {
                let $metaSkillLevel: JQuery<Node> = $();
                if (originalValue === 0) {
                    $metaSkillLevel = $xmlSkillLevels.filter('[value="-1"]');
                }
                if ($metaSkillLevel.length === 0) {
                    $metaSkillLevel = $xmlSkillLevels.filter('[value="' + Math.floor(originalValue) + '"]');
                }
                calculatedValue = $.trim((<JQuery>$metaSkillLevel).text());
                $.extend(true, props, {
                    experience: {
                        type: $metaSkillLevel.attr('type') || $metaSkillLevel.parent().attr('type') || 'experience',
                    }
                });
                $.extend(true, propValue, {
                    max: maxSkillLevel,
                    percentage: (parseFloat(originalValue) / parseFloat(('' + maxSkillLevel)))
                });
            } else if (propName === 'categories') {
                let cv: string[] = [];
                $.each(calculatedValue, function (index, id) {
                    let value: string = $.trim($xmlCategories.filter('[value="' + id + '"]').text());
                    if (value.length > 0) {
                        cv.push(value);
                    }
                });
                cv.sort();
                calculatedValue = cv.join(', ');
            }
            $.extend(true, propValue, {
                originalValue: originalValue,
                value: calculatedValue
            });
        };

        $.each(props, adjustValueOf);
        $.each(props.experience, adjustValueOf);

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
