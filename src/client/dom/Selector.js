(function($_) {
    /**
     * @namespace
     * @name Asdf.Utils
     */
    var o = $_.Core.namespace($_, 'Selector');
    var expando = "expando" + 1 * new Date();
    var booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",
    // Regular expressions
    // http://www.w3.org/TR/css3-selectors/#whitespace
        whitespace = "[\\x20\\t\\r\\n\\f]",
    // http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
        identifier = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",
    // Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
        attrs = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
            // Operator (capture 2)
            "*([*^$|!~]?=)" + whitespace +
            // "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
            "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
            "*\\]",
        pseudos = ":(" + identifier + ")(?:\\((" +
            // To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
            // 1. quoted (capture 3; capture 4 or capture 5)
            "('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
            // 2. simple (capture 6)
            "((?:\\\\.|[^\\\\()[\\]]|" + attrs + ")*)|" +
            // 3. anything else (capture 2)
            ".*" +
            ")\\)|)",
    // Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
        rwhitespace = new RegExp( whitespace + "+", "g" ),
        rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

        rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
        rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

        rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

        rpseudo = new RegExp( pseudos ),
        ridentifier = new RegExp( "^" + identifier + "$" ),

        matchExpr = {
            "ID": new RegExp( "^#(" + identifier + ")" ),
            "CLASS": new RegExp( "^\\.(" + identifier + ")" ),
            "TAG": new RegExp( "^(" + identifier + "|[*])" ),
            "ATTR": new RegExp( "^" + attrs ),
            "PSEUDO": new RegExp( "^" + pseudos ),
            "CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
                "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
                "*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
            "bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
            // For use in libraries implementing .is()
            // We use this for POS matching in `select`
            "needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
                whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
        },
        matchFunction = {
            "ATTR": function(match){
                match[1] = match[1].replace( runescape, funescape );
                // Move the given value to match[3] whether quoted or unquoted
                match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );
                if ( match[2] === "~=" ) {
                    match[3] = " " + match[3] + " ";
                }
                return match.slice( 0, 4 );
            },"CHILD": function( match ) {
                /* matches from matchExpr["CHILD"]
                 1 type (only|nth|...)
                 2 what (child|of-type)
                 3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
                 4 xn-component of xn+y argument ([+-]?\d*n|)
                 5 sign of xn-component
                 6 x of xn-component
                 7 sign of y-component
                 8 y of y-component
                 */
                match[1] = match[1].toLowerCase();
                if ( match[1].slice( 0, 3 ) === "nth" ) {
                    // nth-* requires argument
                    if ( !match[3] ) {
                        throw new Error( match[0] );
                    }
                    // numeric x and y parameters for Expr.filter.CHILD
                    // remember that false/true cast respectively to 0/1
                    match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
                    match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );
                    // other types prohibit arguments
                } else if ( match[3] ) {
                    throw new Error( match[0] );
                }
                return match;
            },
            "PSEUDO": function( match ) {
                var excess,
                    unquoted = !match[6] && match[2];
                if ( matchExpr["CHILD"].test( match[0] ) ) {
                    return null;
                }
                // Accept quoted arguments as-is
                if ( match[3] ) {
                    match[2] = match[4] || match[5] || "";
                    // Strip excess characters from unquoted arguments
                } else if ( unquoted && rpseudo.test( unquoted ) &&
                    // Get excess from tokenize (recursively)
                    (excess = tokenize( unquoted, true )) &&
                    // advance to the next closing parenthesis
                    (excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {
                    // excess is a negative index
                    match[0] = match[0].slice( 0, excess );
                    match[2] = unquoted.slice( 0, excess );
                }
                // Return only captures needed by the pseudo filter method (type and argument)
                return match.slice( 0, 3 );
            }
        },
        rinputs = /^(?:input|select|textarea|button)$/i,
        rheader = /^h\d$/i,

        rnative = $_.R.FN_NATIVE,

    // Easily-parseable/retrievable ID or TAG or CLASS selectors
        rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

        rsibling = /[+~]/,
        rescape = /'|\\/g,

    // CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
        runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ) ,
        funescape = function( _, escaped, escapedWhitespace ) {
            var high = "0x" + escaped - 0x10000;
            // NaN means non-codepoint
            // Support: Firefox<24
            // Workaround erroneous numeric interpretation of +"0x"
            return high !== high || escapedWhitespace ?
                escaped :
                high < 0 ?
                    // BMP codepoint
                    String.fromCharCode( high + 0x10000 ) :
                    // Supplemental Plane codepoint (surrogate pair)
                    String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
        };
    var _rbuggyMathches = [];
    /**
     * @type {number}
     * @private
     * @desc element id
     */
    var _sid =1;

    var opposite = {
        'parentNode': 'childNode',
        'previousSibling':'nextSibling',
        'childNode':'parentNode',
        'nextSibling': 'previousSibling'
    };
    var combinators = {
        ' ': function(node, token, eachCallback){
            var item, i=0;
            var type = token[0].type;
            if(type === 'ID'){
                item = $_.Element.getElementById(node, token[0].matches[0]);
                if(!item|| !_matchSelector(item, _matchFn(token.slice(1))))
                    return ;
                return eachCallback(item);
            }
            item = (type === 'CLASS')? ($_.Element.getElementsByClassName(node, $_.A.reduce(token, function(acc, v){
                if(v.type === 'CLASS') {acc.push(v.matches[0]);i++;}
                return acc;
            },[]).join(' '))): type==='TAG'?$_.Element.getElementsByTagName(node, token[0].matches[0]):[];
            return $_.A.each(item, function(el) {
                    if(_matchSelector(el, _matchFn(token.slice(i||1))))
                        eachCallback(el);
                });
        },
        '>': function(node, token, eachCallback){
            var item = $_.Element.children(node);
            return $_.A.each(item, function(el) {
                    if( _matchSelector(el, _matchFn(token)))
                        eachCallback(el);
                });
        },
        '+':function(node, token, eachCallback){
            var item = $_.Element.next(node);
            if(!item|| !_matchSelector(item, _matchFn(token))) return ;
            return eachCallback(item);
        },
        '~':function(node, token, eachCallback){
            var item = $_.Element.nexts(node);
            return $_.A.each(item, function(el) {
                    if( _matchSelector(el, _matchFn(token)))
                        eachCallback(el);
                });
        }
    };
    var filters = {
        'ID': function(id){
            var attrId = id.replace( runescape, funescape );
            return $_.Bom.features.getById? function(elem){
                return elem.getAttribute("id") === attrId;
            }:function(elem){
                var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
                return node && node.value === attrId;
            }
        },
        'TAG': function(tag){
            var nodeName = tag.replace( runescape, funescape ).toLowerCase();
            return tag === "*" ?
                function() { return true; } :
                function( elem ) {
                    return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
                };
        },
        'CLASS': $_.F.memoize(function(className){
            var pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" );
            return function( elem ){
                return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
            }
        }, function(c){return c+ ' '}),
        'ATTR': function(name, op, value){
            return function(elem) {
                var res = $_.Element.attr(elem, name);
                if (res == null) {
                    return op === '!='
                }
                if(!op) return true;
                return op === "=" ? res === value :
                    op === "!=" ? res !== value :
                        op === "^=" ? value && res.indexOf( value ) === 0 :
                            op === "*=" ? value && res.indexOf( value ) > -1 :
                                op === "$=" ? value && res.slice( -value.length ) === value :
                                    op === "~=" ? ( " " + res.replace( rwhitespace, " " ) + " " ).indexOf( value ) > -1 :
                                        op === "|=" ? res === value || res.slice( 0, value.length + 1 ) === value + "-" :
                                            false;
            }
        },
        'CHILD':function(type, what, argument, first, last){
            var fn = $_.Element['is'+$_.S.capitalize(type)+$_.S.capitalize(what)];
            if(!fn)
                throw new Error('unsupported pseudo:'+type+'_'+what);
            return $_.F.partial(fn, undefined, argument);

        },
        'PSEUDO':function(pseudo, argument){
            var fn = $_.Element['is'+$_.S.capitalize(pseudo)];
            if(!fn)
                throw new Error('unsupported pseudo:'+pseudo);
            return $_.O.isUndefined(argument)?fn:$_.F.partial(fn, undefined, argument);
        }


    };
    var _matchFn = $_.F.memoize(function (tokens){
        return $_.A.map(tokens, function(token){
            return filters[token.type].apply(null, token.matches);
        });
    }, function(tokens){
        return toSelector(tokens);
    });
    function _matchSelector(node, fns) {
        for (var i = 0; i < fns.length; i++) {
            var fn = fns[i];
            if (!fn(node)) return false;
        }
        return true;
    }
    var filter = $_.O.keys(filters);
    function _tokenize(selector){
        var str = selector,res = [], matched, match, tokens;
        var f = function(type){
            if((match = matchExpr[type].exec(str)) && (!matchFunction[type]|| (match = matchFunction[type](match)))){
                matched = match.shift();
                tokens.push({
                    value:matched,
                    type:type,
                    matches:match
                });
                str = str.slice(matched.length);
            }
        };
        while(str){
            if(!matched||(match = rcomma.exec(str))) {
                if (match)
                    str = str.slice(match[0].length) || str;
                res.push((tokens = []));
            }
            matched = false;
            if((match = rcombinators.exec(str))){
                matched = match.shift();
                tokens.push({
                    value:matched,
                    type:match[0].replace(rtrim, ' ')
                });
                str = str.slice(matched.length)
            }
            $_.A.each(filter, f);
            if(!matched){
                break;
            }
        }
        if(str) throw new Error();
        return res;
    }
    var tokenize = $_.F.compose($_.F.memoize(_tokenize, function(str){return str+' '}), $_.O.clone);
    function getId(el){
        return (el._sid)? el._sid:(el._sid=_sid++);
    }
    function _findUniqueMerge(res, combinator, token){
        var _cacheMap = $_.A.toMap(res, function(el){return getId(el)}, $_.F.alwaysTrue);
        var eachCallback = function(el){
            var sid = getId(el);
            if(_cacheMap[sid]) return;
            _cacheMap[sid] = true;
            res.push(el);
        };
        $_.N.times(res.length, function(){
            var node = res.shift();
            combinator(node, token, eachCallback);
        });
    }
    function compareToken(t1,t2) {
        var m = {
            'ID':0,
            'TAG':2,
            'CLASS':1,
            'ATTR':3,
            'PSEUDO':4
        };
        var res = m[t1.type] - m[t2.type];
        if(res === 0){
            if(t1.value < t2.value) return -1;
            else if(t1.value > t2.value) return 1;
            return 0;
        }
        return res;

    }
    function select(expression, element, results){
        results = results||[];
        element = element || document;
        expression = expression.replace(rtrim, '$1');
        var tokens = tokenize(expression);
        var types = filter;
        var needSort = results.length>0||tokens.length>1;
        results =  $_.A.reduce(tokens, function(res, token){
            var i = 0,j = 0, t, combinator= combinators[' '],r = [element];
            while(t=token[i++]){
                var type = t.type;
                if(!$_.A.include(types, type)){
                    _findUniqueMerge(r, combinator, token.slice(j, i-1).sort(compareToken));
                    combinator = combinators[type];
                    j = i;
                }
            }
            _findUniqueMerge(r, combinator, token.slice(j).sort(compareToken));
            return $_.A.merge(res,r);
        }, results);
        return (!needSort)?results:results.sort($_.Element.compareNode);
    }

    function toSelector(tokens){
        return $_.A.reduce(tokens, function(str, i){
            return str+ i.value;
        }, '');
    }
    $_.O.extend(o, {
        tokenize:tokenize,
        toSelector:toSelector,
        select:select
    })
})(Asdf);