const cancelTokenSource = axios.CancelToken.source();

let base_url = '/wp-json/wp-irbis/v1',
    execute_query = '/execute_query';

const api = axios.create({
    withCredentials: false,
    baseURL: base_url
})

function stringToKeywordExpression(string){

    let keywords_array = string.split(' ').filter(word=>{
        return word !== ' '
    })

    if(keywords_array.length==0){
        return null
    }

    let expression = '(('
    for(let i in keywords_array){
        expression += (i==0) ? `K=${keywords_array[i]}$` :  ` * K=${keywords_array[i]}$`
    }
    expression += ')'
    expression += ` + K=${string})`

    return expression
}

jQuery('.wp_irbis__searchbar__form__clear_button').click(function(){
    jQuery(".wp_irbis__searchbar input").val('')
    jQuery('.wp_irbis__searchbar__form__clear_button').fadeOut()
    jQuery(".wp_irbis__results").empty()

})

let input_value = '';

/*
jQuery( "#search_input" ).autocomplete({
    source: function (request, response) {
        let value = jQuery(".wp_irbis__searchbar input").val();

        //Режим поисковой запрос по пробелам
        let clear_val = value.split(' ')

        //Получаем последнее слово, если последнее "слово" являлось пробелом, то автодополнять нечего
        last_word = clear_val.slice(-1).toString();

        //Удаляем пустые подстроки и снова собираем в строку(на случай если введено несколько пробелов)
        value = clear_val.filter(a=>{return a!=''}).join(' ');
        input_value = value;
        
        //Если последний символ пробел или длина меньше 3, то и нечего искать
        if( last_word=='' || value.length < 3){
            return;
        }

        //Отправка POST запроса на Api Endpoint
        $.post( '/wp-json/wp-irbis/v1/getkeys', {
            last_word,
            db: 'OKIO'
        }, function(data){
            //Сортировка по количеству вхождений
            //results_sorting = data.results.sort( (a, b) => b.count - a.count );

            //Оставляем первые n элементов
            //results_sorting = results_sorting.slice( 0, 20 );

            let results = data.results.slice( 0, 20 );

            //Регулярка: K=Пушкин => Пушкин.
            let r = new RegExp(/\b[a-zA-Z]{1}=/gm);

            //Маппим вышеупомянутой регуляркой чтобы убрать префиксы K= у результатов
            let autocomplete = results.map((a)=> a.text.replace(r, ''))
            //let autocomplete = results.map((a)=> a.text)

            //Возвращаем результаты в коллбек autocomplete
            response(autocomplete)
        })
    },
    minLength: 3,
    //При выборе элемента удаляем последнее слово и добавляем выбранное
    select: function( event, ui ) {
        
        var terms = this.value.split(' ');
        terms.pop();
        terms.push( ui.item.value );
        terms.push('');
        this.value = terms.join(' ');
        return false;
    },
    focus: function() {
        return false;
    },
    open: function( event, ui ) {
        let input = $( event.target );
        let widget = input.autocomplete( "widget" );
        let style = $.extend( input.css( [
                "font",
                "border-left",
                "padding-left"
            ] ), {
                position: "absolute",
                visibility: "hidden",
                "padding-right": 0,
                "border-right": 0,
                "white-space": "pre"
            } ),
            div = $( "<div/>" ),
            pos = {
                my: "left top",
                collision: "none"
            },
            offset = -7;

        widget.css( "width", "" );
        div
            .text( input.val().replace( /\S*$/, "" ) )
            .css( style )
            .insertAfter( input );
        offset = Math.min(
            Math.max( offset + div.width(), 0 ),
            input.width() - widget.width()
        );
        div.remove();
        pos.at = "left+" + offset + " bottom";
        input.autocomplete( "option", "position", pos );
        widget.position( $.extend( { of: input }, pos ) );
    }
});
*/

jQuery(".searchbar__form").keypress(function(e) {
    if (e.which == 13) {
        let value = jQuery(".wp_irbis__searchbar input").val();
        let clear_val = value.split(' ')
        value = clear_val.filter(a=>{return a!=''}).join(' ');

        wpIrbisSearch( value )
        return false;
    }
});

function getTags(obj){
    try{
        return obj.filter(a=>{
            return a.tag==610
        }).map(a=>{
            return a.value
        })
    }catch(e){
        return null
    }
}

function getDictionary(d, num){
    if(!(num in d)){
        return false;
    }
    let d702 = d[702].split('\n');
    let d702mapped = []
    for(let i = 0; i < d702.length; i+=2 ){
        d702mapped.push({
            from: d702[i],
            to: d702[i+1]
        });
    }
    return d702mapped;
}

async function wpIrbisSearch(value){
    jQuery('.wp_irbis__searchbar__form__loading').fadeIn();
    console.log('Поиск: ', value)

    let response = await api.post(execute_query ,{
        query: value
    }).catch(e=>{
        console.log("error: ", e)
        return null
    })
    jQuery('.wp_irbis__searchbar__form__loading').fadeOut();
    if(!response || response.status !== 200){
        return;
    }
    
    let results = response.data.results;
    let dictionaries = response.data.dictionaries;

    jQuery(".wp_irbis__results").empty()


    for(let i in results){
        let book = jQuery(`<div class='book collapse'></div>`)

        let raw_fields = results[i].fields;
        let fields = formFields(raw_fields, dictionaries);

        for(let _f of fields){
            book.append(`
                <p class='field'>
                    <span class='field__name'>${_f.ru ? _f.ru + ':' : ''}</span> 
                    <span class='field__value'>${_f.value}</span>
                    ${ _f.can_copy ? '<span class="copy_button" title="Скопировать">' : '' }
                </p>`)
        }

        book.find('.copy_button').on('click',(e)=>{
            let val = $(e.target).closest('.field').find('.field__value').html();
            navigator.clipboard.writeText(val).then(function() {})
        })

        book
        .appendTo(".wp_irbis__results").on('click',()=>{
            console.log(results[i])
        }).on('click',()=>{
            book.removeClass('collapse')
        })

        let keywords = jQuery(`<div class='keywords'></book>`);
        let _keywords = getTags(results[i].fields).slice(0, wp_irbis_settings.wp_irbis_max_display_keywords_count)
        for(let keyword of _keywords){
            jQuery(`<span class='book-keyword'>${keyword}</span>`).appendTo(keywords).on('click',()=>{
                jQuery(".wp_irbis__searchbar input").val(keyword)
                wpIrbisSearch(stringToKeywordExpression(keyword))
                window.scrollTo({
                    top: jQuery('#wp_irbis').position().top,
                    behavior: 'smooth',
                })
            })
        }
        book.append(keywords)

        
        book.append( jQuery(`<div class='button full'>
            <svg width="16px" height="16px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path fill-opacity="0.5" d="M12.2929,5.292875 C12.6834,4.902375 13.3166,4.902375 13.7071,5.292875 C14.0976,5.683375 14.0976,6.316555 13.7071,6.707085 L8.70711,11.707085 C8.31658,12.097605 7.68342,12.097605 7.29289,11.707085 L2.29289,6.707085 C1.90237,6.316555 1.90237,5.683375 2.29289,5.292875 C2.68342,4.902375 3.31658,4.902375 3.70711,5.292875 L8,9.585765 L12.2929,5.292875 Z"/>
            </svg>
        </div>`) )
        book.append( jQuery(`<div class='white-shadow'></div>`) )
        
    }
}




let regexp_eol = new RegExp(/{eol\^.{1,5}}/gm);
let regexp_del = new RegExp(/{del\^.{1,5}}/gm);

let regexp_v = new RegExp(/v\d{2,3}/gm);
let regexp_ve = new RegExp(/\+{0,1}v\d{2,3}\^[A-Za-z0-9]/gm);

function formFields(fields, dictionaries){
    if( wp_irbis_output_template === null ){
        console.log('Шаблон вывода wp_irbis_output_template не определён!')
        return [];
    }

    let res = [];

    fields_loop:
    for(let field of wp_irbis_output_template){
      conditions:
      for(let condition of field.conditions){
        for(let _if of condition.if){
            if(typeof _if === 'string'){
              let matches_v = _if.match( regexp_v );
              let matches_ve = _if.match( regexp_ve );
              if(matches_ve){
                let t = parseInt( matches_ve[0].split('^')[0].replace('v', '') );
                let b = matches_ve[0].split('^')[1]
                let f = fields.filter(a=>{
                  return a.tag === t;
                });
                if( f.length === 0 ){
                  continue conditions;
                }
                let __f = f.filter(_f=>{
                  return _f.subfields.filter(subf=>{
                    return subf.code == b;
                  }).length != 0;
                })
                if( __f.length === 0 ){
                  continue conditions;
                }

              }else if(matches_v){
                let t = parseInt( matches_v[0].replace('v', '') );
                let f = fields.filter(a=>{
                  return a.tag === t;
                });
                if( f.length === 0 ){
                  continue conditions;
                }
              }else{
                continue conditions;
              }
            }
        }

        let result = '';
        if( field.repeat && field.repeat_field ){
            let num = field.repeat_field;
            let filtered_raw_field_by_num = fields.filter(a=>{
                    return a.tag === num;
            });
            for( let i=0; i<filtered_raw_field_by_num.length; i++ ){
                try{
                    result += condition.then
                        .replace(regexp_ve, function(match){
                            let t = parseInt( match.split('^')[0].replace('v', '').replace('+', '') );

                            let b = match.split('^')[1]

                            let __f = filtered_raw_field_by_num.filter(_f=>{
                                return _f.subfields.filter(subf=>{
                                    return subf.code == b;
                                }).length != 0;
                            })

                            let c = __f[i].subfields.filter(subf=>{
                                return subf.code == b;
                            });

                            if( match.substring(0, 1) !== '+' ){
                                return c[0].value;
                            }

                            let findInDict = getDictionary(dictionaries, t).filter(a=>{
                                return a.from == c[0].value;
                            })

                            if( findInDict.length == 0 ){
                                return c[0].value;
                            }
                            
                            return findInDict[0].to;
                        })
                        .replace(regexp_v, function(match){
                            let t = parseInt( match.replace('v', '') );
                            return filtered_raw_field_by_num[i].value
                        });
                    if( i + 1 == filtered_raw_field_by_num.length ){
                        result = result.replace(regexp_eol, function(match){
                            return match.replace('{eol^','').replace('}','');
                        })
                        result = result.replace(regexp_del, function(match){
                            return '';
                        })
                    }else{
                        result = result.replace(regexp_eol, function(match){
                            return '';
                        })
                        result = result.replace(regexp_del, function(match){
                            return match.replace('{del^','').replace('}','');
                        })
                    }
                }catch(e){
                    continue conditions;
                }
            }
        }else{
            result = condition.then
                .replace(regexp_ve, function(match){
                    let t = parseInt( match.split('^')[0].replace('v', '').replace('+', '') );
                    let b = match.split('^')[1]

                    //console.log(match)
                    if( match.substring(0, 1) === '+' ){
                        //console.log(t)
                        //console.log(getDictionary(dictionaries, t))
                    }
                    

                    let f = fields.filter(a=>{
                        return a.tag === t;
                    });
                    let __f = f.filter(_f=>{
                        return _f.subfields.filter(subf=>{
                            return subf.code == b;
                        }).length != 0;
                    })

                    let c = __f[0].subfields.filter(subf=>{
                        return subf.code == b;
                    });
                    return c[0].value;
                })
                .replace(regexp_v, function(match){
                    let t = parseInt( match.replace('v', '') );
                    let f = fields.filter(a=>{
                        return a.tag === t;
                    });
                    return f[0].value
                });
        }

        //console.log(field)

        res.push({
            ...field,
            true_condition: condition,
            value: result
        });
        continue fields_loop;
      }
    }

    return res;
}
