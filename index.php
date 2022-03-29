<?php
/**
 * Plugin Name:       WP Irbis
 * Version:           1.0.0
 * Author:            Exieros
 * Description:       Плагин для поиска по библиотечным каталогам Irbis64
 * Text Domain:       wp_irbis
 */

require_once __DIR__ . '/includes/api.php';
define( 'WP_IRBIS_VERSION', '1.0.1' );

function wp_irbis_admin_page_assets() {
	wp_register_script('axios', plugins_url( 'axios.min.js', __FILE__ ));
	wp_enqueue_script( 'wp_irbis__settings_page__script', plugins_url( '/', __FILE__ ) . 'settings/index.js', array( 'wp-api', 'wp-i18n', 'wp-components', 'wp-element', 'axios' ), WP_IRBIS_VERSION, true );
	wp_enqueue_style( 'wp_irbis__settings_page__style', plugins_url( '/', __FILE__ ) . 'settings/index.css', array( 'wp-components' ), WP_IRBIS_VERSION );
}

function wp_irbis_menu_callback() {
	echo '<div id="wp_irbis__settings__layout"></div>';
}

/*
	Добавление страницы настроек в админку
*/
function wp_irbis_add_option_menu() {
	$page_hook_suffix = add_options_page(
		__( 'WP Irbis', 'wp_irbis' ),
		__( 'WP Irbis', 'wp_irbis' ),
		'manage_options',
		'awesome',
		'wp_irbis_menu_callback'
	);
	add_action( "admin_print_scripts-{$page_hook_suffix}", 'wp_irbis_admin_page_assets' );
}
add_action( 'admin_menu', 'wp_irbis_add_option_menu' );

/*
	Регистрация необходимых настроек
*/
function wp_irbis_register_settings() {
	register_setting(
		'codeinwp_settings',
		'wp_irbis_max_display_keywords_count',
		array(
			'type'         => 'integer',
			'show_in_rest' => true,
			'default'      => 15,
		)
	);
	register_setting(
		'codeinwp_settings',
		'wp_irbis_max_search_results_count',
		array(
			'type'         => 'integer',
			'show_in_rest' => true,
			'default'      => 50,
		)
	);
	register_setting(
		'codeinwp_settings',
		'wp_irbis_address_port',
		array(
			'type'         => 'string',
			'show_in_rest' => true,
		)
	);
	register_setting(
		'codeinwp_settings',
		'wp_irbis_login',
		array(
			'type'         => 'string',
			'show_in_rest' => true,
		)
	);
	register_setting(
		'codeinwp_settings',
		'wp_irbis_password',
		array(
			'type'         => 'string',
			'show_in_rest' => true,
		)
	);
	register_setting(
		'codeinwp_settings',
		'wp_irbis_database',
		array(
			'type'         => 'string',
			'show_in_rest' => true,
		)
	);
	register_setting(
		'codeinwp_settings',
		'wp_irbis_output_template',
		array(
			'type'         => 'string',
			'show_in_rest' => true,
		)
	);
}
add_action( 'init', 'wp_irbis_register_settings' );

/*
    Регистрация необходимых для работы плагина скриптов и стилей
*/
function initWpIrbisEnqueues() {
    wp_register_script('axios', plugins_url( 'axios.min.js', __FILE__ ));
    wp_register_script( 'wp_irbis_js', plugins_url( 'irbis-web-search.js', __FILE__ ), array('jquery', 'axios'), null, true );

	if( file_exists( get_template_directory() . '/public/styles/irbis.css' ) ){
		//Если есть кастомный стиль, то грузим его: {current_template_path}/public/styles/irbis.css
		wp_register_style( 'wp_irbis_css', get_theme_root_uri() . '/' . get_stylesheet() . '/public/styles/irbis.css' );
	}else{
		//Иначе грузим дефолтный
		wp_register_style( 'wp_irbis_css', plugins_url( 'irbis-web-search.css', __FILE__ ) );
	}

	if( file_exists( get_template_directory() . '/public/wp_irbis_output_template.js' ) ){
		//Кастомный шаблона вывода: {current_template_path}/public/wp_irbis_output_template.js
		wp_enqueue_script( 'wp_irbis_output_template', get_theme_root_uri() . '/' . get_stylesheet() . '/public/wp_irbis_output_template.js' );
	}else{
		//Стандартный шаблон вывода: {irbis_plugin_path}/public/wp_irbis_output_template_default.js
		wp_enqueue_script( 'wp_irbis_output_template', plugins_url( 'public/wp_irbis_output_template_default.js', __FILE__ ) );
	}
}
add_action( 'wp_enqueue_scripts', 'initWpIrbisEnqueues' );


/*
    Добавление шорткода для отображение поисковой строки с автодополнением
*/
function wpIrbisFulltextSearchShortcode( $atts ){
	wp_enqueue_style('wp_irbis_css');
    wp_enqueue_script('axios');
    wp_enqueue_script('wp_irbis_js');
    wp_localize_script(
		'wp_irbis_js',
		'wp_irbis_settings',
		array(
			'wp_irbis_max_display_keywords_count' => get_option( 'wp_irbis_max_display_keywords_count' )
		)
	);

    ob_start(); 
    ?>
        <div id="wp_irbis">

            <div class="wp_irbis__searchbar">
		        <form  class="searchbar__form">
		        	<a class="searchbar__form__search_button">
		                <svg title="Поиск по сайту" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="10px" height="10px" version="1.1" viewBox="0 0 221 286" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="Слой_x0020_1"><path class="fil1" d="M42 43c14,-14 32,-20 49,-20 18,0 36,6 49,20 14,13 21,31 21,49 0,18 -7,35 -21,49 -13,13 -31,20 -49,20 -17,0 -35,-7 -49,-20 -13,-14 -20,-31 -20,-49 0,-18 7,-36 20,-49zm49 -43c-23,0 -46,9 -64,27 -18,18 -27,42 -27,65 0,23 9,47 27,65 18,17 41,26 64,26 20,0 40,-6 57,-19l57 58 16 -16 -58 -58c13,-16 20,-36 20,-56 0,-23 -9,-47 -27,-65 -18,-18 -41,-27 -65,-27z"></path></g></svg>
		            </a>
		        	
		            <input id="search_input" placeholder='Введите запрос. Например: "Сказки Пушкина".' autofocus="" autocomplete="off" class="searchbar__form__input">
		            
		            <div class="wp_irbis__searchbar__form__loading"></div>
		        </form>
		    </div>

			<script>
				
			</script>

		    <div class="wp_irbis__message">
		    </div>

            <div class="wp_irbis__results">
            </div>
        </div>
    <?php 

    return ob_get_clean(); 

	
}
add_shortcode( 'IrbisFulltextSearch', 'wpIrbisFulltextSearchShortcode' );


