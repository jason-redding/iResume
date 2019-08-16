
require.config({
    'baseUrl': '/',
    'paths': {
        'jquery': 'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.min',
        'jqueryui': 'https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min',
        'jquerymobile': 'https://cdnjs.cloudflare.com/ajax/libs/jquery-mobile/1.4.5/jquery.mobile.min'
    }
});

require(['jquery', '../main']);