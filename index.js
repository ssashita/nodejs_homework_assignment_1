const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');

//Server should respond to all requests with a string
const httpserver = http.createServer((req,res)=>{
    unifiedserver(req, res);
});
const httpsserveroptions = {};
httpsserveroptions.key = fs.readFileSync('./https/key.pem');
httpsserveroptions.cert = fs.readFileSync('./https/cert.pem');

const httpsserver = https.createServer(httpsserveroptions, (req,res)=>{
    unifiedserver(req, res);
});

var unifiedserver = (req, res)=>{
    //Get the url and parse it
    var parsedurl = url.parse(req.url,true);

    //Get the path 
    var path = parsedurl.pathname;
    var trimmedpath = path.replace(/^\/+|\/+$/g,'')

    //GET QUERY string as object
    const querystringobject=parsedurl.query;
    //get the http method
    const method=req.method.toLowerCase()
    //get headers as an object
    const headers = req.headers;
    //Get payload if any
    const stringdecoder =  new StringDecoder('utf-8');
    var buffer='';
    req.on('data',data=>{
        buffer += stringdecoder.write(data);
    });
    req.on('end',()=>{
        buffer += stringdecoder.end();

        var chosenHandler = (typeof(router[trimmedpath]) !== 'undefined')?router[trimmedpath]:handlers.notfound;
        var data = {
            'trimmedpath':trimmedpath,
            'querstringobject': querystringobject,
            'method':method,
            'headers':headers,
            'payload':buffer
        }
        chosenHandler(data, (statuscode, payload)=>{
            statuscode = typeof(statuscode)=='number'?statuscode:200;
            payload = typeof(payload)=='object'?payload:{};
            var payloadString = JSON.stringify(payload);

            res.setHeader('Content-Type','application/json');
            res.writeHead(statuscode);
            res.end(payloadString);
            console.log('Request received on path:', trimmedpath, 'with method',method,'with query params',querystringobject);
            console.log('with headers',headers);
            console.log('with this payload',buffer);
            console.log(' response payload is',payloadString);
            console.log('status code in response',statuscode);
        })
        //send the response
        //res.end('Hello World\n');

        //log what path was requested
        //console.log('Request received on path:', trimmedpath, 'with method',method,'with query params',querystringobject);
        //console.log('with headers',headers);
        //console.log('with this payload',buffer);
    });
    //send the response
    //res.end('Hello World\n');

    //log what path was requested
    //console.log('Request received on path:', trimmedpath, 'with method',method,'with query params',querystringobject);
    //console.log('with headers',headers);

};
//Start the server and have it listen on port 3000
httpserver.listen(config.httpport, ()=>{
    console.log("The server is listening on "+config.httpport+" in "+config.envName+" mode");
});
httpsserver.listen(config.httpsport, ()=>{
    console.log("The https server is listening on "+config.httpsport+" in "+config.envName+" mode");
});
//Handlers
var handlers = {}
handlers.ping = (data, callback)=>{
    //Callback a http status code and a payload object
    callback(200,{'name':'ping handler', 'address':'blah blah'});
}
handlers.hello = (data, callback)=>{
    //Callback a http status code and a payload object
    callback(200,{'welcomeMsg':'Welcome to my app!'});
}
handlers.notfound = (data,callback)=>{
    callback(404);
}
//Define a request router
var router = {
    'ping':handlers.ping,
    'hello':handlers.hello
}
