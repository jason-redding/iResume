export type XPathResultValue<T> =
    T extends 'string' ? string :
    T extends 'number' ? number :
    T extends 'boolean' ? boolean :
    T extends 'node' ? JQuery<Node> :
    T extends 'nodeset' ? JQuery<Node> :
    T extends 'nodes' ? JQuery<Node> :
    T extends 'any' ? string | number | boolean | JQuery<Node> :
    any;

export default class XPath {
    private _namespace: Namespace;
    private _lastContext: Node;

    constructor(namespaceOrDocument?: Namespace | XMLDocument) {
        if (namespaceOrDocument instanceof Namespace) {
            this._namespace = namespaceOrDocument;
        } else {
            this._namespace = new Namespace();
            if (namespaceOrDocument instanceof XMLDocument) {
                this._lastContext = namespaceOrDocument;
                this._namespace.reset(namespaceOrDocument);
            }
        }
    }

    get namespace(): Namespace {
        if (!(this._namespace instanceof Namespace)) {
            this._namespace = new Namespace();
        }
        return this._namespace;
    }

    initNamespaceFrom(document: XMLDocument): XPath {
        this._lastContext = document;
        this.namespace.reset(document);
        return this;
    }

    evaluate
    <T extends 'string' | 'number' | 'boolean' | 'node' | 'nodeset' | 'nodes' | 'any'>
    (expression: string, type: T): XPathResultValue<T>;
    evaluate
    <T extends 'string' | 'number' | 'boolean' | 'node' | 'nodeset' | 'nodes' | 'any'>
    (context: Node | Node[] | JQuery<Node>, expression: string, type: T): XPathResultValue<T>;
    evaluate
    <T extends 'string' | 'number' | 'boolean' | 'node' | 'nodeset' | 'nodes' | 'any'>
    (context: Node | Node[] | JQuery<Node> | string, expression: string | T, type?: T): XPathResultValue<T>
    {
        if (typeof context === 'string' || (context instanceof String)) {
            type = arguments[1];
            expression = arguments[0];
            context = this._lastContext;
        }

        let rv: XPathResultValue<T> = null;
        let cv: Set<Node> = new Set();
        let resultType: number = XPathResult.ANY_TYPE;
        if (typeof type === 'string') {
            if (type === 'any') {
                resultType = XPathResult.ANY_TYPE;
            } else if (type === 'string') {
                resultType = XPathResult.STRING_TYPE;
            } else if (type === 'number') {
                resultType = XPathResult.NUMBER_TYPE;
            } else if (type === 'boolean') {
                resultType = XPathResult.BOOLEAN_TYPE;
            } else if (type === 'node') {
                resultType = XPathResult.FIRST_ORDERED_NODE_TYPE;
            } else if (type === 'nodeset' || type === 'nodes') {
                resultType = XPathResult.ORDERED_NODE_ITERATOR_TYPE;
            }
        }
        let $context: JQuery<Node>;
        if (context instanceof Node || Array.isArray(context)) {
            $context = $(<Node>context);
        } else {
            $context = context;
        }
        $context.each((index, contextNode) => {
            this._lastContext = contextNode;
            let ownerDoc: Document | Node = contextNode.ownerDocument;
            if (ownerDoc === null || typeof ownerDoc === 'undefined') {
                ownerDoc = contextNode;
            }
            let r: XPathResult = null;
            try {
                r = (<Document>ownerDoc).evaluate(expression, contextNode, this._namespace.nsResolver, resultType, null);
            } catch (ex) {
                console.groupCollapsed('document.evaluate() exception!');
                console.error(ex);
                console.groupEnd();
            }
            if (!!!r) {
                return;
            }
            let t: number = r.resultType;
            if (t === XPathResult.BOOLEAN_TYPE) {
                rv = <XPathResultValue<T>>r.booleanValue;
                return false;
            } else if (t === XPathResult.NUMBER_TYPE) {
                rv = <XPathResultValue<T>>r.numberValue;
                return false;
            } else if (t === XPathResult.STRING_TYPE) {
                rv = <XPathResultValue<T>>r.stringValue;
                return false;
            } else if (t === XPathResult.ORDERED_NODE_ITERATOR_TYPE || t === XPathResult.UNORDERED_NODE_ITERATOR_TYPE) {
                try {
                    let node: Node;
                    while ((node = r.iterateNext()) !== null) {
                        if (!cv.has(node)) {
                            cv.add(node);
                        }
                    }
                } catch (ex) {
                    console.groupCollapsed('Exception while iterating over result nodes!');
                    console.error(ex);
                    console.groupEnd();
                }
            } else if (t === XPathResult.ORDERED_NODE_SNAPSHOT_TYPE || t === XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE) {
                for (let snapShotIndex = 0; snapShotIndex < r.snapshotLength; snapShotIndex++) {
                    let snapshot: Node = r.snapshotItem(snapShotIndex);
                    if (!cv.has(snapshot)) {
                        cv.add(snapshot);
                    }
                }
            } else if (t === XPathResult.ANY_UNORDERED_NODE_TYPE || t === XPathResult.FIRST_ORDERED_NODE_TYPE) {
                if (r.singleNodeValue !== null) {
                    cv.clear();
                    cv.add(r.singleNodeValue);
                    return false;
                }
            }
        });

        if (($context.length === 0) || (rv === null && cv.size === 0)) {
            if (resultType === XPathResult.STRING_TYPE || resultType === XPathResult.NUMBER_TYPE || resultType === XPathResult.BOOLEAN_TYPE) {
                return null;
            }
        }

        if (rv === null) {
            rv = <XPathResultValue<T>>$([...cv]);
        }
        return rv;
    }
}

export class Namespace {
    private _uriMap: object;
    private _prefixMap: object;
    private _nsResolver: XPathNSResolver;

    constructor(document?: XMLDocument) {
        const self = this;
        this._uriMap = {};
        this._prefixMap = {};
        if (document instanceof XMLDocument) {
            this.reset(document);
        }
    }

    lookupNamespace(prefix: string): string {
        if (prefix in this._prefixMap) {
            return this._prefixMap[prefix];
        }
        return null;
    }

    get nsResolver(): XPathNSResolver {
        const self = this;
        if (!(this._nsResolver)) {
            this._nsResolver = (prefix: string) => {
                return self.lookupNamespace(prefix);
            };
        }
        return this._nsResolver;
    }

    reset(document?: XMLDocument): Namespace {
        this._uriMap = {};
        this._prefixMap = {};
        if (document instanceof XMLDocument) {
            let allElements: HTMLCollectionOf<Element> = document.getElementsByTagName('*');
            for (let elementIndex = 0; elementIndex < allElements.length; elementIndex++) {
                let element: Element = allElements.item(elementIndex);
                if (element.attributes.length > 0) {
                    for (let attrIndex = 0; attrIndex < element.attributes.length; attrIndex++) {
                        let attr: Attr = element.attributes.item(attrIndex);
                        if (attr.namespaceURI === 'http://www.w3.org/2000/xmlns/') {
                            if (attr.nodeName === attr.localName) {
                                this.addNamespace('', attr.nodeValue);
                            } else {
                                this.addNamespace(attr.localName, attr.nodeValue);
                            }
                        }
                    }
                }
            }
        }
        return this;
    }

    prefixes(): object {
        return Object.assign({}, this._prefixMap);
    }

    namespaces(): object {
        return Object.assign({}, this._uriMap);
    }

    addNamespace(prefix: string, uri: string): Namespace {
        let prefixList: string[];
        if (uri in this._uriMap) {
            prefixList = this._uriMap[uri];
        } else {
            this._uriMap[uri] = (prefixList = []);
        }
        if (prefixList.indexOf(prefix) < 0) {
            prefixList.push(prefix);
        }
        if (!(prefix in this._prefixMap)) {
            this._prefixMap[prefix] = uri;
        }
        return this;
    }

    removePrefix(prefix: string): Namespace {
        let uri: string = this._prefixMap[prefix];
        let prefixList: string[] = this._uriMap[uri];
        delete this._prefixMap[prefix];
        let prefixIndex = prefixList.indexOf(prefix);
        if (prefixIndex >= 0) {
            delete prefixList[prefixIndex];
        }
        return this;
    }

    removeURI(uri: string): Namespace {
        let prefixList: string[] = this._uriMap[uri];
        for (let prefix of prefixList) {
            delete this._prefixMap[prefix];
        }
        delete this._uriMap[uri];
        return this;
    }
}