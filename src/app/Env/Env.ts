import * as $ from 'jquery';

declare global {
    interface ObjectConstructor {
        isPlainObject: (obj: any) => boolean;
    }

    interface DateConstructor {
        from: (text: string) => Date;
        format: (date: Date, format: string, ...args) => string;
        isLeapYear: (year: number) => boolean;
        getCompactDayName: (day: number) => string;
        getDayName: (day: number) => string;
        getMonthName: (month: number) => string;
    }

    interface Date {
        isLeapYear: () => boolean;
        getPreviousMonth: () => Date;
        getNextMonth: () => Date;
        getCompactDayName: () => string;
        getDayName: () => string;
        getMonthStartingDay: () => number;
        getMonthName: () => string;
        getMonthLength: () => number;
        getMonthRowCount: () => number;
        relativeToNow: () => string;
    }

    interface NumberConstructor {
        getSuffix: (value: number, ...args) => string;
    }

    interface StringConstructor {
        isDateISO8601: (text: string) => boolean;
        formatISO8601Date: (text: string) => string;
        dateFromISO8601: (text: string) => Date;
        decodeHTML: (html: string) => string;
        removeHTML: (html: string) => string;
        format: (context: string, properties?: object, defaultProperties?: string | string[]) => string;
        padLeft: (text: string | number, size: number, character: string) => string;
        padRight: (text: string | number, size: number, character: string) => string;
    }
}

enum OPEN_SYMBOL {
    "'" = 'string',
    '"' = 'string',
    '[' = 'array',
    '{' = 'object'
}
enum CLOSE_SYMBOL {
    "'" = 'string',
    '"' = 'string',
    ']' = 'array',
    '}' = 'object'
}

enum OPEN_PAIRS {
    array = '[',
    object = '{'
}
enum CLOSE_PAIRS {
    array = ']',
    object = '}'
}

export enum TemporalUnit {
    YEARS = 'years',
    MONTHS = 'months',
    DAYS = 'days',
    HOURS = 'hours',
    MINUTES = 'minutes',
    SECONDS = 'seconds',
    MILLISECONDS = 'milliseconds'
}

interface DepthMap {
    string: number;
    array: number;
    object: number;
}

export interface DurationResult {
    years: number;
    months: number;
    days: number;
    totalYears: number;
    totalMonths: number;
    totalDays: number;
    totalMilliseconds: number;
    iso: string;
}

export class Duration {
    private _duration: DurationResult;

    constructor(milliseconds: number) {
        const to: Date = new Date();
        const from: Date = new Date(to.getTime() - milliseconds);
        this._duration = Duration.getDuration(from, to);
    }

    get years(): number {
        return this._duration.years;
    }
    get months(): number {
        return this._duration.months;
    }
    get days(): number {
        return this._duration.days;
    }
    get totalYears(): number {
        return this._duration.totalYears;
    }
    get totalMonths(): number {
        return this._duration.totalMonths;
    }
    get totalDays(): number {
        return this._duration.totalDays;
    }
    get totalMilliseconds(): number {
        return this._duration.totalMilliseconds;
    }
    get iso(): string {
        return this._duration.iso;
    }

    text(unit: TemporalUnit.YEARS | TemporalUnit.MONTHS | TemporalUnit.DAYS = null): string[] {
        return Duration.text(this, unit);
    }

    static text(duration: DurationResult, unit: TemporalUnit.YEARS | TemporalUnit.MONTHS | TemporalUnit.DAYS = null): string[] {
        const r: string[] = [];

        if (duration.years > 0) {
            r.push(duration.years + ' year' + (duration.years === 1 ? '' : 's'));
        }
        if (r.length === 0 || unit === null || unit === TemporalUnit.MONTHS || unit === TemporalUnit.DAYS) {
            if (duration.months > 0) {
                r.push(duration.months + ' month' + (duration.months === 1 ? '' : 's'));
            }
        }
        if (r.length === 0 || unit === null || unit === TemporalUnit.DAYS) {
            if (duration.days > 0) {
                r.push(duration.days + ' day' + (duration.days === 1 ? '' : 's'));
            }
        }
        return r;
    }

    static create(from: Date, to:Date): Duration {
        return new Duration(Math.abs(to.getTime() - from.getTime()));
    }

    static getDuration(milliseconds: number): DurationResult;
    static getDuration(from: Date, to: Date): DurationResult;
    static getDuration(param1: number | Date, param2?: Date): DurationResult {
        let from: Date;
        let to: Date;
        if (typeof param1 === 'number') {
            to = new Date();
            from = new Date(to.getTime() - param1);
        } else if (typeof param2 !== 'undefined') {
            from = param1;
            to = param2;
        }

        if (from.getTime() > to.getTime()) {
            [from, to] = [to, from];
        }

        let [fromYear, fromMonth, fromDay] = [parseInt(Date.format(from, 'yyyy')), parseInt(Date.format(from, 'M')), parseInt(Date.format(from, 'd'))];
        let [toYear, toMonth, toDay] = [parseInt(Date.format(to, 'yyyy')), parseInt(Date.format(to, 'M')), parseInt(Date.format(to, 'd'))];

        let diffMilliseconds: number = Math.abs(from.getTime() - to.getTime());
        let diffDays: number = diffMilliseconds / 1000 / 60 / 60 / 24;

        const targetMonthKey: string = Date.format(to, 'yyyy-MM');
        let monthPointer: Date = new Date(from.getTime());
        let monthKey: string;
        let monthSpan: number = 0;
        while ((monthKey = Date.format(monthPointer, 'yyyy-MM')) < targetMonthKey) {
            monthPointer = monthPointer.getNextMonth();
            monthSpan++;
        }
        let dayCount: number = (toDay - fromDay);
        let years: number = Math.floor(monthSpan / 12);
        let months: number = (monthSpan % 12);
        let days: number = (dayCount > 0 ? dayCount : 0);

        const rv: DurationResult = {
            years: years,
            months: months,
            days: days,
            totalYears: monthSpan / 12,
            totalMonths: monthSpan,
            totalDays: diffDays,
            totalMilliseconds: diffMilliseconds,
            iso: 'P' + (years > 0 ? years + 'Y' : '') + (months > 0 ? months + 'M' : '') + (days > 0 ? days + 'D' : '')
        };

        return rv;
    }
}

export class ArgumentTokenizer {
    private _input: string;
    private _properties: object;
    private _startIndex: number;
    private _char: string;
    private _token: string;
    private _typeStack: string[];
    private _depthMap: Partial<DepthMap>;
    private _withinString: boolean | string;
    private _tokens: any[];

    public static parse(input: string = '', properties: object = {}): any[] {
        const argTokenizer = new ArgumentTokenizer(input, properties);
        return argTokenizer.parse();
    }

    constructor(input: string = '', properties: object = {}) {
        this.reset(input, properties);
    }

    reset(input: string = '', properties: object = {}): ArgumentTokenizer {
        this._input = input;
        this._properties = properties;
        this._startIndex = 0;
        this._char = '';
        this._token = '';
        this._typeStack = [];
        this._depthMap = {};
        this._withinString = false;
        this._tokens = [];
        return this;
    }

    parse(): any[] {
        this._tokens = [];
        if (typeof this._input !== 'string') {
            return this._tokens;
        }
        while ((this._char = this.next()) !== null) {
            if (this._withinString !== false) {
                if (this._char === '\\' && this.next(true) === this._withinString) {
                    this._token += "'";
                    this._startIndex++;
                    continue;
                } else if (this._char !== this._withinString) {
                    this._token += this._char;
                    continue;
                }
            }
            if (/\s/.test(this._char)) {
                continue;
            } else if (/['"]/.test(this._char)) {
                if (this._char === this._withinString) {
                    this._token += '"';
                    this._withinString = false;
                    if (this._typeStack.indexOf('array') === -1 && this._typeStack.indexOf('object') === -1 && this._typeStack[this._typeStack.length - 1] === CLOSE_SYMBOL[this._char]) {
                        this.evalToken();
                    } else {
                        this._typeStack.pop();
                    }
                    continue;
                } else {
                    this._withinString = this._char;
                    this._char = '"';
                }
            } else if (/\d/.test(this._char)) {
                this._typeStack.push('number');
                let hasDot: boolean = false;
                this._token += this._char;
                while ((this._char = this.next()) !== null) {
                    if (/[.\d]/.test(this._char)) {
                        if (this._char === '.') {
                            if (!hasDot) {
                                hasDot = true;
                            } else {
                                break;
                            }
                        }
                        this._token += this._char;
                    } else {
                        if (this._typeStack.indexOf('array') === -1 && this._typeStack.indexOf('object') === -1 && this._char === ',') {
                            this.evalToken();
                        } else {
                            this._typeStack.pop();
                        }
                        break;
                    }
                }
                if (this._char === null) {
                    continue;
                }
            }
            if (this._char in OPEN_SYMBOL) {
                this._typeStack.push(OPEN_SYMBOL[this._char]);
                this._token += this._char;
                this.stepInto(this._char);
                continue;
            } else if (this._char in CLOSE_SYMBOL) {
                this._token += this._char;
                if (this._isClosing(this._char) && this._depthMap[CLOSE_SYMBOL[this._char]] === 1) {
                    this.evalToken();
                    continue;
                }
            } else if (this._typeStack.indexOf('array') === -1 && this._typeStack.indexOf('object') === -1 && this._char === ',') {
                this._token = '';
                continue;
            }
            this._token += this._char;
        }
        if (this._token.length > 0) {
            this.evalToken();
        }
        return this._tokens;
    }

    getTokens(): any[] {
        return this._tokens;
    }

    private next(peek?: boolean): string {
        if (this._startIndex < this._input.length) {
            let r = this._input.charAt(this._startIndex);
            if (peek !== true) {
                this._startIndex++;
            }
            return r;
        }
        return null;
    }

    private evalToken(): string | number | object | Array<any> {
        let token: any = this._token;
        if (token === 'true' || token === 'false') {
            this._tokens.push((token === 'true'));
            this._token = '';
            return;
        }
        let type = this._typeStack.pop();
        try {
            if (type === 'string') {
                token = ('' + token).replace(/(^"|"$)/g, '');
            } else if (type === 'number') {
                token = parseFloat(token);
            } else if (type === 'object' || type === 'array') {
                token = JSON.parse(token);
            } else {
                try {
                    var temp = String.format('${' + token + '}', this._properties);
                    token = temp;
                } catch (ex) {
                    console.dir(ex);
                }
            }
        } catch (ex) {
            console.dir(ex);
        }
        this._tokens.push(token);
        this._token = '';
        return token;
    }

    private stepInto(c: string): void {
        if (!(c in OPEN_SYMBOL)) {
            return;
        }
        let symbolType: string = OPEN_SYMBOL[c];
        if (!(symbolType in OPEN_PAIRS)) {
            return;
        }
        if (!(symbolType in this._depthMap)) {
            this._depthMap[symbolType] = 0;
        }
        this._depthMap[symbolType]++;
    }

    private stepOut(c: string): void {
        let isClosing = this._isClosing(c);
        if (isClosing) {
            let symbolType: string = CLOSE_SYMBOL[c];
            this._depthMap[symbolType]--;
            let symbolDepth: number = this._depthMap[symbolType];
            if (symbolDepth === 0) {
                this.evalToken();
            }
        }
    }

    private _isClosing(c: string): boolean {
        while (true) {
            if (!(c in CLOSE_SYMBOL)) {
                break;
            }
            let symbolType: string = CLOSE_SYMBOL[c];
            if (!(symbolType in CLOSE_PAIRS)) {
                break;
            }
            let lastSymbolType: string = (this._typeStack.length > 0 ? this._typeStack[this._typeStack.length - 1] : null);
            if (lastSymbolType !== symbolType) {
                console.debug(`This probably shouldn't happen!`);
                break;
            }
            if (!(symbolType in this._depthMap)) {
                break;
            }
            return true;
        }
        return false;
    }
}

export class StringFormatter {
    private _format: string;
    private _properties: object;
    private _defaultProperties: string | string[];
    private _startIndex: number = 0;
    private _argumentTokenizer: ArgumentTokenizer;

    constructor(format: string = '', properties: object = {}, defaultProperties: string | string[] = null) {
        this._format = format;
        this._properties = properties;
        if (typeof defaultProperties === 'string' || defaultProperties instanceof String) {
            this._defaultProperties = [(<string>defaultProperties)];
        } else {
            this._defaultProperties = defaultProperties;
        }
        this._argumentTokenizer = new ArgumentTokenizer();
    }

    format(): string {
        let result = '';
        if (this._format && this._format.length > 0) {
            this._startIndex = 0;
            let foundIndex: number = 0;
            let depth: number = 0;
            let token: string = '';
            while (this._startIndex < this._format.length) {
                foundIndex = this._format.indexOf('${', this._startIndex);
                if (foundIndex >= this._startIndex) {
                    if (this._startIndex < foundIndex) {
                        result += this._format.substring(this._startIndex, foundIndex);
                    }
                    this._startIndex = foundIndex + 2;
                    depth++;
                } else {
                    if (this._startIndex < this._format.length) {
                        result += this._format.substring(this._startIndex);
                    }
                    this._startIndex = this._format.length;
                }
                if (this._startIndex >= this._format.length) {
                    break;
                }
                token = '';
                let c: string;
                while ((c = this._readNextChar()) !== null) {
                    if (c === '{') {
                        depth++;
                    } else if (c === '}') {
                        depth--;
                        if (depth === 0) {
                            result += this._evalToken(token);
                            break;
                        }
                    }
                    token += c;
                }
            }
        }
        return result;
    }

    private _evalTokenMod(token: string, mod: string = 'raw', value: any, properties: object = {}) {
        if (mod === null) {
            if (value instanceof Date) {
                mod = "date(\"yyyy-MM-dd'T'HH:mm:ss.SSS'Z'\", true)";
            } else {
                mod = 'raw';
            }
        }
        const rexArguments: RegExp = /^;*([a-z-][.a-z0-9-]*)(?:\(\s*([^),]*(,[^),]*)*)\s*\))?/;
        let matcher: RegExpExecArray = null;
        let appendMatcher: RegExpExecArray = null;
        if (!rexArguments.test(mod)) {
            if (value instanceof Date) {
                mod = 'date("' + mod + '")';
            }
        }
        while ((matcher = rexArguments.exec(mod)) !== null && matcher.length > 0) {
            mod = matcher.input.substring(matcher[0].length);
            let fName = matcher[1];
            this._argumentTokenizer.reset(matcher[2], properties);
            let fArgs: any[] = this._argumentTokenizer.parse();
            if (fName === 'raw') {
            } else if (fName === 'text') {
                value = String.decodeHTML(String.removeHTML('' + value));
            } else if (fName === 'html') {
                value = String.decodeHTML('' + value);
            } else if (fName === 'suffix') {
                value = Number.getSuffix.apply(Number, [parseFloat(value), ...fArgs]);
            } else if (fName === 'date') {
                if (value instanceof Date) {
                    value = Date.format.apply(Date, [value, ...fArgs]);
                }
            } else if (fName === 'grammar') {
                if (fArgs.length > 1) {
                    if (parseFloat(value) === 1) {
                        value = fArgs[0];
                    } else {
                        value = fArgs[1];
                    }
                }
            } else if (fName === 'percent') {
                if (fArgs.length === 0) {
                    fArgs.push(0);
                }
                if (fArgs.length < 2) {
                    fArgs.unshift(0);
                }
                value = Number.prototype.toFixed.call((parseFloat(value) * 100), parseFloat(fArgs[1]));
                value = ('' + value).replace(new RegExp('\\.?0{0,' + (parseInt(fArgs[1]) - parseInt(fArgs[0])) + '}$'), '') + '%';
            } else if (fName === 'round') {
                value = Number.prototype.toFixed.call((parseFloat(value) * 100), parseFloat(fArgs[0] || 0));
            } else if (fName === 'instead') {
                if (value === null || typeof value === 'undefined') {
                    value = fArgs[0];
                }
            } else if (fName === 'join') {
                if (Array.isArray(value)) {
                    value = Array.prototype.join.apply(value, fArgs);
                }
            } else if (fName === 'default') {
                if (fArgs.length === 0) {
                    fArgs.push('');
                }
                if (value === null || typeof value === 'undefined') {
                    value = fArgs.join('');
                }
            } else if (/^uppper(case)?$/.test(fName)) {
                value = ('' + value).toUpperCase();
            } else if (/^lower(case)?$/.test(fName)) {
                value = ('' + value).toLowerCase();
            } else if ((appendMatcher = /^((?:ap|pre)pend)(-if)?$/.exec(fName)) !== null && appendMatcher.length > 0) {
                if ((value === null || typeof value === 'undefined' || value === '') && appendMatcher.length > 2 && appendMatcher[2] === '-if') {
                    continue;
                }
                if (appendMatcher[1] === 'append') {
                    value = ('' + value) + fArgs.join('');
                } else if (appendMatcher[1] === 'prepend') {
                    value = fArgs.join('') + ('' + value);
                }
            }
        }
        if (value === null) {
            value = '';
        }
        return value;
    }

    private _evalToken(token: string) {
        let tokenParts: string[] = token.split('#', 2);
        let tokenValue = null;
        let tokenMod: string = null;
        let tokenName: string = tokenParts[0];
        if (tokenParts.length > 1) {
            tokenMod = tokenParts[1];
        }
        let propertyScope: any = this._properties;
        let tokenPath: string[] = tokenName.split('.');
        for (let pathIndex = 0; pathIndex < tokenPath.length; pathIndex++) {
            let scopeName: string = tokenPath[pathIndex];
            try {
                if (scopeName in propertyScope) {
                    propertyScope = propertyScope[scopeName];
                } else {
                    tokenValue = null;
                    break;
                }
            } catch (ex) {
                console.debug(ex);
                tokenValue = null;
                break;
            }
            if (pathIndex === (tokenPath.length - 1)) {
                if (Object.isPlainObject(propertyScope)) {
                    let defaultProperty: any = null;
                    if (Array.isArray(this._defaultProperties)) {
                        for (let propName of this._defaultProperties) {
                            if ((propName in propertyScope)) {
                                defaultProperty = propName;
                                break;
                            }
                        }
                    }
                    if (defaultProperty !== null) {
                        tokenValue = propertyScope[defaultProperty];
                    } else {
                        tokenValue = null;
                    }
                } else {
                    tokenValue = propertyScope;
                }
            }
        }
        return this._evalTokenMod(tokenName, tokenMod, tokenValue, this._properties);
    }

    private _readNextChar(peek: boolean = false): string {
        if (this._startIndex < this._format.length) {
            var r = this._format.charAt(this._startIndex);
            if (peek !== true) {
                this._startIndex++;
            }
            return r;
        }
        return null;
    }
}

export const escapeAsAttributeValue = function(value: string): string {
    return replaceUsingMap(value, /("+|\s+)/g, {
        '"': '&quot;',
        '': ''
    });
};

export function addMediaQueryListener(mediaQuery: (string | MediaQueryList), handler: Function): MediaQueryList {
    let mediaQueryList: MediaQueryList = null;
    if ((typeof mediaQuery === 'string') || mediaQuery instanceof String) {
        mediaQuery = mediaQuery.trim();
        mediaQueryList = window.matchMedia(mediaQuery);
    } else if (mediaQuery instanceof MediaQueryList) {
        mediaQueryList = mediaQuery;
    }

    if ((typeof mediaQueryList !== 'undefined') && mediaQueryList !== null) {
        let methodList = [{
            name: 'addListener',
            arguments: [handler]
        }, {
            name: 'addEventListener',
            arguments: ['change', handler]
        }];
        for (let method of methodList) {
            const methodName: string = method.name;
            if ((methodName in mediaQueryList)) {
                (<Function>mediaQueryList[methodName]).apply(mediaQueryList, method.arguments);
                break;
            }
        }
    }

    return mediaQueryList;
}

export function escapeAsNodeText(value: string): string {
    return replaceUsingMap(value, /([<>])/g, {
        '<': '&lt;',
        '>': '&gt;'
    });
}

export function scrubClassNameForAttributeValue(value: string): string {
    return replaceUsingMap(value, /("+|\s+)/g, {
        '"': '',
        '': ''
    });
}

function replaceUsingMap(value: string, pattern: RegExp, map: {[key: string]: string}): string {
    const defaultMapping: string = (('' in map) ? map[''] : null);
    value = value.replace(pattern, (match, groups) => {
        let replacement: string = '';
        if (match !==  null) {
            const m: string = (match.length > 0 ? match.charAt(0) : '');
            if ((match in map)) {
                replacement = map[match];
            } else if ((m in map)) {
                replacement = map[m];
            } else if (defaultMapping !== null) {
                replacement =  defaultMapping;
            }
        }
        return replacement;
    });
    return value;
}

const calendar_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const calendar_month_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const calendar_day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const calendar_day_names_compact = ['S', 'M', 'T', 'W', 'R', 'F', 'S'];
const PATTERN_ISO8601 = /((\d{4})-(\d{1,2})-(\d{1,2}))T((\d{1,2}):(\d{1,2}):((\d{1,2})(\.(\d+))?))Z?/;
const PATTERN_DATETIME = /^(0*(\d{4})-0*(\d{1,2})(?:-0*(\d{1,2}))?|(0*(\d{4})-0*(\d{1,2})-0*(\d{1,2}))[T ](0*(\d{1,2}):0*(\d{1,2})(?::(0*(\d{1,2})(\.0*(\d+))?))?)Z?)$/;

Object.isPlainObject = function (obj: any): boolean {
    if (obj !== null && typeof obj === 'object') {
        if (typeof Object.getPrototypeOf === 'function') {
            let objPrototype = Object.getPrototypeOf(obj);
            return (objPrototype === null || objPrototype === Object.prototype);
        }
        return (Object.prototype.toString.call(obj) === '[object Object]');
    }
    return false;
};
Date.from = function(text: string): Date {
    let m = PATTERN_DATETIME.exec(text);
    if (m !== null && m.length > 0) {
        let year, month, day, hour, minute, second, millisecond;
        if (typeof m[2] !== 'undefined') {
            // if date but no time
            if (m[2].length > 0) {
                year = parseInt(m[2]);
            }
            if (typeof m[3] !== 'undefined' && m[3].length > 0) {
                month = parseInt(m[3]) - 1;
            } else {
                month = 0;
            }
            if (typeof m[4] !== 'undefined' && m[4].length > 0) {
                day = parseInt(m[4]);
            } else {
                day = 1;
            }
            hour = minute = second = millisecond = 0;
        } else {
            // if date and time
            year = parseInt(m[6]);
            month = parseInt(m[7]) - 1;
            day = parseInt(m[8]);
            hour = parseInt(m[10]);
            minute = parseInt(m[11]);
            if (typeof m[13] !== 'undefined') {
                second = parseInt(m[13]);
            } else {
                second = 0;
            }
            if (typeof m[15] !== 'undefined') {
                millisecond = parseInt(m[15]);
            } else {
                millisecond = 0;
            }
        }
        return new Date(year, month, day, hour, minute, second, millisecond);
    }
    return null;
};
String.isDateISO8601 = function(value: string): boolean {
    return PATTERN_ISO8601.test(value);
};
String.formatISO8601Date = function(value: string): string {
    if (String.isDateISO8601(value)) {
        return value.replace(PATTERN_ISO8601, '$3/$4/$2 $6:$7:$9');
    }
    return value;
};
String.dateFromISO8601 = function(value: string): Date {
    return new Date(String.formatISO8601Date(value));
};
String.decodeHTML = function(html: string): string {
    return html
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, '\'')
    .replace(/&quot;/g, '"');
};
String.removeHTML = function(html: string): string {
    let inQuote = false;
    let inTag = false;
    let ch;
    let text = '';
    for (var i = 0; i < html.length; i++) {
        ch = html.charAt(i);
        if (inTag && ch === '"' && html.substring(i - 1, i) !== '\\') {
            inQuote = !inQuote;
            continue;
        } else if (!inQuote && ch === '<') {
            inTag = true;
            continue;
        } else if (!inQuote && ch === '>') {
            inTag = false;
            continue;
        }
        if (inTag) {
            continue;
        }
        text += ch;
    }
    return text.replace(/(\s)+/g, '$1');
};
String.format = function(context: string, properties: object = {}, defaultProperties: string | string[] = []): string {
    const stringFormatter: StringFormatter = new StringFormatter(context, properties, defaultProperties);
    return stringFormatter.format();
};
Number.getSuffix = function(value: number, includeNumber: boolean = false): string {
    let suffix: string = '';
    const sNum: string = ('' + value);
    const lastDigit: number = parseInt(sNum.substring(sNum.length - 1));
    while (true) {
        const di: number = sNum.indexOf('.');
        if (di >= 0) {
            const columnValuesRight: string[] = [
                'Tenth',
                'Hundredth',
                'Thousandth',
                'Ten-thousandth',
                'Hundred-thousandth',
                'Millionth',
                'Ten-millionth',
                'Hundred-millionth',
                'Billionth',
                'Ten-billionth',
                'Hundred-billionth',
                'Trillionth',
                'Ten-trillionth',
                'Hundred-trillionth',
                'Quadrillionth',
                'Ten-quadrillionth',
                'Hundred-quadrillionth',
                'Quintillionth',
                'Ten-Quintillionth',
                'Hundred-quintillionth',
                'Sextillionth',
                'Ten-sextillionth',
                'Hundred-sextillionth',
                'Septillionth',
                'Ten-septillionth',
                'Hundred-septillionth',
                'Octillionth',
                'Ten-octillionth',
                'Hundred-octillionth',
                'Nonillionth'
            ];
            const columnPos: number = (sNum.length - 1) - di - 1;
            if (columnPos >= 0 && columnPos < columnValuesRight.length) {
                if (includeNumber) {
                    suffix += ' ';
                }
                suffix += columnValuesRight[columnPos].toLowerCase();
                const rightQuantity: number = parseInt(sNum.substring(di + 1));
                if (rightQuantity > 1) {
                    suffix += 's';
                }
            }
            break;
        }
        const lastTwoDigits: number = (sNum.length > 1 ? parseInt(sNum.substring(sNum.length - 2)) : lastDigit);
        if (lastTwoDigits > 10 && lastTwoDigits < 20) {
            suffix = 'th';
        } else if (lastDigit === 1) {
            suffix = 'st';
        } else if (lastDigit === 2) {
            suffix = 'nd';
        } else if (lastDigit === 3) {
            suffix = 'rd';
        } else {
            suffix = 'th';
        }
        break;
    }
    return ((includeNumber ? sNum : '') + suffix);
};
Date.prototype.relativeToNow = function(): string {
    let dSelf: Date = this;
    let date: Date = new Date();

    let r: string = '';
    let sTime: number = parseInt(('' + (dSelf.getTime() / 1000)));
    let dTime: number = parseInt(('' + (date.getTime() / 1000)));
    let td: number = (sTime - dTime);
    let as: number = Math.abs(td);
    let am: number = parseInt(('' + (as / 60)));
    let ah: number = parseInt(('' + (as / 60 / 60)));
    let ad: number = parseInt(('' + (as / 60 / 60 / 24)));
    let aM: number = parseInt(('' + (as / 60 / 60 / 24 / 30)));
    let ay: number = parseInt(('' + (as / 60 / 60 / 24 / 365)));

    if (ay > 0) {
        r = ay + ' year' + (ay === 1 ? '' : 's');
    } else if (aM > 0) {
        r = aM + ' month' + (aM === 1 ? '' : 's');
    } else if (ad > 0) {
        if (ad === 1) {
            return (td < 0 ? 'yesterday' : 'tomorrow');
        }
        r = ad + ' day' + (ad === 1 ? '' : 's');
    } else if (ah > 0) {
        r = ah + ' hour' + (ah === 1 ? '' : 's');
    } else if (am > 0) {
        r = am + ' minute' + (am === 1 ? '' : 's');
    } else if (as > 0) {
        r = as + ' second' + (as === 1 ? '' : 's');
    } else {
        r = 'just now';
    }
    if (as > 0) {
        r += (td < 0 ? ' ago' : ' from now');
    }
    return r;
};
Date.format = function(date: Date, format: string, useUTC: boolean = false): string {
    const utcWedge: string = (useUTC === true ? 'UTC' : '');
    const y: number = date['get' + utcWedge + 'FullYear']();
    const M: number = (date['get' + utcWedge + 'Month']() + 1);
    const d: number = date['get' + utcWedge + 'Date']();
    const diw: number = (date['get' + utcWedge + 'Day']() + 1);
    const H: number = date['get' + utcWedge + 'Hours']();
    const h: number = (H > 12 ? (H - 12) : (H === 0 ? 12 : H));
    const m: number = date['get' + utcWedge + 'Minutes']();
    const s: number = date['get' + utcWedge + 'Seconds']();
    const S: number = date['get' + utcWedge + 'Milliseconds']();
    const ampm: string = (H >= 12 ? 'PM' : 'AM');
    let out: string;
    if (typeof format !== 'string' || ('' + format).length === 0) {
        format = 'M/d/yyyy h:mm:ss aa';
    }
    let PATTERN_ALL_SYMBOLS: RegExp = /('[^']*'|'[^']*$|(y|M|d|F|E|a|H|k|K|h|m|s|S)+(\{[^}]*\})?)/gm;
    let regexReplace: (substring: string, ...args: any[]) => string = (match: string, ...args: any[]) => {
        const lastChar: string = match.substring(match.length - 1);
        const mm: string = match.substring(0, 1);
        const mods: string[] = [];
        if (match.length >= 3 && lastChar === '}') {
            let modStart: number = match.lastIndexOf('{');
            if (modStart > 0) {
                for (let mod of match.substring(modStart + 1, match.length - 1).split(/[,|;]+/)) {
                    mods.push(mod);
                }
                match = match.substring(0, modStart);
            }
        }
        let rv: string = '';
        if (mm === '\'') {
            if (lastChar === '\'') {
                if (match.length > 1) {
                    if (match.length === 2) {
                        rv = '\'';
                    } else {
                        rv = match.substring(1, match.length - 1);
                    }
                } else {
                    rv = '\'';
                }
            } else {
                rv = match.substring(1);
            }
        } else if (mm === 'y') {
            const sy: string = ('' + y);
            rv = String.padLeft(sy.substring(Math.max(0, sy.length - match.length)), match.length, '0');
        } else if (mm === 'M') {
            if (match.length >= 4) {
                rv = calendar_month_names[M - 1];
            } else if (match.length >= 3) {
                rv = calendar_month_names[M - 1].substring(0, 3);
            } else {
                rv = String.padLeft(M, match.length, '0');
            }
        } else if (mm === 'd') {
            rv = String.padLeft(d, match.length, '0');
        } else if (mm === 'F') {
            rv = String.padLeft(diw, match.length, '0');
        } else if (mm === 'E') {
            if (match.length >= 4) {
                rv = calendar_day_names[diw - 1];
            } else if (match.length >= 2) {
                rv = calendar_day_names[diw - 1].substring(0, match.length);
            } else {
                rv = calendar_day_names_compact[diw - 1];
            }
        } else if (mm === 'a') {
            rv = ampm.substring(0, Math.min(match.length, 2));
        } else if (mm === 'H') {
            rv = String.padLeft(H, match.length, '0');
        } else if (mm === 'k') {
            rv = String.padLeft((H + 1), match.length, '0');
        } else if (mm === 'K') {
            rv = String.padLeft((h - 1), match.length, '0');
        } else if (mm === 'h') {
            rv = String.padLeft(h, match.length, '0');
        } else if (mm === 'm') {
            rv = String.padLeft(m, match.length, '0');
        } else if (mm === 's') {
            rv = String.padLeft(s, match.length, '0');
        } else if (mm === 'S') {
            rv = String.padLeft(S, match.length, '0');
        } else {
            rv = match;
        }
        const num: number = parseInt(rv);
        const isNum: boolean = !isNaN(num);
        for (let mod of mods) {
            if (/^(st|nd|rd|th)$/i.test(mod) && isNum) {
                rv += Number.getSuffix(num);
            } else if (/^upper(case)?$/i.test(mod) && !isNum) {
                rv = rv.toUpperCase();
            } else if (/^lower(case)?$/i.test(mod) && !isNum) {
                rv = rv.toLowerCase();
            }
        }
        return rv;
    };
    out = ('' + format).replace(PATTERN_ALL_SYMBOLS, regexReplace);
    return out;
};
Date.isLeapYear = function(year: number): boolean {
    return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0);
};
Date.prototype.isLeapYear = function(): boolean {
    return Date.isLeapYear(this.getFullYear());
};
Date.prototype.getPreviousMonth = function(): Date {
    var mi = this.getMonth();
    var yo = 0;
    if (mi === 0) {
        mi = 11;
        yo = -1;
    } else {
        mi--;
    }
    return new Date(this.getFullYear() + yo, mi, 1);
};
Date.prototype.getNextMonth = function(): Date {
    var mi = this.getMonth();
    var yo = 0;
    if (mi === 11) {
        mi = 0;
        yo = 1;
    } else {
        mi++;
    }
    return new Date(this.getFullYear() + yo, mi, 1);
};
Date.getCompactDayName = function(day: number): string {
    return (calendar_day_names_compact[day]);
};
Date.getDayName = function(day: number): string {
    return (calendar_day_names[day]);
};
Date.prototype.getCompactDayName = function(): string {
    return Date.getCompactDayName(this.getDay());
};
Date.prototype.getDayName = function(): string {
    return Date.getDayName(this.getDay());
};
Date.prototype.getMonthStartingDay = function(): number {
    var date = new Date(this.getFullYear(), this.getMonth(), 1);
    return date.getDay();
};
Date.getMonthName = function(month: number): string {
    return (calendar_month_names[month]);
};
Date.prototype.getMonthName = function(): string {
    return Date.getMonthName(this.getMonth());
};
Date.prototype.getMonthLength = function(): number {
    var mi = this.getMonth();
    var c = (calendar_days_in_month[mi]);
    if (mi === 1) { // February only!
        if (this.isLeapYear()) {
            c = 29;
        }
    }
    return c;
};
Date.prototype.getMonthRowCount = function(): number {
    var mLength = this.getMonthLength();
    var dOffset = this.getMonthStartingDay();
    return Math.ceil(((mLength + dOffset) / 7));
};
String.padLeft = function(text, size, c) {
    text = ('' + text);
    if (text.length >= size) {
        return text;
    }
    c = c.substring(0, 1);
    var p = '';
    for (var i = text.length; i < size; i++) {
        p += c;
    }
    return (p + text);
};
String.padRight = function(text, size, c) {
    text = ('' + text);
    if (text.length >= size) {
        return text;
    }
    c = c.substring(0, 1);
    var p = '';
    for (var i = text.length; i < size; i++) {
        p += c;
    }
    return (text + p);
};
$.fn.templateProperties = function(): object {
    const r: object = {};
    this.parents('[data-template-properties]').addBack('[data-template-properties]').each(function() {
        let $this: JQuery = $(this);
        let props: string = $.trim($this.attr('data-template-properties'));
        if (props.length === 0) {
            props = '{}';
        }
        try {
            $.extend(true, r, JSON.parse(props));
        } catch (ex) {
        }
    });
    return r;
};
