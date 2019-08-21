
export interface ResumeResponse {
    id: string;
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

interface jqXHRBundle {
    [key: string]: JQuery.jqXHR;
}

export default class ResumeLoader implements Promise<ResumeResponseBundle | JQuery.jqXHR[]> {
    [Symbol.toStringTag]: string;

    private _job: JQueryDeferred<any>;
    private _file: string;
    private _jobs: jqXHRBundle;
    private _runBefore: Array<(jobs?: jqXHRBundle) => any | void> = [];
    private _runAfter: Array<(response?: ResumeResponseBundle) => any | void> = [];

    static PATTERN_PATH: RegExp = /^(.*?\/?)([^/]*)$/;

    get file(): string {
        return this._file;
    }

    set file(value: string) {
        this._file = value;
    }

    constructor(file: string) {
        this.file = file;
        this._job = $.Deferred();
        this._jobs = {};
    }

    private static _constructPathFor(file_path: string, type: ResumeFileType) {
        let pm = this.PATTERN_PATH.exec(file_path);
        if (pm && pm.length > 0) {
            return `${pm[1]}${pm[2]}.${type}`;
        }
        return '';
    }

    private static _responsesToBundle(responses: ResumeResponse[]): ResumeResponseBundle {
        const responseBundle: ResumeResponseBundle = {};
        for (let response of responses) {
            let match: RegExpMatchArray = /\.([^.]+)$/.exec(response.id);
            if (match && match.length > 0) {
                responseBundle[match[1]] = response;
            }
        }
        return responseBundle;
    }

    private static _xhrToResponse(xhrs: jqXHRBundle): ResumeResponse[] {
        const responses: ResumeResponse[] = [];
        if (xhrs) {
            if (Object.isPlainObject(xhrs)) {
                for (let responseId in xhrs) {
                    responses.push({
                        id: responseId,
                        xhr: xhrs[responseId],
                        document: xhrs[responseId].responseXML,
                        text: xhrs[responseId].responseText || ''
                    });
                }
            }
        }
        return responses;
    }

    load(): ResumeLoader {
        let xmlPath = this.getDataPath();
        let xslPath = this.getTransformPath();
        let jobs: string[] = [xmlPath, xslPath];
        let xhrList: JQuery.jqXHR[] = [];
        for (let job of jobs) {
            this._jobs[job] = $.get({
                cache: false,
                url: job
            });
            xhrList.push(this._jobs[job]);
        }
        this._triggerBefore(this._jobs);
        $.when.apply($.when, xhrList)
        .fail((xhr, type, ex) => {
            this._triggerAfter(null);
            this._job.reject(jobs);
        })
        .done(() => {
            const responseBundle: ResumeResponseBundle = ResumeLoader._responsesToBundle(ResumeLoader._xhrToResponse(this._jobs));
            this._triggerAfter(responseBundle);
            this._job.resolve(responseBundle);
        });
        return this;
    }

    _triggerBefore(jobs: jqXHRBundle) {
        for (let run of this._runBefore) {
            try {
                run.call(this, jobs);
            } catch (ex) {
                console.error(ex);
            }
        }
    }

    _triggerAfter(response: ResumeResponseBundle) {
        for (let run of this._runAfter) {
            try {
                run.call(this, response);
            } catch (ex) {
                console.error(ex);
            }
        }
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

    onBefore(callback: (jobs?: jqXHRBundle) => any | void) {
        this._runBefore.push(callback);
    }

    onAfter(callback: (response?: ResumeResponseBundle) => any | void) {
        this._runAfter.push(callback);
    }

    then<TResult1 = ResumeResponseBundle, TResult2 = never>(onfulfilled?: ((response: ResumeResponseBundle) => (PromiseLike<TResult1> | TResult1)) | undefined | null, onrejected?: ((reason: any) => (PromiseLike<TResult2> | TResult2)) | undefined | null): Promise<TResult1 | TResult2> {
        this._job.then(onfulfilled, onrejected);
        return;
    }

    catch<TResult = never>(onrejected?: ((reason: any) => (PromiseLike<TResult> | TResult)) | undefined | null): Promise<JQuery.jqXHR[] | TResult> {
        this._job.fail(onrejected);
        return;
    }

    finally(onfinally?: () => void): Promise<ResumeResponseBundle> {
        this._job.always(onfinally);
        return;
    }
}
