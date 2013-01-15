iPromise
========

#Small powerful and no dependencies promises

```javascript

Promise('do something').done(function(){
  ...
}).fail(function(){
  ...
}).then(function(data){
  ...
},function(error){
  ...
}).always(function(value){
  ...
}).setTimeout(1000, 'the promise has been breaked.');


/// somewhere else in the code...
///since we gave the Promise an id we can get it any where.
Promise('do something').$fulfill('the promise has been successfully fulfilled. we are done!');

```

##Promising fetch resources with ajax demo.

```javascript

//very simple ajax request function
function ajax_get(url){
  //create a promise with the url as an id
  var promise = Promise(url);
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.onload = function(e){
    //fulfill the promise with the data
    promise.$fulfill(xhr.responseText);
  }    
  xhr.error = function(e){
     //break the promise with the error
     promise.$break(e);
  }
  xhr.send();
  //in this library you dont have to return your promises you can reffer to them by ther 
  return promise;
}

//using Promise to fetch resources.

Promise.when('resources', [
  ajax_get('url/lang-en.json'),
  ajax_get('url/table.json'),
  ajax_get('url/template.html')
]);


/// somewhere else in the code...

Promise('resources').done(function(lang, table, template){
  ...
}).fail(function(error){
  ...
});


```
