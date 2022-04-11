(function($){
	function initialize_field( $el ) {
		$(':text:visible',$el).autocomplete({
			source: function( request, response  ){
				let term = request.term.trim();

				if(!term.length)
					response( [] );
				
				$.post( '/wp-json/wp-irbis/v1/execute_query', { 
					type : '@!!kk1boK_H',
					db: 'OKIO',
					'query': 'I=' + term + '$' + ' + B=' + term + '$' + ' + T=' + term + '$'
				})
				.done(function( data ) {
					let t = data.results.map(e=>{
						return {
							value: $(e.description).text(),
							markdown: e.description.replace('<dd>', '').replace('</dd>', ''),
							cipher: e.cipher
						}
					})
					response(t)
				});
			},
			select: function( event, ui ) {
				$(this).val(ui.item.cipher)
				if( !$(this).next().hasClass('biblio') ){
					$(this).after( "<p class='biblio'>" + ui.item.markdown + "</p>" );
					$('.biblio').css({
						fontSize: '1.2em',
						fontWeight: 400,
						background: '#faebd7',
						padding: '20px 50px'
					});
				}else{
					$(this).next().html( ui.item.markdown )
				}
				return false;
			}
		});
	}
	
	if( typeof acf.add_action !== 'undefined' ) {
		acf.add_action('ready append', function( $el ){
			acf.get_fields({ type : 'autocomplete'}, $el).each(function(){		
				initialize_field( $(this) );
			});
		});
	}
})(jQuery);