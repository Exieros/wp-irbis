<?php

class acf_field_autocomplete extends acf_field {
	
	function __construct() {
		
		$this->name = 'autocomplete';
		
		$this->label = __('Autocomplete', 'acf-autocomplete');
		
		$this->category = 'basic';
	
		$this->defaults = array(
			'database'	=> 'OKIO',
		);

		parent::__construct();
	}
	
	function render_field_settings( $field ) {
		acf_render_field_setting( $field, array(
			'label'			=> __('База данных','acf-autocomplete'),
			'instructions'	=> __('Customise the input font size','acf-autocomplete'),
			'type'			=> 'select',
			'name'			=> 'database',
			'choices'		=> ['OKIO' => 'okio(книги)', 'BIBL' => 'bibl(библиографическая)', 'PER' => 'per(периодические издания)'],
		));

	}
	
	function render_field( $field ) {
		?>
		<input type="text" data-db="<?php echo $field['database'] ?>" name="<?php echo esc_attr($field['name']) ?>" value="<?php echo esc_attr($field['value']) ?>" />
		<?php
	}
	
	function input_admin_enqueue_scripts() {
		
		$dir = plugin_dir_url( __FILE__ );
		
		wp_register_script( 'acf-input-autocomplete', "{$dir}input.js", array( "jquery-ui-autocomplete" ) );
		wp_enqueue_script('acf-input-autocomplete');
		
	}
	
}

new acf_field_autocomplete();

?>