export default class Namespace {
    private _uriMap: object = {};
    private _prefixMap: object = {};

    constructor() {

    }

    lookupNamespace(prefix: string): string {
        if (prefix in this._prefixMap) {
            return this._prefixMap[prefix];
        }
        return null;
    }

    reset(document: XMLDocument): void {
        this._uriMap = {};
        this._prefixMap = {};
        if (document instanceof XMLDocument) {
            let allElements: HTMLCollectionOf<Element> = document.getElementsByTagName('*');
            for (let node in allElements) {
                console.log(node);
            }
        }
    }

    prefixes(): object {
        return Object.assign({}, this._prefixMap);
    }

    namespaces(): object {
        return Object.assign({}, this._uriMap);
    }

    addNamespace(prefix: string, uri: string): void {
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
    }

    removePrefix(prefix: string): void {
        let uri: string = this._prefixMap[prefix];
        let prefixList: string[] = this._uriMap[uri];
        delete this._prefixMap[prefix];
        let prefixIndex = prefixList.indexOf(prefix);
        if (prefixIndex >= 0) {
            delete prefixList[prefixIndex];
        }
    }

    removeURI(uri: string): void {
        let prefixList: string[] = this._uriMap[uri];
        for (let prefix of prefixList) {
            delete this._prefixMap[prefix];
        }
        delete this._uriMap[uri];
    }
}