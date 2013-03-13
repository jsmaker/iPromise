function IPromise() {
    'use strict';

    var Promise = function Promise(id, context, byForce) {

        if (!byForce && Promise.instances[id]) {
            return Promise.instances[id];
        }

        var waiting = {status: 'waiting'};
        var error = {status: 'broken'};
        var future_value = waiting;
        var done = [];
        var broke = [];
        var promise;

        function setStatus(is_fulfilled, newValue) {
            if (future_value !== waiting) { return promise; }
            if (is_fulfilled) {
                future_value = newValue;
            } else {
                error.data = newValue;
                future_value = error;
            }
            return invoke(is_fulfilled ? done : broke);
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
                if (future_value === waiting) { return 'waiting'; }
                if (future_value === error) { return 'broken'; }
                return 'fulfilled';
            },
            then: function (sxs, fail, context) {
                if(sxs) {done.push([sxs, context]);}
                if(fail) {broke.push([fail, context]);}
                if (promise.status() === 'waiting') { return promise;}
                return invoke(promise.status() === 'broken' ? broke : done);
            },
            fail: function (fail, context) { return promise.then(null, fail, context); },
            done: function (sxs, context) { return promise.then(sxs, null, context); },
            always: function (always, context) { return promise.then(always, always, context); },
            timeout: function (time, errorData) {
                setTimeout(promise.$break.$with(errorData), time);
                return promise;
            }
        };

        promise.$fulfill = setStatus.bind(promise, true);
        promise.$break = setStatus.bind(promise, false);
        promise.$fulfill.$with = function (value) {
            return promise.$fulfill.bind(null, value);
        };
        promise.$break.$with = function (value) {
            return promise.$break.bind(null, value);
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
            return whenPromise.$fulfill(values);
        }
        var advanceWhenState = function (promise, value) {
            if (promise.status() === 'broken') {
                was_error = true;
            }
            values.push(value);
            if (promises.length === values.length) {
                return was_error ? whenPromise.$break(values) : whenPromise.$fulfill(values);
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
