function Valuable(value, lock) {
    lock = !!lock;
    var $ = function (newValue, promise) {
        if (arguments.length > 2) {
            value = !lock ? Array.prototype.slice.call(arguments) : value;
            lock  = !lock ? true : lock;
        } else {
            value = !lock && newValue !== undefined ? newValue : value;
            lock  = !lock ? !!newValue : lock;
        }
        return value;
    };
    $.get = function(){return value;}
    return $;
}


describe('Test Helpers', function() {

    describe('Valuable', function() {
        var value;

        beforeEach(function() {
            value = Valuable('TEST');
        });

        it('should be define', function() {
            expect(Valuable).toBeDefined();
        });

        it('should return a function', function() {
            expect(typeof value === 'function').toBe(true);
        });

        it('should return a function with get function', function() {
            expect(typeof value.get === 'function').toBe(true);
        });

        describe('Valuable instance', function() {

            it('should return the value that is passed in', function() {
                expect(value()).toBe('TEST');
                expect(value()).toBe('TEST');
                expect(value()).toBe('TEST');
            });

            it('should change the return value if called with a defined value', function() {
                expect(value()).toBe('TEST');
                expect(value('NEW TEST')).toBe('NEW TEST');
                expect(value()).toBe('NEW TEST');
            });

            it('should return an array if called with more then two arguments', function() {
                expect(value()).toBe('TEST');
                expect(value('NEW TEST', 'NEW TEST2', 1)[0]).toBe('NEW TEST');
                expect(value()[1]).toBe('NEW TEST2');
            });

        });

    });

});

describe('Api check', function() {

    describe('IPromise', function() {

        it('should be define', function() {
            expect(IPromise).toBeDefined();
        });

        it('should return a Promise Constructor', function() {
            var Promise = IPromise();
            expect(Promise.prototype).toBeDefined();
            expect(Promise.name).toBe('Promise');
        });

    });

    describe('Promise Constructor', function() {
        var Promise;

        beforeEach(function() {
            Promise = IPromise();
        });

        it('should have a when method', function() {
            expect(Promise.when).toBeDefined();
        });

        it('should have an instances object', function() {
            expect(Promise.instances).toBeDefined();
        });

    });

});

describe('Promise', function() {

    describe('creation of new Promise', function() {
        var Promise;

        beforeEach(function() {
            Promise = IPromise();
        });

        it('should return a new promise object', function() {
            expect(Promise().constructor).toBe(Promise);
        });

        it('should hold the id of the promise', function() {
            expect(Promise('ID').id).toBe('ID');
        });

        it('should return a new promise object', function() {
            expect(Promise().type).toBe('Promise');
        });

        it('should hold anonymous id if called with no id', function() {
            expect(Promise().id).toBe('anonymous');
        });

        it('should reurn new promise if called with no id', function() {
            var promiseA = Promise();
            var promiseB = Promise()
            expect(promiseA).not.toBe(promiseB);
        });

        it('should store the promise instance if called with id', function() {
            var promise = Promise('test-promise');
            expect(promise).toBe(Promise.instances['test-promise']);
        });

        it('should return the same promise if called with the same id', function() {
            var promiseA = Promise('test-promise');
            var promiseB = Promise('test-promise');
            expect(promiseA).toBe(promiseB);
        });

        it('should return new promise for each id', function() {
            var promiseA = Promise('test-promise1');
            var promiseB = Promise('test-promise2');
            expect(promiseA).not.toBe(promiseB);
        });

        it('should create a new promise if called with the same id and force parameter', function() {
            var promiseA = Promise('test-promise');
            var promiseB = Promise('test-promise', null, true);
            expect(promiseA).not.toBe(promiseB);
        });

        it('should keep the forced promise for the next call with the same id', function() {
            var promiseA = Promise('test-promise');
            var promiseB = Promise('test-promise', null, true);
            var promiseC = Promise('test-promise');
            expect(promiseA).not.toBe(promiseC);
            expect(promiseA).not.toBe(promiseB);
            expect(promiseB).toBe(promiseC);
        });

    });


    describe('Promise Api', function() {
        var Promise;
        var promise;

        var async = new AsyncSpec();

        beforeEach(function() {
            Promise = IPromise();
            Promise('TEST');
        });

        async.it('should not be resolved twice', function(done) {

            Promise('TEST').always(function(value){
                expect(value).toBe('TEST VALUE A');
                setTimeout(done, 10);
            });

            Promise('TEST').resolve('TEST VALUE A');
            Promise('TEST').reject('TEST VALUE A');

        });

        async.it('should resolved with the value passed to the resolve #done', function(done) {

            Promise('TEST').done(function(value){
                expect(value).toBe('TEST VALUE A');
                done();
            });

            Promise('TEST').resolve('TEST VALUE A');

        });

        async.it('should resolved with the value passed to the resolve #then', function(done) {

            Promise('TEST').then(function(value){
                expect(value).toBe('TEST VALUE A');
                done();
            }, function(){
                expect(false).toBe(true);
                done();
            });

            Promise('TEST').resolve('TEST VALUE A');

        });

        async.it('should resolved with the value passed to the resolve #always', function(done) {

            Promise('TEST').always(function(value){
                expect(value).toBe('TEST VALUE A');
                done();
            });

            Promise('TEST').resolve('TEST VALUE A');
        });

        async.it('should break with the promise error object #fail', function(done) {

            Promise('TEST').fail(function(value){
                expect(value.status).toBe('rejected');
                expect(value.data).toBe('TEST VALUE A');
                done();
            });

            Promise('TEST').reject('TEST VALUE A');

        });

        async.it('should break with the promise error object #then', function(done) {

            Promise('TEST').then(function(value){
                expect(false).toBe(true);
                done();
            },function(value){
                expect(value.status).toBe('rejected');
                expect(value.data).toBe('TEST VALUE A');
                done();
            });

            Promise('TEST').reject('TEST VALUE A');

        });

        async.it('should break with the promise error object #always', function(done) {

            Promise('TEST').always(function(value){
                expect(value.status).toBe('rejected');
                expect(value.data).toBe('TEST VALUE A');
                done();
            });

            Promise('TEST').reject('TEST VALUE A');
        });

        it('should report status with rejected', function() {

            var value = Valuable(false);

            Promise('TEST').always(value);

            waitsFor(value.get);

            var status1 = Promise('TEST').status();
            Promise('TEST').reject('TEST VALUE A');
            var status2 = Promise('TEST').status();

            runs(function() {
                expect(status1).toBe('pendeing');
                expect(status2).toBe('rejected');
            });
        });

        it('should report status with resolved', function() {

            var value = Valuable(false);

            Promise('TEST').always(value);

            waitsFor(value.get);

            var status1 = Promise('TEST').status();
            Promise('TEST').resolve('TEST VALUE A');
            var status2 = Promise('TEST').status();

            runs(function() {
                expect(status1).toBe('pendeing');
                expect(status2).toBe('resolved');
            });
        });

        it('should should break after setTimeout #0', function() {

            var value = Valuable(false);

            Promise('TEST').always(value);

            waitsFor(value.get);

            Promise('TEST').timeout(0, 'Time is out!');

            runs(function() {
                expect(value().status).toBe('rejected');
                expect(value().data).toBe('Time is out!');
            });
        });


        it('should call all done callbacks when resolved', function() {

            var values = [];
            function counter(value){
                values.push(value);
            }

            Promise('TEST').done(counter).done(counter).done(counter);

            waitsFor(function(){
                return values.length === 4;
            }, 'all callbacks to be called');

            Promise('TEST').resolve('TEST VALUE A');

            Promise('TEST').done(counter);

            runs(function() {
                expect(values.length).toEqual(4);
                values.forEach(function(value){
                    expect(value).toBe('TEST VALUE A');
                });
            });
        });

        it('should call all fail callbacks when resolved', function() {

            var values = [];
            function counter(value){
                values.push(value);
            }

            Promise('TEST').fail(counter).fail(counter).fail(counter);

            waitsFor(function(){
                return values.length === 4;
            }, 'all callbacks to be called');

            Promise('TEST').reject('TEST VALUE A');

            Promise('TEST').fail(counter);

            runs(function() {
                expect(values.length).toEqual(4);
                values.forEach(function(err){
                    expect(err.status).toBe('rejected');
                    expect(err.data).toBe('TEST VALUE A');
                });
            });
        });


    });

});

describe('Promise.when', function() {
    var Promise;
    var promiseA;
    var promiseB;


    var async = new AsyncSpec();

    beforeEach(function() {
        Promise = IPromise();
        promiseA = Promise('A');
        promiseB = Promise('B');
    });

    it('test variables should be Promises', function() {
        expect(promiseA.constructor).toBe(Promise);
        expect(promiseB.constructor).toBe(Promise);
    });

    it('should return a Promise', function() {
        var promise = Promise.when('AB', [promiseA]);
        expect(promise.constructor).toBe(Promise);
    });

    async.it('should be resolved with array of the promises values', function(done) {

        Promise.when('AB', [promiseA, promiseB]).always(function(valueA, valueB){
            expect(valueA).toBe('TEST VALUE A');
            expect(valueB).toBe('TEST VALUE B');
            done();
        });

        promiseA.resolve('TEST VALUE A');
        promiseB.resolve('TEST VALUE B');

    });

    async.it('should fulfill with only one promise resolved', function(done) {

        Promise.when('AB', [promiseA]).always(function(value){
            expect(value).toBe('TEST VALUE A');
            done();
        });

        promiseA.resolve('TEST VALUE A');

    });

    async.it('should break with only one promise breaks', function(done) {

        Promise.when('AB', [promiseA]).always(function(value){
            expect(value.status).toBe('rejected');
            expect(value.data[0].data).toBe('TEST VALUE A');
            expect(value.data[0].status).toBe('rejected');
            done();
        });

        promiseA.reject('TEST VALUE A');

    });

    async.it('should break if one of the promises breaks #1', function(done) {
        promiseA.reject('TEST VALUE A');
        promiseB.resolve('TEST VALUE B');

        Promise.when('AB', [promiseA, promiseB]).always(function(value){
            expect(value.status).toBe('rejected');
            done();
        });

    });

    async.it('should break if one of the promises breaks #2', function(done) {

        Promise.when('AB', [promiseA, promiseB]).always(function(value){
            expect(value.status).toBe('rejected');
            expect(value.data[0]).toBe('TEST VALUE A');
            expect(value.data[1].status).toBe('rejected');
            expect(value.data[1].data).toBe('TEST VALUE B');
            done();
        });

        promiseA.resolve('TEST VALUE A');
        promiseB.reject('TEST VALUE B');

    });

});


describe('Useability Tests', function(){

  describe('resolve.$with', function(){

    var async = new AsyncSpec();

    async.it('should be resolved with the value passed to the $with function', function(done){
        var Promise = IPromise();

        Promise.when(
            'done to write all tests',
            [
                Promise('to write more tests'),
                Promise('to write even more tests')
            ]).done(function(valueA, valueB){
                expect(valueA).toBe('done to write 5 tests');
                expect(valueB).toBe('done to write more 15 tests');
                done();
            });


        setTimeout(Promise('to write more tests').resolve.$with('done to write 5 tests'), 10);
        setTimeout(Promise('to write even more tests').resolve.$with('done to write more 15 tests'), 20);

    });


  });

  describe('Future value transformation', function(){

    var async = new AsyncSpec();

    async.it('should use transform the promise future value and wait for promises to fulfill before continue to the next call', function(done){

        var Promise = IPromise();

        Promise('A').resolve('TEST VALUE');

        Promise('A').done(function(value){

             expect(value).toBe('TEST VALUE');

        }).done(function(value){

            expect(value).toBe('TEST VALUE');

            return Promise.when('test',[Promise('B'), Promise('C')]).done(function(valueA, valueB){

                var args = Array.prototype.slice.call(arguments, 0, arguments.length-1);
                args.unshift(value);

                expect(args.length).toBe(3);
                expect(args[0]).toBe('TEST VALUE');
                expect(args[1]).toBe('VALUE OF B');
                expect(args[2]).toBe('VALUE OF C');

                return Promise.argsArray(args);

            });

        }).done(function(valueA, valueB, valueC){

            expect(valueA).toBe('TEST VALUE');
            expect(valueB).toBe('VALUE OF B');
            expect(valueC).toBe('VALUE OF C');

            return valueA + ' & ' + valueB + ' & ' + valueC;

        }).done(function(value){

            expect(value).toBe('TEST VALUE & VALUE OF B & VALUE OF C');

            return 'You are pendeing for: ' + value;

        });

        setTimeout(Promise('B').resolve.$with('VALUE OF B'), 10);
        setTimeout(Promise('C').resolve.$with('VALUE OF C'), 20);

        Promise('A').done(function(value){
            expect(value).toBe('You are pendeing for: TEST VALUE & VALUE OF B & VALUE OF C');
            done();
        });

        expect(Promise('A').status()).toBe('resolved');

    });


  });

});
