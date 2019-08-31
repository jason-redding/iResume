import * as $ from 'jquery';

export default class GA {
    private static readonly TRACKING_ID: string = 'UA-106877989-1';

    static fireEvent(category: string, action: string, label?: string, value?: number): void {
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
            hitType: 'event',
            eventCategory: category,
            eventAction: action
        };
        if (typeof label !== 'undefined' && label.length > 0) {
            $.extend(true, parameters, {
                eventLabel: label
            });
        }
        if (typeof value === 'number' && value >= 0) {
            $.extend(true, parameters, {
                eventValue: value
            });
        }
        // return $.ajax({
        //     method: 'POST',
        //     data: $.param(parameters).replace(/\+/g, '%20'),
        //     url: 'https://www.google-analytics.com/collect'
        // });
        (<any>window).ga('send', parameters);
    }
}