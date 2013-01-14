function IPromise(){
	'use strict';

	var Promise = function Promise(id, context, byforce) {

		if (!byforce && Promise.instances[id]){return Promise.instances[id];}

		var _waiting = {status: 'waiting'};
		var _error = {status: 'breaked'};
		var _future_value_ = _waiting;
		var _sxs = [];
		var _err = [];

		var promise = {
			constructor:Promise,
			_id : id ? id.toString() : 'anonymous',
			$fulfill : setStatus.bind(promise, true),
			$break : setStatus.bind(promise, false),
			status:function(){
				if (_future_value_ === _waiting) { return 'waiting'};
				if (_future_value_ === _error) { return 'breaked'};
				return 'fulfilled';
			},
			then : function (sxs, fail, context) {
				sxs && _sxs.push([sxs, context]);
				fail && _err.push([fail, context]);
				if (promise.status() === 'waiting') { return promise;}
				return invoke(promise.status() === 'breaked' ? _err : _sxs);
			},
			fail:function(fail, context){ return promise.then(null, fail, context); },
			done:function(sxs, context){ return promise.then(sxs, null, context); },
			always:function(always, context){ return promise.then(always, always, context);},
			setTimeout: function(time, errorData){setTimeout(promise.$break, time, errorData); return promise;}
		};

		promise.$fulfill.$with = function(value){
			return promise.$fulfill.bind(null, value);
		}
		promise.$break.$with = function(value){
			return promise.$break.bind(null, value);
		}

		function setStatus(is_fulfilled, newValue) {
			if (_future_value_ !== _waiting) { return promise; }
			_future_value_ = is_fulfilled ? newValue : (_error.data = newValue, _error);
			return invoke(is_fulfilled ? _sxs : _err);
		}

		function callToFutureValue(callTo, ctx){
			if (callTo) {
				if (_future_value_.isBreaker && _future_value_.isBreaker() === 'breaker' ) {
					_future_value_.push(promise);
					invoke.lastValue = callTo[0].apply(callTo[1] || ctx, _future_value_);
					_future_value_.pop();
				} else {
					invoke.lastValue = callTo[0].call(callTo[1] || ctx, _future_value_, promise);
				}
				_future_value_ = invoke.lastValue !== undefined ? invoke.lastValue : _future_value_;
			}
		}

		function invoke(callbacks, ctx) {
			if(invoke.index === -1 && callbacks.length) {
				ctx = context || promise;
				invoke.index++;
				next();
			}
			function next(){
				if(arguments.length){
					_future_value_ = Promise.argsArray(Array.prototype.slice.call(arguments, 0, arguments.length-1));
				}
				setTimeout( function(){
					callToFutureValue(callbacks[invoke.index++], ctx);
					if (invoke.index < callbacks.length) {
						invoke.lastValue && invoke.lastValue.constructor && invoke.lastValue.constructor.name === 'Promise' ?
							invoke.lastValue.always(next) :
							next();
					} else {
						invoke.index = -1;
						_sxs.length = 0;
						_err.length = 0;
					}
				}, 0 );
			}
			return promise;
		}

		invoke.index = -1;
		invoke.lastValue = undefined;

		return Promise.store(id, promise);
	};

	Promise.instances = {};

	Promise.store = function(id, promise){
		if (id !== undefined && id !== null) {Promise.instances[id] = promise};
		return promise;
	};

	Promise.when = function(id, promises, context) {
		promises = promises || [];
		var values = Promise.argsArray();
		var was_error = false;
		var whenPromise = Promise(id, context);
		if(!promises.length){
			return whenPromise.$fulfill(values);
		}
		var advanceWhenState = function(promise, value){
			if (promise.status() === 'breaked') { was_error = true }
			values.push(value);
			if (promises.length === values.length) {
				return was_error ? whenPromise.$break(values) : whenPromise.$fulfill(values);
			}
		}
		for (var i = 0; i < promises.length; i++) {
			promises[i].always(advanceWhenState.bind(null, promises[i]), context);
		}
		return whenPromise;
	};

	Promise.argsArray = function(array){
		var args = array||[];
		args.isBreaker = function(){
			return 'breaker';
		};
		return args;
	};

	if(!Promise.name){Promise.name = 'Promise';} //IE Fix

	return Promise;

}
