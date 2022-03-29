/* eslint-disable camelcase */
/**
 * WordPress dependencies
 */
import axios from 'axios';

const { __ } = wp.i18n;

//import Editor from 'react-simple-code-editor';
//import { highlight, languages } from 'prismjs/components/prism-core';
//import 'prismjs/components/prism-clike';
//import 'prismjs/components/prism-javascript';
//import "prismjs/themes/prism.css";

const {
	BaseControl,
	Button,
	PanelBody,
	PanelRow,
	Placeholder,
	Spinner,
	TextareaControl,
	Text
} = wp.components;

const addr_port_reg = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+:\d{1,5}$/gm;

const {
	render,
	Component,
	Fragment
} = wp.element;

/**
 * Internal dependencies
 */
import './style.scss';

class App extends Component {
	constructor() {
		super( ...arguments );

		this.changeOptions = this.changeOptions.bind( this );

		this.state = {
			isAPILoaded: false,
			isAPISaving: false,
			wp_irbis_address_port: '',
			wp_irbis_login: '',
			wp_irbis_password: '',
			wp_irbis_database: '',
			wp_irbis_max_display_keywords_count: 15,
			wp_irbis_max_search_results_count: 50,
			isConnectionChecking: false,
			isConnectionCheckedStatus: ''
		};
	}

	checkConnection() {
		this.setState({
			isConnectionChecking: true,
			isConnectionCheckedStatus: ''
		});

		let self = this;
		axios.request({
			url: '/wp-json/wp-irbis/v1/check_connection',
			method: 'GET',
			timeout: 3000
		})
		.then(function (response) {
			console.log(response)
			if( response.data.success === true ){
				self.setState({
					isConnectionChecking: false,
					isConnectionCheckedStatus: 'Успех!'
				});
			}else{
				self.setState({
					isConnectionChecking: false,
					isConnectionCheckedStatus: response.data.error
				});
			}
		})
		.catch(function (error) {
			self.setState({
				isConnectionChecking: false,
				isConnectionCheckedStatus: 'Ошибка подключения!'
			});
		});
	}

	componentDidMount() {
		this.checkConnection();

		wp.api.loadPromise.then( () => {
			this.settings = new wp.api.models.Settings();
		
			if ( false === this.state.isAPILoaded ) {
				this.settings.fetch().then( response => {
					this.setState({
						wp_irbis_address_port: response.wp_irbis_address_port,
						wp_irbis_login: response.wp_irbis_login,
						wp_irbis_password: response.wp_irbis_password,
						wp_irbis_database: response.wp_irbis_database,
						wp_irbis_max_display_keywords_count: response.wp_irbis_max_display_keywords_count,
						wp_irbis_max_search_results_count: response.wp_irbis_max_search_results_count,
						isAPILoaded: true
					});
				});
			}
		});
	}

	changeOptions( option, value ) {
		this.setState({ isAPISaving: true });

		const model = new wp.api.models.Settings({
			// eslint-disable-next-line camelcase
			[option]: value
		});

		model.save().then( response => {
			this.setState({
				[option]: response[option],
				isAPISaving: false
			});
		});
	}

	render() {
		if ( ! this.state.isAPILoaded ) {
			return (
				<Placeholder>
					<Spinner/>
				</Placeholder>
			);
		}

		return (
			<Fragment>
				<div className="codeinwp-header">
					<div className="codeinwp-container">
						<div className="codeinwp-logo">
							<h1>{ __( 'WP Irbis Settings' ) }</h1>
						</div>
					</div>
				</div>

				<div className="codeinwp-main">
					<PanelBody
						title={ __( 'Основные настройки' ) }
						initialOpen={ true }
					>
						<PanelRow>
							<BaseControl
								label={ __( 'Сервер Irbis:' ) }
								help={ this.state.wp_irbis_address_port == '' ? 'Введите адрес сервера irbis в формате address:port' : null}
								id="codeinwp-options-google-analytics-api"
								className="codeinwp-text-field"
							>
								<input
									type="text"
									id="codeinwp-options-google-analytics-api"
									value={ this.state.wp_irbis_address_port }
									placeholder={ __( 'irbis.server.com:6666' ) }
									disabled={ this.state.isAPISaving }
									onChange={ e => this.setState({ wp_irbis_address_port: e.target.value }) }
								/>
								<div>
									<p>Для того чтобы плагин работал как должно, к вашему серверу Irbis64 должны проходить запросы с ip адреса, на котором расположен ваш сайт. Вероятнее всего ваш сервер Irbis стоит за NAT и необходимо будет добавить ip адрес сайта в белые списки.</p>
								</div>
								
							</BaseControl>
							
						</PanelRow>

						<PanelRow>
							<BaseControl
								label={ __( 'Логин:' ) }
								id="wp_irbis_login"
								className="codeinwp-text-field"
							>
								<input
									type="text"
									id="wp_irbis_login"
									value={ this.state.wp_irbis_login }
									placeholder={ __( 'IrbisUser' ) }
									disabled={ this.state.isAPISaving }
									onChange={ e => this.setState({ wp_irbis_login: e.target.value }) }
								/>
							</BaseControl>
							<BaseControl
								label={ __( 'Пароль:' ) }
								id="wp_irbis_password"
								className="codeinwp-text-field"
							>
								<input
									type="text"
									id="wp_irbis_password"
									value={ this.state.wp_irbis_password }
									placeholder={ __( 'Password' ) }
									disabled={ this.state.isAPISaving }
									onChange={ e => this.setState({ wp_irbis_password: e.target.value }) }
								/>
							</BaseControl>
						</PanelRow>

						<PanelRow>
							<Button className="check_connection" variant="tertiary" disabled={this.state.isConnectionChecking} onClick={ e => this.checkConnection() }>
								Проверить подключение
								{
									this.state.isConnectionChecking ?
									<Spinner/> : ''
								}
							</Button>
							{
								this.state.isConnectionCheckedStatus ?
								this.state.isConnectionCheckedStatus : ''
							}
						</PanelRow>

						<PanelRow>
							<BaseControl
								label={ __( 'База данных:' ) }
								id="wp_irbis_database"
								className="codeinwp-text-field"
							>
								<input
									type="text"
									id="wp_irbis_database"
									value={ this.state.wp_irbis_database }
									placeholder={ __( 'DB Name' ) }
									disabled={ this.state.isAPISaving }
									onChange={ e => this.setState({ wp_irbis_database: e.target.value }) }
								/>
							</BaseControl>
						</PanelRow>
					</PanelBody>

					<PanelBody
						title={ __( 'Дополнительные настройки' ) }
						initialOpen={ false }
					>
						<PanelRow>
							<BaseControl
								label={ __( 'Максимальное количество выводимых ключевых слов:' ) }
								help={ this.state.wp_irbis_max_display_keywords_count == '' ? 'Укажите максимальное количество выводимых ключевых слов' : null}
								id="wp_irbis_max_display_keywords_count"
								className="codeinwp-text-field"
							>
								<input
									type="text"
									id="wp_irbis_max_display_keywords_count"
									value={ this.state.wp_irbis_max_display_keywords_count }
									placeholder={ __( '15' ) }
									disabled={ this.state.isAPISaving }
									onChange={ e => this.setState({ wp_irbis_max_display_keywords_count: e.target.value }) }
								/>
								
							</BaseControl>
							
						</PanelRow>
						<PanelRow>
							<BaseControl
								label={ __( 'Максимальное количество результатов поиска:' ) }
								help={ this.state.wp_irbis_max_search_results_count == '' ? 'Укажите максимальное количество результатов поиска' : null}
								id="wp_irbis_max_search_results_count"
								className="codeinwp-text-field"
							>
								<input
									type="text"
									id="wp_irbis_max_search_results_count"
									value={ this.state.wp_irbis_max_search_results_count }
									placeholder={ __( '50' ) }
									disabled={ this.state.isAPISaving }
									onChange={ e => this.setState({ wp_irbis_max_search_results_count: e.target.value }) }
								/>
								
							</BaseControl>
							
						</PanelRow>

					</PanelBody>

					<Button
						className='middle-button'
						isPrimary
						isLarge
						disabled={ this.state.isAPISaving || !this.state.wp_irbis_address_port || this.state.wp_irbis_address_port.match(addr_port_reg) === null }
						onClick={ () => {
							this.changeOptions( 'wp_irbis_address_port', this.state.wp_irbis_address_port )
							this.changeOptions( 'wp_irbis_login', this.state.wp_irbis_login )
							this.changeOptions( 'wp_irbis_password', this.state.wp_irbis_password )
							this.changeOptions( 'wp_irbis_database', this.state.wp_irbis_database )
							this.changeOptions( 'wp_irbis_max_display_keywords_count', this.state.wp_irbis_max_display_keywords_count )
							this.changeOptions( 'wp_irbis_max_search_results_count', this.state.wp_irbis_max_search_results_count )
							this.changeOptions( 'wp_irbis_output_template', this.state.wp_irbis_output_template )
						}}
					>
						{ __( 'Сохранить' ) }
					</Button>
					<br/>
					{'Кастомный файл шаблонизатора полей можно положить по пути {current_template_path}/public/wp_irbis_output_template.js'}
				</div>
			</Fragment>
		);
	}
}

render(
	<App/>,
	document.getElementById( 'wp_irbis__settings__layout' )
);
