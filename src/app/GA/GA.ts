import * as $ from "jquery";

export default class GA {
    private static readonly TRACKING_ID: string = 'UA-106877989-1';

    static fireEvent(category: string, action: string, label?: string, value?: number): JQuery.jqXHR | void {
        const gaData: any[][] = (<any>window).dataLayer;
        if (!Array.isArray(gaData)) {
            return;
        }
        if (gaData.length < 2) {
            return;
        }
        if (gaData[1].length < 2) {
            return;
        }
        if (gaData[1][0] !== 'config' || gaData[1][1] !== GA.TRACKING_ID) {
            return;
        }
        if (category.length === 0 || action.length === 0) {
            return;
        }
        const parameters: object = {
            v: 1,
            tid: GA.TRACKING_ID,
            t: 'event',
            ec: category,
            ea: action
        };
        if (typeof label !== 'undefined' && label.length > 0) {
            $.extend(true, parameters, {
                el: label
            });
        }
        if (typeof value === 'number' && value >= 0) {
            $.extend(true, parameters, {
                ev: value
            });
        }
        return $.ajax({
            method: 'POST',
            data: $.param(parameters).replace(/\+/g, '%20'),
            url: 'https://www.google-analytics.com/collect'
        });
    }
}