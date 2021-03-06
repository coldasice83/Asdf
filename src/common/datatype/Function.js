/**
 * @project Asdf.js
 * @author N3735
 */
(function($_) {
    /**
     * @namespace
	 * @name Asdf.F
     */
	$_.F = {};
	var slice = Array.prototype.slice, fnProto = Function.prototype, nativeBind = fnProto.bind;

	/**
     * @memberof Asdf.F
	 * @param {*} value value
	 * @returns {*} value를 리턴한다. 
	 * @desc value를 리턴한다.
	 */
	function identity(value) {
		return value;
	}

	/**
     * @memberof Asdf.F
	 * @param {function} func 실행 함수
	 * @param {object} context 실행 함수 context
	 * @returns {function} context에서 실행할 함수를 반환한다.
	 * @desc 함수의 context를 변경한다.
	 * @example
	 * var obj = {name: 'kim'};
	 * window.name = 'lee';
	 * function getName(){return this.name};
	 * getName(); //return 'lee'
	 * Asdf.F.bind(getName, obj)(); // return 'kim'
	 */
	function bind(func, context) {
		if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
		if (!$_.O.isFunction(func)) throw new TypeError;
		if (arguments.length < 3 && $_.O.isUndefined(arguments[1])) return func;
		var __method = func, args = slice.call(arguments, 2);
		return function() {
			var a = [];
			$_.A.merge(a, args);
			$_.A.merge(a, arguments);
			return __method.apply(context, a);
		}
	}
		
	/**
	 * @memberof Asdf.F
	 * @param {function} func 실행 함수
	 * @param {...*=} args 미리 넣을 인자들
	 * @returns {function} func에 미리 인자를 넣은 함수를 반환한다.
	 * @desc 앞부터 인자를 채워 넣는다.
	 * @example
	 * var inc1 = Asdf.F.curry(function(a,b){return a+b;}, 1);
	 * var inc2 = Asdf.F.curry(function(a,b){return a+b;}, 2);
	 * inc1(1); return 2;
	 * inc2(1); return 3; 
	 */
	function curry(func) {
		if (!$_.O.isFunction(func)) throw new TypeError;
		if (arguments.length == 1)
			return func;
		var __method = func, args = slice.call(arguments, 1);
		return function() {
			var a = [];
			$_.A.merge(a, args);
			$_.A.merge(a, arguments);
			return __method.apply(this, a);
		};
	}

	/**
	 * @memberof Asdf.F
	 * @param {function} func 실행 함수
	 * @param {number} timeout 지연시간(초) 
	 * @returns {*} setTimeoutId를 반환한다.
	 * @desc 실행함수를 지연시간 후에 실행한다. 
	 */
	function delay(func, timeout) {
		if (!$_.O.isFunction(func)) throw new TypeError;
		var __method = func, args = slice.call(arguments, 2);
		timeout = timeout * 1000;
		return window.setTimeout(function() {
			return __method.apply(__method, args);
		}, timeout);
	}

	/**
	 * @memberof Asdf.F
	 * @param {function} func 실행 함수
	 * @returns {*} setTimeoutId를 반환한다.
	 * @desc 실행함수를 0.01초 후에 실행한다. 
	 */
	function defer(func) {
		if (!$_.O.isFunction(func)) throw new TypeError;
		var args = $_.A.merge([ func, 0.01 ], slice.call(arguments, 1));
		return delay.apply(this, args);
	}

	/**
	 * @memberof Asdf.F
	 * @param {function} func 실행 함수
	 * @param {function} wrapper wrapper 함수 
	 * @returns {function} 실행함수를 wrapper로 감싼 함수를 반환한다.
	 * @desc 실행함수를 wrapper로 감싼 함수를 반환한다. wrapper의 첫번째 인자는 실행 함수 이다.
	 * @example
	 * function fn(a){
	 * 	return -a;
	 * }
	 * Asdf.F.wrap(fn, function(fn, a){ return -fn(a);})(2); //return 2;
	 */
	function wrap(func, wrapper) {
		if (!$_.O.isFunction(func)) throw new TypeError;
		var __method = func;
		return function() {
			var a = $_.A.merge([ bind(__method, this) ], arguments);
			return wrapper.apply(this, a);
		};
	}
	
	/**
	 * @memberof Asdf.F
	 * @param {function} func 실행 함수
	 * @param {function} pre 이전 실행 함수
	 * @param {boolean=} stop 이전 실행 함수의 결과값여부에 따라 실행 함수를 실행여부를 결정
	 * @returns {function} 이전 실행 함수, 실행 함수를 실행하는 함수를 반환한다.
	 * @desc 이전 실행 함수, 실행 함수를 실행하는 함수를 반환한다.
	 * @example
	 * function b(a){
	 * 	return !a; 
	 * }
	 * function fn(a){
	 * 	return a;
	 * }
	 * Asdf.F.before(fn, b)(true); //return true;
	 */
	function before(func, pre, stop){
		if(!$_.O.isFunction(func)|| !$_.O.isFunction(pre)) throw new TypeError;
		return function () {
			var pres;
			if(!(pres = pre.apply(this,arguments))&&stop) return pres;
			return func.apply(this,arguments);
		};
	}
	
	/**
	 * @memberof Asdf.F
	 * @param {function} func 실행 함수
	 * @param {function} afterfn 이후 실행 함수
	 * @param {boolean} stop 실행 함수의 결과값여부에 따라 이후 실행 함수를 실행여부를 결정 
	 * @returns {function} 실행 함수, 이후 실행함수를 실행하는 함수를 반환한다.
	 * @desc 실행 함수, 이후 실행함수를 실행하는 함수를 반환한다.
	 * @example
	 * function a(res, a) {
	 * 	return res * 2;
	 * }
	 * function fn(a){
	 * 	return a * a;
	 * }
	 * Asdf.F.after(fn, a)(2); //return 8;
	 */
	function after(func, afterfn, stop){
		if(!$_.O.isFunction(func)||!$_.O.isFunction(afterfn)) throw new TypeError;
		return function() {
			var res = func.apply(this, arguments);
			if(!res && stop) return res;
			return afterfn.apply(this, $_.A.merge([res], arguments));
		};
	}
	
	/**
	 * @memberof Asdf.F
	 * @param {function} func 실행 함수
	 * @returns {function} 실행 함수 첫번째 인자를 this로 넣은 함수를 반환한다.
	 * @desc 순수 함수를 특정 객체의 매소드로 만들 경우 유용한 함수이다. 이 함수를 실행하면 첫번째 인자에 this를 넣은 함수를 반환한다.
	 * @example
	 * var obj = {name: 'lee'};
	 * function getName(obj){
	 * 	return obj.name;
	 * }
	 * obj.getName = Asdf.F.methodize(getName);
	 * obj.getName(); //return 'lee'
	 */
	function methodize(func) {
		if (func._methodized)
			return func._methodized;
		var __method = func;
		return func._methodized = function() {
			var a = $_.A.merge([ this ], slice.call(arguments,0));
			return __method.apply(null, a);
		}
	}

    function functionize(method){
        return function(){
            var a = slice.call(arguments,1);
            var context = arguments[0];
            return method.apply(context, a);
        }
    }
	
	/**
	 * @memberof Asdf.F
	 * @param {...function} fns 실행 함수들
	 * @returns {function} 함수들 오른쪽에서 왼쪽으로 실행하는 함수를 반환한다.
	 * @desc 함수들 오른쪽에서 왼쪽으로 실행하는 함수를 반환한다. composeRight(f, g) -> g(f(x))
	 * @example
	 * function fn(a){
	 * 	return a*2;
	 * }
	 * function fn2(a){
	 * 	return a+2;
	 * }
	 * 
	 * Asdf.F.composeRight(fn, fn2)(2); // return 8;
	 */
	function composeRight() {
		var fns = $_.A.filter(slice.call(arguments), $_.O.isFunction);
		return $_.A.reduce(fns, $_.Core.behavior.compose);
	}
	
	/**
	 * @memberof Asdf.F
	 * @param {...function} fns 실행 함수들
	 * @returns {function} 함수들 오른쪽에서 왼쪽으로 실행하는 함수를 반환한다.
	 * @desc 함수들 오른쪽에서 왼쪽으로 실행하는 함수를 반환한다. compose(f, g) -> f(g(x))
	 * @example
	 * function fn(a){
	 * 	return a*2;
	 * }
	 * function fn2(a){
	 * 	return a+2;
	 * }
	 * 
	 * Asdf.F.compose(fn, fn2)(2); // return 6;
	 */
	function compose() {
		var fns = $_.A.filter(slice.call(arguments), $_.O.isFunction);
		return $_.A.reduceRight(fns, $_.Core.behavior.compose);
	}
	var exisFunction = function (fn) {
		if($_.O.isNotFunction(fn)){
			throw new TypeError();
		}
		return true;
	};
	
	/**
	 * @memberof Asdf.F
	 * @function
	 * @param {function} func 실행 함수
	 * @param {number} number 제거할 인자 갯수.
	 * @returns {function} 실행 함수에서 number 갯수 인자를 제거한 실행 함수를 반환한다.
	 * @desc 실행 함수에서 number 갯수 인자를 제거한 실행 함수를 반환한다.
	 * @example
	 * function add(a,b){ return a+b; }
	 * var add2 = Asdf.F.extract(fn, 2);
	 * add2(1,2,3,4); // return 7;
	 */
	var extract = before($_.Core.combine.extract, exisFunction);

    var nAry = before($_.Core.combine.nAry,exisFunction);
	
	/**
	 * @memberof Asdf.F
	 * @function
	 * @param {function} func 실행 함수
	 * @param {...*=} args 미리 넣을 인자들
	 * @returns {function} func에 미리 인자를 넣은 함수를 반환한다.
	 * @desc 특정 위치 부터 미리 인자를 넣은 함수를 반환한다.
	 * @example
	 * var half = Asdf.F.partial(function(a,b){return a/b;}, undefined, 2);
	 * var quater = Asdf.F.partial(function(a,b){return a/b;}, 4);
	 * half(100); // return 50;
	 * quater(100); // return 25;
	 */ 
	var partial = before($_.Core.combine.partial, exisFunction);
	
	/**
	 * @memberof Asdf.F
	 * @function
	 * @param {...function} fns 실행 함수들
	 * @returns {function} 함수 실행 결과 값 중 하나만 참이면 결과는 참인 함수를 반환한다.
	 * @desc 함수 실행 중에 하나만 참이면 이후 연산은 하지 않고 참인 함수를 반환한다.
	 * @example
	 * Asdf.F.or(Asdf.O.isString, Asdf.O.isFunction, Asdf.O.isArray)('string'); // return true;
	 */
	function or(){
		var fns = $_.A.filter(slice.call(arguments), $_.O.isFunction);
		return function(){
			var i;
			for(i =0;i < fns.length; i++){
				if(fns[i].apply(this, arguments))
					return true;
			}
			return false;
		};
	}
	
	/**
	 * @memberof Asdf.F
	 * @function
	 * @param {...function} fns 실행 함수들
	 * @returns {function} 함수 실행 결과 값 중 하나만 거짓이면 결과는 거짓인 함수를 반환한다.
	 * @desc 함수 실행 중에 하나만 거짓이면 이후 연산은 하지 않고 거짓인 함수를 반환한다.
	 * @example
	 * function fn(a){
	 * 	return a < 10;
	 * }
	 * function fn1(a){
	 * 	return a < 15;
	 * }
	 * function fn2(a){
	 * 	return a < 20;
	 * }
	 * Asdf.F.and(fn, fn1, fn2)(9); // return true;
	 */
	function and(){
		var fns = $_.A.filter(slice.call(arguments), $_.O.isFunction);
		return function(){
			var i;
			for(i =0;i < fns.length; i++){
				if(!fns[i].apply(this, arguments))
					return false;
			}
			return true;
		};
	}
	var then = partial(after, undefined, undefined, true);

	function orElse(func, elseFn, stop){
		if(!$_.O.isFunction(func)||!$_.O.isFunction(elseFn)) throw new TypeError;
		return function() {
			var res = func.apply(this, arguments);
            if(Asdf.O.isNotUndefined(stop)&&stop===res||Asdf.O.isUndefined(stop)&&!res)
                return elseFn.apply(this, arguments);
            return res;


		};
	}
    function guarded(guards){
        if(!Asdf.O.isArray(guards)) throw new TypeError();
        var guardType = {
            test: function(v){return Asdf.O.isFunction(v)},
            fn: function(v){return Asdf.O.isFunction(v)}
        };
        if(!Asdf.A.any(guards, partial(Asdf.O.type, undefined, guardType)))
            throw new TypeError();
        return function(){
            for(var i =0 ; i < guards.length; i++){
                if(guards[i].test.apply(guards[i].context, arguments))
                    return guards[i].fn.apply(guards[i].context, arguments);
            }
            throw new TypeError();
        }
    }
    function sequence() {
        var fns = $_.A.filter(slice.call(arguments), $_.O.isFunction);
        return function(){
            var res;
            var args = arguments;
            Asdf.A.each(fns, function(f){
                res = f.apply(this, args);
            });
            return res;
        }
    }
    function cases(obj, defaults){
        if(!Asdf.O.isPlainObject(obj) || !Asdf.O.isFunction(defaults)) throw new TypeError();
        defaults = defaults || function(){};
        return function(key){
            var arg = slice.call(arguments, 1);
            var fn;
            if(fn = $_.O.get(obj, key)){
                if(Asdf.O.isFunction(fn)){
                    return fn.apply(this, arg);
                }
                return fn;
            }else {
                return defaults.apply(this, arg);
            }
        }
    }

    /**
     * @private
     * @type {Object}
     */
    var stop = {};
    function overload(fn, typeFn, overloadedFn){
        overloadedFn = overloadedFn||function(){throw new TypeError;};
        var f = function(){
            if(!typeFn.apply(this, arguments)){
                return stop;
            }
            return fn.apply(this, arguments);
        };
        return orElse(f, overloadedFn, stop)
    }
    function errorHandler(fn, handler, finhandler){
        return function(){
            try{
                return fn.apply(this, arguments);
            }catch(e){
                return handler(e);
            }finally{
                if(finhandler)
                    finhandler.apply(this, arguments);
            }
        }
    }

    function trys(){
        var fns = $_.A.filter(slice.call(arguments), $_.O.isFunction);
        return $_.A.reduce(fns, nAry(errorHandler,2));
    }

    /**
     * @memberof Asdf.F
     * @param {function} func
     * @param {function} success
     * @param {function=} fail
	 * @param {...function=} notify
     * @returns {function} callback Function
     */
	function asyncThen(func, success, fail, notify){
		return function(){
			return async.apply(this, $_.A.merge([func],arguments))(success, fail, notify);
		};
	}

	function asyncSequence(/*fns*/){
		var fns = $_.A.filter(slice.call(arguments), $_.O.isFunction);
		return $_.A.reduceRight(fns, function(f1, f2){
			return asyncThen(f1,f2);
		});
	}

	/**
	 * @memberof Asdf.F
	 * @param func
	 * @returns {function}
	 * @example
	 *
	 */

	/*
	var p1 = Asdf.F.promise(
		function(s,f){
			console.log(1);
			setTimeout(s.bind(this, 1,2), 1000);
		}
	)(
		function(s,f){
			console.log(2);
			console.log(arguments)
			setTimeout(s,1000)
		}
	)(
		function(s,f){
			console.log(3);
			setTimeout(s,1000);
		}
	);
	p1(
		function(s,f){
			console.log(4);
			f();
			setTimeout(s,1000);
		}
	)(
		function(s,f){
			console.log(5);
		},function(){
			console.log('fail');
		}
	);
	p1(
		function(s,f){
			console.log(6);
			setTimeout(s,1000);
		}
	)(
		function(s,f){
			console.log(7);
			s();
		}
	);
	*/
	function promise(func){
		var su = function(o){
			return function(){
				if(o._status !== 'pending') return;
				o._status = 'resolved';
				o.arg = slice.call(arguments);
				sequence.apply(this,$_.A.pluck(o._next,0)).apply(this, arguments);
			}
		};
		var fa = function(o){
			return function(){
				if(o._status !== 'pending') return;
				o._status = 'rejected';
				o.arg = slice.call(arguments);
				sequence.apply(this,$_.A.pluck(o._next,1)).apply(this, arguments);
			}
		};
		function f(obj){
			obj._next = [];//parent
			obj._status = 'pending';
			function next(succ, fail){
				var o = {};//child
				var n = f(o);
				var snext = su(o);
				var fnext = fa(o);
				if(obj._status == 'resolved'){
					try {
						succ.apply(this, $_.A.merge([snext, fnext], obj.arg || []));
					}catch(e){
						fnext(e);
					}
				}else if(obj._status == 'rejected'){
					fail.apply(this, $_.A.merge([snext,fnext],obj.arg||[]));
				}else {
					obj._next.push([function () {
						try {
							succ.apply(this, $_.A.merge([snext, fnext], obj.arg || []));
						}catch(e){
							fnext(e);
						}
					}, function () {
						fail.apply(this, $_.A.merge([snext, fnext], obj.arg || []));
					}]);
				}
				return n;
			}
			return next;
		}
		function run(func){
			var o = {};
			var res = f(o);
			var snext = su(o);
			var fnext = fa(o);
			try {
				func(snext, fnext);
			}catch(e){
				fnext(e);
			}
			return res;
		}

		return run(func);
	}

    /**
     * @memberof Asdf.F
     * @param {*} value
     * @returns {Function}
     * @desc value값을 반환하는 함수를 반환한다.
     * @example
     * var T = Asdf.F.toFunction(true);
     * T(); //true;
     */
	function toFunction(value){
		return function(){
			return value;
		}
	}

    /**
     * @memberof Asdf.F
     * @param {Function} asyncfn
     * @returns {Function}
     */

	function async(asyncfn){
        if(!$_.O.isFunction(asyncfn)) throw new TypeError();
		var args = slice.call(arguments,1);
		return wrap(asyncfn, function(f){
			var status = 'pending';
			var arg = slice.call(arguments,1);
			return f.apply(this, $_.A.map(arg, function(f,i){
				if(i === 0) {
					return function () {
						if (status !== 'pending') return;
						status = 'resolved';
						return f.apply(this, Asdf.A.concat(args, slice.call(arguments)));
					};
				}
				else if(i === 1) {
					return function () {
						if (status !== 'pending') return;
						status = 'rejected';
						return f.apply(this, arguments)
					};
				}
				return function(){
					return f.apply(this, $_.A.merge([status],arguments))
				};
			}));
		});
	}

    /**
     * @memberof Asdf.F
     * @param {...Function} async 인자값으로 callback 함수를 받는 함수들
     * @returns {Function} async 함수들이 다 완료 후 실행 하는 함수를 인자로 받는 함수
     * @desc async 함수들이 완료 한 경우 callback 함수를 부르는 함수를 반환한다.
     * @example
     * Asdf.F.when(
     * function(cb){setTimeout(function(){cb(1)}, 50)},
     * function(cb){setTimeout(function(){cb(2)}, 25)},
     * function(cb){setTimeout(function(){cb(3)}, 70)},
     * function(cb){setTimeout(function(){cb(4)}, 10)}
     * )(function(){console.log(arguments)}) //[1,2,3,4]
     */
	function when(/*async, options*/){
		var asyncs = slice.call(arguments);
		var options = $_.O.isPlainObject(asyncs[asyncs.length-1])?asyncs.pop():{};
		options =  $_.O.extend({resolveOnFirstSuccess:false, rejectOnFirstError:true}, options);
        if(asyncs.length < 2 || $_.A.any(asyncs, $_.O.isNotFunction)) throw new TypeError();
		return function(){
			var l = asyncs.length-1;
			var status = 'pending';
			var arg = slice.call(arguments,0);
			var res = [];
			var callbacks = $_.A.map(arg, function(f,i){
				if(i === 0) {
					return function (index, value) {
						if (status !== 'pending') return;
						if(options.resolveOnFirstSuccess){
							status = 'resolved';
							return f(index, value);
						}else {
							res[index] = value;
							if (l === 0) {
								status = 'resolved';
								return f.apply(this, res);
							}
							l--;
						}
					};
				}
				else if(i === 1) {
					return function (index, value) {
						if (status !== 'pending') return;
						if(options.rejectOnFirstError){
							status = 'rejected';
							return f(index, value);
						}else {
							res[index] = value;
							if (l === 0) {
								status = 'rejected';
								return f.apply(this, res);
							}
							l--;
						}
						status = 'rejected';
						return f.apply(this, arguments)
					};
				}
				return function(){
					return f.apply(this, $_.A.merge([status],arguments))
				};
			});
			$_.A.each(asyncs, function(f,index){
				var c = slice.call(callbacks,0);
				c[0] = curry(c[0],index);
				async(f).apply(this, c);
			});

		};
	}

    /**
     * @memberof Asdf.F
     * @param {Function} fn
     * @param {Number=} argNum
     * @returns {Function|*}
     * @desc 함수를 커리 함수로 만든다.
     * @example
     * function add3(a,b,c){return a+b+c};
     * var f = curried(add3);
     * f(1,2,3);
     * f(1,2)(3);
     * f(1)(2,3);
     * f(1)(2)(3);
     */
    function curried(fn, argNum){
        if(!$_.O.isFunction(fn)) throw new TypeError();
        if(argNum != null && $_.O.isNotNumber(argNum)) throw new TypeError();
        return function r(){
            if(arguments.length >= (argNum||fn.length))
                return fn.apply(this, arguments);
            else
                return bind.apply(r,$_.A.merge([r,this], arguments));
        }
    }
    /**
     * @memberof Asdf.F
     * @param {Function} func
     * @param {number} wait
     * @param {Object=} options
     * @returns {Function}
     */
    function throttle(func, wait, options) {
        if(!$_.O.isFunction(func)||!$_.O.isNumber(wait)) throw new TypeError();
        wait = wait*1000;
        var context, args, result;
        var timeout = null;
        var previous = 0;
        options || (options = {});
        var later = function() {
            previous = options.leading === false ? 0 : $_.Utils.now();
            timeout = null;
            result = func.apply(context, args);
            context = args = null;
        };
        return function() {
            var now = $_.Utils.now();
            if (!previous && options.leading === false) previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0) {
                clearTimeout(timeout);
                timeout = null;
                previous = now;
                result = func.apply(context, args);
                context = args = null;
            } else if (!timeout && options.trailing !== false) {
                timeout = setTimeout(later, remaining);
            }
            return result;
        };
    }


    /**
     * @memberof Asdf.F
     * @param {Function} func
     * @param {nubmer} wait
     * @param {boolean=} immediate
     * @returns {Function}
     */
    function debounce(func, wait, immediate){
        if(!$_.O.isFunction(func)||!$_.O.isNumber(wait)) throw new TypeError();
        var timeout, args, context, timestamp, result;
        wait = wait*1000;
        var later = function() {
            var last = $_.Utils.now() - timestamp;
            if (last < wait) {
                timeout = setTimeout(later, wait - last);
            } else {
                timeout = null;
                if (!immediate) {
                    result = func.apply(context, args);
                    context = args = null;
                }
            }
        };
        return function() {
            context = this;
            args = arguments;
            timestamp = $_.Utils.now();
            var callNow = immediate && !timeout;
            if (!timeout) {
                timeout = setTimeout(later, wait);
            }
            if (callNow) {
                result = func.apply(context, args);
                context = args = null;
            }
            return result;
        }
    }

    function periodize(func, frequency, wait){
        if(!$_.O.isFunction(func)||!$_.O.isNumber(frequency)||!$_.O.isNumber(wait)) throw new TypeError();
        wait = wait*1000;
        return function(cb){
            if(!$_.O.isFunction(cb)) throw new TypeError();
            var timeout, interval, timestamp, res;
            var self = this;
            var pfn = function(){
                var last = $_.Utils.now() - timestamp;
                res = func.call(self, res, Math.min(last/wait,1));
                if(last >= wait){
                    if(interval) {
                        cb.apply(self, res);
                    }
                    clearTimeout(timeout);
                    clearInterval(interval)
                }
            };
            timestamp = $_.Utils.now();
            timeout = setTimeout(pfn, wait);
            interval = setInterval(pfn, 1/frequency*1000);
            res = func.call(self, undefined, 0);
            return interval;
        }
    }

    /**
     * @memberof Asdf.F
     * @param {Function} func
     * @returns {Function}
     */
    function once(func){
        if(!$_.O.isFunction(func)) throw new TypeError();
        var ran = false, memo;
        return function() {
            if (ran) return memo;
            ran = true;
            memo = func.apply(this, arguments);
            func = null;
            return memo;
        };
    }

    /**
     * @memberof Asdf.F
     * @param {Function} func
     * @param {Function=} hasher
     * @returns {Function}
     */
    function memoize(func, hasher){
        if(!$_.O.isFunction(func)) throw new TypeError();
        var memo = {};
        hasher || (hasher = identity);
        return function() {
            var key = hasher.apply(this, arguments);
            return Asdf.O.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
        };
    }

    /**
     * @memberof Asdf.F
     * @param {Function} fn
     * @param {object} defaults
     * @returns {Function}
     */

    function annotate(fn, defaults){
        if(!$_.O.isFunction(fn)) throw new TypeError();
        var fnText = fn.toString().replace($_.R.STRIP_COMMENTS, '');
        var argNames = $_.A.map(fnText.match($_.R.FN_DEF)[2].split($_.R.FN_ARG_SPLIT), function(arg){
            return $_.S.trim(arg);
        });
        return function(obj){
            var arg = $_.A.map(argNames, function(v){
                return obj[v]||defaults[v];
            });
            return fn.apply(this, arg);
        }
    }

    function getDef(fn){
        if(!$_.O.isFunction(fn)) throw new TypeError();
        var comments = [];
        var fnText = fn.toString().replace($_.R.STRIP_COMMENTS, function(m,p1,p2){
            comments.push($_.S.trim(p1||p2));
            return '';
        });
        var m = fnText.match($_.R.FN_DEF);
        var argNames = $_.A.map(m[2].split($_.R.FN_ARG_SPLIT), function(arg){
            return $_.S.trim(arg);
        });
        return {
            name: m[1],
            arguments: argNames,
            body:m[3],
            comments:comments
        }
    }

    function converge(after /*fns*/){
        if(!$_.O.isFunction(after)) throw new TypeError();
        var fns = $_.A.filter(slice.call(arguments,1), $_.O.isFunction);
        return function(){
            var args = arguments;
            var self = this;
            return after.apply(self, Asdf.A.map(fns, function(fn){
                return fn.apply(self, args);
            }));
        }
    }

    function zip(fn /*arrays*/){
        if(!$_.O.isFunction(fn)) throw new TypeError();
        var arrays = slice.call(arguments,1);
        var length = Asdf.A.max(Asdf.A.pluck(arrays, 'length'));
        var results = new Array(length);
        for (var i = 0; i < length; i++) results[i] = fn.apply(this,Asdf.A.pluck(arrays, "" + i));
        return results;
    }

    var complement = before(curry(compose, $_.Core.op["!"]),exisFunction);




	$_.O.extend($_.F, {
		identity: identity,
		bind: bind,
		curry: curry,
		delay: delay,
		defer: defer,
		wrap: wrap,
		before: before,
		after:after,
		methodize: methodize,
        functionize:functionize,
		compose:compose,
		composeRight:composeRight,
		extract:extract,
		partial: partial,
		or: or,
		and: and,
		then: then,
		orElse: orElse,
        guarded: guarded,
        sequence: sequence,
        cases:cases,
        overload:overload,
        errorHandler:errorHandler,
        trys:trys,
		asyncThen:asyncThen,
		asyncSequence:asyncSequence,
		toFunction:toFunction,
		async:async,
		when:when,
        curried:curried,
        debounce:debounce,
        throttle:throttle,
        once:once,
        memoize:memoize,
        periodize:periodize,
        annotate:annotate,
        getDef:getDef,
        converge:converge,
        zip:zip,
        nAry:nAry,
        complement:complement,
		alwaysFalse: toFunction(false),
		alwaysTrue:  toFunction(true),
		promise:promise
	}, true);

})(Asdf);
