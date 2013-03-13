function IPromise() {
    'use strict';

    var Promise = function Promise(id, context, byForce) {

        if (!byForce && Promise.instances[id]) {
            return Promise.instances[id];
        }

        var pendeing = {status: 'pendeing'};
        var error = {status: 'rejected'};
        var future_value = pendeing;
        var done = [];
        var broke = [];
        var promise;

        function setStatus(is_resolved, newValue) {
            if (future_value !== pendeing) { return promise; }
            if (is_resolved) {
                future_value = newValue;
            } else {
                error.data = newValue;
                future_value = error;
            }
            return invoke(is_resolved ? done : broke);
        }

        function callToFutureValue(callTo, ctx) {
            if (callTo) {
                if (future_value.isBreaker && future_value.isBreaker() === 'breaker') {
                    future_value.push(promise);
                    invoke.lastValue = callTo[0].apply(callTo[1] || ctx, future_value);
                    future_value.pop();
                } else {
                    invoke.lastValue = callTo[0].call(callTo[1] || ctx, future_value, promise);
                }
                future_value = invoke.lastValue !== undefined ? invoke.lastValue : future_value;
            }
        }

        function invoke(callbacks, ctx) {
            function next() {
                if (arguments.length) {
                    future_value = Promise.argsArray(Array.prototype.slice.call(arguments, 0, arguments.length - 1));
                }
                setTimeout(function () {
                    callToFutureValue(callbacks[invoke.index++], ctx);
                    if (invoke.index < callbacks.length) {
                        if (invoke.lastValue && invoke.lastValue.type === 'Promise') {
                            return invoke.lastValue.always(next);
                        }
                        next();
                    } else {
                        invoke.index = -1;
                        done.length = 0;
                        broke.length = 0;
                    }
                }, 0);
            }
            if (invoke.index === -1 && callbacks.length) {
                ctx = context || promise;
                invoke.index++;
                next();
            }
            return promise;
        }

        invoke.index = -1;
        invoke.lastValue = undefined;

        promise = {
            constructor: Promise,
            type: 'Promise',
            id: id ? id.toString() : 'anonymous',
            status: function () {
                if (future_value === pendeing) { return 'pendeing'; }
                if (future_value === error) { return 'rejected'; }
                return 'resolved';
            },
            then: function (sxs, fail, context) {
                if(sxs) {done.push([sxs, context]);}
                if(fail) {broke.push([fail, context]);}
                if (promise.status() === 'pendeing') { return promise;}
                return invoke(promise.status() === 'rejected' ? broke : done);
            },
            fail: function (fail, context) { return promise.then(null, fail, context); },
            done: function (sxs, context) { return promise.then(sxs, null, context); },
            always: function (always, context) { return promise.then(always, always, context); },
            timeout: function (time, errorData) {
                setTimeout(promise.reject.$with(errorData), time);
                return promise;
            }
        };

        promise.resolve = setStatus.bind(promise, true);
        promise.reject = setStatus.bind(promise, false);
        promise.resolve.$with = function (value) {
            return promise.resolve.bind(null, value);
        };
        promise.reject.$with = function (value) {
            return promise.reject.bind(null, value);
        };

        return Promise.store(id, promise);
    };

    Promise.instances = {};

    Promise.store = function (id, promise) {
        if (id !== undefined && id !== null) {
            Promise.instances[id] = promise;
        }
        return promise;
    };

    Promise.when = function (id, promises, context) {
        promises = promises || [];
        var values = Promise.argsArray();
        var was_error = false;
        var i;
        var whenPromise = Promise(id, context);
        if (!promises.length) {
            return whenPromise.resolve(values);
        }
        var advanceWhenState = function (promise, value) {
            if (promise.status() === 'rejected') {
                was_error = true;
            }
            values.push(value);
            if (promises.length === values.length) {
                return was_error ? whenPromise.reject(values) : whenPromise.resolve(values);
            }
            return undefined;
        };
        for (i = 0; i < promises.length; i++) {
            promises[i].always(advanceWhenState.bind(null, promises[i]), context);
        }
        return whenPromise;
    };

    Promise.argsArray = function (array) {
        var args = array || [];
        args.isBreaker = function () {
            return 'breaker';
        };
        return args;
    };

    if (!Promise.name) {
        Promise.name = 'Promise';
    } //IE Fix

    return Promise;

}
