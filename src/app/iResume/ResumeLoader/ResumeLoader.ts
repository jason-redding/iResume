
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
        let xmlPath = this.getDataPath();
        let xslPath = this.getTransformPath();
        let jobs: string[] = [xmlPath, xslPath];
        let xhrList: JQuery.jqXHR[] = [];
        for (let job of jobs) {
            this._jobs[job] = $.get(job);
            xhrList.push(this._jobs[job]);
        }
        $.when.apply($.when, xhrList)
        .fail((xhr, type, ex) => {
            this._job.reject(jobs);
        })
        .done(() => {
            this._job.resolve(ResumeLoader._responsesToBundle(ResumeLoader._xhrToResponse(this._jobs)));
        });
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

    getDataPath() {
        return ResumeLoader._constructPathFor(this.file, ResumeFileType.DATA);
    }

    getTransformPath() {
        return ResumeLoader._constructPathFor(this.file, ResumeFileType.TRANSFORM);
    }

    getDefinitionPath() {
        return ResumeLoader._constructPathFor(this.file, ResumeFileType.DEFINITION);
    }

    then<TResult1 = ResumeResponseBundle, TResult2 = never>(onfulfilled?: ((value: ResumeResponseBundle) => (PromiseLike<TResult1> | TResult1)) | undefined | null, onrejected?: ((reason: any) => (PromiseLike<TResult2> | TResult2)) | undefined | null): Promise<TResult1 | TResult2> {
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
