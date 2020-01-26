
require.config({
    'baseUrl': '/',
    'paths': {
        // 'docx': 'https://unpkg.com/docx@5.0.2/build/index',
        // 'docx': '/js/docx',
        // 'file-saver': 'https://unpkg.com/file-saver@2.0.2/dist/FileSaver.min',
        'jquery': 'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.min',
        'jqueryui': 'https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min',
        'jquerymobile': 'https://cdnjs.cloudflare.com/ajax/libs/jquery-mobile/1.4.5/jquery.mobile.min'
    }
});

require(['jquery', 'jqueryui'], ($) => {
    // $(document).on('mobileinit', () => {
    //     console.debug('jQueryMobile finished loading!');
    // });
    require(['jquerymobile'], () => {
        require(['app']);
    });
});