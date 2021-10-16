(function ($, document, window) {
    $.fn.exportToWord = function exportToWord() {
        let options;
        if (arguments.length > 0) {
            options = arguments[0];
        }
        if (!$.isPlainObject(options)) {
            options = {};
        }

        let targetExtension = 'docx';
        let rexTargetExtension = new RegExp('\\.' + targetExtension + '$');
        return this.each(function () {
            let $this = $(this);
            let $html = $('html');
            let $title = $html.find('> head > title');
            let $body = $html.children('body');
            let title = $.trim($title.html());
            let charset = 'utf-8';

            if ($this.closest('body').length === 0) {
                $this = $body;
            }

            let preHtml = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">\n<head>\n<meta charset="' + charset + '">\n<title>' + title + '</title>';
            // preHtml += '\n<style>';
            // for (let cssRule of $(document.styleSheets).filter(function () {
            //     return /\/all-stylesheets\.css$/.test(this.href);
            // }).prop('cssRules')) {
            //     if (cssRule.type === 4) {
            //         let foundPrintRule = false;
            //         for (let mediaRule of cssRule.media) {
            //             if (mediaRule === 'print') {
            //                 foundPrintRule = true;
            //                 break;
            //             }
            //         }
            //         if (foundPrintRule) {
            //             for (let rule of cssRule.cssRules) {
            //                 preHtml += '\n' + rule.cssText;
            //             }
            //             continue;
            //         }
            //     }
            //     preHtml += '\n' + cssRule.cssText;
            // }
            // preHtml += '\n</style>';
            preHtml += '\n</head>\n<body>\n';
            let postHtml = '\n</body></html>';
            let docHtml = preHtml + $this.html() + postHtml + '\n';

            // Specify file name
            let filename = ('filename' in options) ? options.filename : 'document';

            if (!rexTargetExtension.test(filename)) {
                filename += '.' + targetExtension;
            }

            if (navigator.msSaveOrOpenBlob) {
                let blob = new Blob(['\ufeff', docHtml], {
                    type: 'application/msword'
                });
                navigator.msSaveOrOpenBlob(blob, filename);
            } else {
                // Specify link url
                let url = 'data:application/vnd.ms-word;';
                // url += 'charset=' + charset + ',' + encodeURIComponent(docHtml);
                url += 'base64,' + window.btoa(encodeURIComponent(docHtml).replace(/%([0-9A-F]{2})/g, function(match, hex) {
                    return String.fromCharCode('0x' + hex);
                }));

                // Create download link element
                let $downloadLink = $('<a/>').attr({
                    download: filename,
                    href: url
                }).appendTo($body);

                $downloadLink[0].click();
                $downloadLink.remove();
            }
        });
    };
})(jQuery, document, window);