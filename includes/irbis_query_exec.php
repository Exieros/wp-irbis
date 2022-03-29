<?php

require_once __DIR__ . '/phpirbis/PhpIrbis.php';
require_once __DIR__ . '/phpirbis/Search.php';
use Irbis\Search;
use Irbis\SearchParameters;
use Irbis\FoundLine;

define( 'IRBIS_CACHE_PATCH', dirname(__DIR__) . '/cache/' );

class Irbis_Web{
    protected string $IRBIS_SERVER_HOST;
    protected int $IRBIS_SERVER_PORT;
    protected string $IRBIS_SERVER_USER;
    protected string $IRBIS_SERVER_PASSWORD;
    protected string $IRBIS_DATABASE_NAME;
    protected int $MAX_SEARCH_RESULTS_COUNT;
    

    public function __construct(
        string $IRBIS_SERVER_HOST, 
        int $IRBIS_SERVER_PORT = 6666, 
        string $IRBIS_SERVER_USER,
        string $IRBIS_SERVER_PASSWORD,
        string $IRBIS_DATABASE_NAME = 'OKIO',
        int $MAX_SEARCH_RESULTS_COUNT = 50
    ) {
        $this->connection = new Irbis\Connection();
        $this->connection->host = $IRBIS_SERVER_HOST;
        $this->connection->port = $IRBIS_SERVER_PORT;
        $this->connection->username = $IRBIS_SERVER_USER;
        $this->connection->password = $IRBIS_SERVER_PASSWORD;
        $this->IRBIS_DATABASE_NAME = $IRBIS_DATABASE_NAME;
        $this->MAX_SEARCH_RESULTS_COUNT = $MAX_SEARCH_RESULTS_COUNT;
    }

    private function check_connection_self_use(){
        if (!$this->connection->connect()) {
            return [
                'success' => false,
                'error' => Irbis\describe_error($this->connection->lastError)
            ];
        }
    }

    public function check_connection(){
        $this->check_connection_self_use(); 
        return ['success' => true];
    }


    private function get_dictionary($path){
        $hash = hash( 'md5', trim( mb_strtolower( $path ) ) );

        if( file_exists( IRBIS_CACHE_PATCH . $hash ) ){
            //Если есть в кеше, то грузим из кеша чтобы не нагружать Ирбис
            $content = file_get_contents( IRBIS_CACHE_PATCH . $hash, true );
            return $content;
        }else{
            $content = $this->connection->readTextFile("3.IBIS.7024.MNU");
            file_put_contents( IRBIS_CACHE_PATCH . $hash, $content );
            return $content;
        }
        return '';
    }

    public function searchQueryToIrbis($query_string, $database = 'OKIO', $type = 'JSON'){
        $this->check_connection_self_use();
        $this->set_database($database);
        $query = trim($query_string);

        if($type === 'JSON'){
            $found = $this->connection->searchSingleRecord($query);
        }else{
            $prms = new Irbis\SearchParameters();
            $prms->expression = $query;
            $prms->format = $type;
            $prms->numberOfRecords = 5;
            $found = $this->connection->searchEx($prms);
        }

        /*
        $response = wp_remote_post("http://127.0.0.1:81/sphinx-test/search.php", [
            'body' => [
                'search' => $query
            ]
        ]);

        $res_json = json_decode($response['body']);
        if( $res_json->status != 'good' ){
            return [
                'success' => false,
                'status_message' => $res_json->status_message
            ];
        }
        if( $res_json->result_total == "0"  ){
            return [
                'success' => false,
                'status_message' => 'not found'
            ];
        }
        
        $results = array_map(function($r){
            return [
                'mfn' => $r->id,
                'fields' => json_decode($r->attrs->fields)
            ];
        }, $res_json->mathes);
        */
        return [
            'success' => true,
            'results' => $found,
            'query' => $query,
            'dictionaries'=> [ 702 => $this->get_dictionary('3.IBIS.7024.MNU') ]
        ];
    }

    /**
	 * Функция возвращает список найденных ключей
	 * @param string $term Ключ
	 * @param string $database (опционально) Название базы данных
	 * @return array ['success'=> true/false, 'database'=> db name, 'results'=> результаты]
	 */
    public function getkeys($term, $database = NULL){
        $this->check_connection_self_use();
        
        $db = $this->set_database( $database );

        $res = [];

        if( mb_strlen($term) > 2 ){
            $key_results = $this->connection->readTerms( "K=${term}" );

            $res = array_filter($key_results, function($e) use ($term){
                return strpos( mb_strtoupper($e->text), mb_strtoupper($term) );
            });

            usort($res, function($a, $b){
                return $b->count - $a->count ;
            });
        }

        return [
            'success' => true,
            'database' => $db,
            'results' => $res
        ];
    }

    //Получение списка баз данных с сервера ирбис. #DBNNAMECAT может быть отличным от приведенного в коде.
    //Да и в принципе архитектура ирбис располагает к тому, чтобы ничего не обещать.......................
    private function get_databases(){
        $ini =  $this->connection->iniFile;
        $dbnnamecat = $ini->getValue('Main', '#DBNNAMECAT');
        return $this->connection->listDatabases('1..' . $dbnnamecat);
    }

    //Установка базы данных для поиска по ней
    private function set_database($database){
        $this->check_connection_self_use();

        $db_list = $this->get_databases();

        //Если список баз данных у ирбиса пуст
        if( !count($db_list) ){
            return false;
        }

        //Проверка наличия указанной базы данных в списке
        $filtered_db_list = array_filter( $db_list, function($db) use ($database){
            return $db->name == $database;
        });
        //Если найдено, то устанавливаем ее
        if( count($filtered_db_list) > 0 ){
            $this->connection->database = $database;
            return $database;
        }

        //Иначе проверяем наличие базы данных из настроек
        $filtered_db_list = array_filter( $db_list, function($db){
            return $db->name == $this->IRBIS_DATABASE_NAME;
        });
        //Если найдено, то устанавливаем базу данных из настроек
        if( count($filtered_db_list) > 0 ){
            $this->connection->database = $this->IRBIS_DATABASE_NAME;
            return $this->IRBIS_DATABASE_NAME;
        }

        //Иначе получаем первую базу из списка, которые ирбис по умолчанию будет использовать
        $this->connection->database = $db_list[0]->name;
        return $db_list[0]->name;
    }
}

?>