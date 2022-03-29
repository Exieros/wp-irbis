<?php

require_once 'irbis_query_exec.php';

add_action( 'rest_api_init', function () {
    register_rest_route( 'wp-irbis/v1', '/execute_query', [
        'methods' => 'POST',
        'callback' => 'execute_query',
        'permission_callback' => '__return_true',
        'args'     => [
            'query' => [ 'required'=> true ],
            'db' => [ 'required'=> false ],
            'type' => [ 'required'=> false ],
        ]
    ]);

    register_rest_route( 'wp-irbis/v1', '/getRenderedBookDescription', [
        'methods' => 'POST',
        'callback' => 'getRenderedBookDescription',
        'permission_callback' => '__return_true',
        'args'     => [
            'query' => [ 'required'=> true ]
        ]
    ]);

    register_rest_route( 'wp-irbis/v1', '/getkeys', [
        'methods' => 'POST',
        'callback' => 'getkeys',
        'permission_callback' => '__return_true',
        'args'     => [
            'last_word' => [ 'required'=> true ],
            'db' => [ 'required'=> false ],
        ]
    ]);

    register_rest_route( 'wp-irbis/v1', '/check_connection', array(
        'methods' => 'GET',
        'callback' => 'check_connection',
        'permission_callback' => '__return_true',
    ) );
} );

function get_irbis_options(){
    $addr = get_option('wp_irbis_address_port');

    return [
        'address' => explode(':', $addr)[0],
        'port' => explode(':', $addr)[1],
        'login' => get_option('wp_irbis_login'),
        'pass' => get_option('wp_irbis_password'),
        'db' => get_option('wp_irbis_database'),
        'max_search_results_count' => get_option('wp_irbis_max_search_results_count')
    ];
}

function check_keys($object, $list_of_keys){
    foreach ($list_of_keys as $key){
        if( !array_key_exists( $key, $object ) ){
            return false;
        }
    }
    return true;
}

function create_instance($opts){
    return new Irbis_Web(
        $opts['address'],
        $opts['port'],
        $opts['login'],
        $opts['pass'],
        $opts['db'],
        $opts['max_search_results_count']
    );
}

function execute_query($data){
    $opts = get_irbis_options();
    if ( !check_keys( $opts, ['address', 'port', 'login', 'pass', 'db']) ) {
        return [
            'success' => false,
            'error' => 'Не произведена настройка плагина'
        ];
    }
    $irbis_web = create_instance($opts);
    return $irbis_web->searchQueryToIrbis($data['query'], $data['db'], $data['type']);
}

function getRenderedBookDescription($data){
    $opts = get_irbis_options();
    if ( !check_keys( $opts, ['address', 'port', 'login', 'pass', 'db']) ) {
        return [
            'success' => false,
            'error' => 'Не произведена настройка плагина'
        ];
    }
    $irbis_web = create_instance($opts);
    return $irbis_web->exec_query($data['query'], $data['db']);
}

function getkeys($data){
    $opts = get_irbis_options();
    if ( !check_keys( $opts, ['address', 'port', 'login', 'pass']) ) {
        return [
            'success' => false,
            'error' => 'Не произведена настройка плагина'
        ];
    }
    $irbis_web = create_instance($opts);
    return $irbis_web->getkeys($data['last_word'], $data['db']);
}

function check_connection($data){
    $opts = get_irbis_options();
    if ( !check_keys( $opts, ['address', 'port', 'login', 'pass']) ) {
        return [
            'success' => false,
            'error' => 'Не произведена настройка плагина'
        ];
    }
    $irbis_web = create_instance($opts);
    return $irbis_web->check_connection();
}

?>