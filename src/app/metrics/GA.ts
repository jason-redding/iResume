
declare global {
    interface Window {
        gtag: (command: string, ...parameters: any) => void | any;
    }
}

export default class GA {
    private static readonly TRACKING_ID: string = 'UA-106877989-1';

    static fireEvent(category: string, action: string, label?: string, value?: number): void {
        if (!('gtag' in window)) {
            return;
        }
        if (category.length === 0 || action.length === 0) {
            return;
        }
        const eventProperties: object = {
            'event_category': category
        };
        if ((typeof label !== 'undefined') && label.length > 0) {
            if (!label.startsWith(action + ': ')) {
                label = action + ': ' + label;
            }
            $.extend(true, eventProperties, {
                'event_label': label
            });
        }
        if ((typeof value === 'number') && value >= 0) {
            $.extend(true, eventProperties, {
                'value': value
            });
        }
        window.gtag('event', action, eventProperties);
    }
}