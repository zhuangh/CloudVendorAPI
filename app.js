/**
 * Module dependencies.
 */

var express = require('express')
    , http = require('http')
    , googleapis = require('googleapis')
    , OAuth2Client = googleapis.OAuth2Client;

var google_refresh_token = require('./google-refresh-token.js');

// Use environment variables to configure oauth client.
// That way, you never need to ship these values, or worry
// about accidentally committing them
// var oauth2Client = new OAuth2Client(process.env.MIRROR_DEMO_CLIENT_ID, process.env.MIRROR_DEMO_CLIENT_SECRET, process.env.MIRROR_DEMO_REDIRECT_URL);

var config = require('./config.json');


var oauth2Client = new OAuth2Client(config.CLIENT_ID, config.CLIENT_SECRET,  config.REDIRECT_URL);

var app = express();

// all environments
app.set('port', 4001);
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

var success = function (data) {
    console.log('success', data);
};
var failure = function (data) {
    console.log('failure', data);
};
var gotToken = function () {
    googleapis
        .discover('mirror', 'v1')
        .execute(function (err, client) {
            if (!!err) {
                failure();
                return;
            }
            console.log('mirror client', client);
            listTimeline(client, failure, success);
            insertHello(client, failure, success);
            insertContact(client, failure, success);
            insertLocation(client, failure, success);
        });
};

// send a simple 'hello world' timeline card with a delete option
var insertHello = function (client, errorCallback, successCallback) {
    client
        .mirror.timeline.insert(
        {
            "text": "Hello world",
            "callbackUrl": "https://mirrornotifications.appspot.com/forward?url=http://localhost:8081/reply",
            "menuItems": [
                {"action": "REPLY"},
                {"action": "DELETE"}
            ]
        }
    )
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                successCallback(data);
        });
};

// send a simple 'hello world' timeline card with a delete option
var insertLocation = function (client, errorCallback, successCallback) {
    client
        .mirror.timeline.insert(
        {
            "text": "Let's meet at the Hacker Dojo!",
            "callbackUrl": "https://mirrornotifications.appspot.com/forward?url=http://localhost:8081/reply",
            "location": {
                "kind": "mirror#location",
                "latitude": 37.4028344,
                "longitude": -122.0496017,
                "displayName": "Hacker Dojo",
                "address": "599 Fairchild Dr, Mountain View, CA"
            },
            "menuItems": [
                {"action":"NAVIGATE"},
                {"action": "REPLY"},
                {"action": "DELETE"}
            ]
        }
    )
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                successCallback(data);
        });
};


var insertContact = function (client, errorCallback, successCallback) {
    client
        .mirror.contacts.insert(
        {
            "id": "emil10001",
            "displayName": "emil10001",
            "iconUrl": "https://secure.gravatar.com/avatar/bc6e3312f288a4d00ba25500a2c8f6d9.png",
            "priority": 7,
            "acceptCommands": [
                {"type": "REPLY"},
                {"type": "POST_AN_UPDATE"},
                {"type": "TAKE_A_NOTE"}
            ]
        }
    )
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                successCallback(data);
        });
};
var listTimeline = function (client, errorCallback, successCallback) {
    client
        .mirror.timeline.list()
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                successCallback(data);
        });
};
var grabToken = function (code, errorCallback, successCallback) {
    oauth2Client.getToken(code, function (err, tokens) {
        if (!!err) {
            errorCallback(err);
        } else {
            console.log('tokens', tokens);
            oauth2Client.credentials = tokens;
            successCallback();
        }
    });
};

app.get('/', function (req, res) {

    refreshToken = 'HIDDEN';
    
    /*
    oauth2Client.credentials = {
        token_type: 'Bearer',
        expires_in: 3599 
    };
    */

    /*
    oauth2Client.credentials = {

      token_type: 'Bearer',
      expires_in: 3599

    };
    */



    if (!oauth2Client.credentials) {

	if( true  ){
	    google_refresh_token.refreshGoogleToken(refreshToken, config.CLIENT_ID, config.CLIENT_SECRET, 
						    function(err, cb, res_null  ){
							if(err){console.log("wrong in refreshing");}
							else{

							    console.log("google refreshing "+cb);

							    oauth2Client.credentials = {
								access_token: cb.accessToken, token_type: 'Bearer', expires_in: cb.expiresIn 
							    };

							    console.log(oauth2Client.credentials);

							    googleapis.discover('drive', 'v2').execute(function(err, client) {
								if (!!err) {
								    failure();
								    return;
								}
								data_type = 'application/octet-stream';
								content = '101';
								client.drive.files.insert({ title: 'SSOkXXXZZZaaAA'} ).withMedia(data_type ,  content)
								.withAuthClient( oauth2Client ).execute();
							    });
							    res.write('Glass Mirror API with Node');
							    res.end();
							}
						    });

	}
	else{
        // generates a url that allows offline access and asks permissions
        // for Mirror API scope.
	
        var url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: config.SCOPE 
//	    approval_prompt: 'force'
	});
	
	console.log(config.REDIRECT_URL);
        res.redirect(url);
	}
    } else {
        // gotToken();
	console.log("not need to auth?");
	console.log(oauth2Client.credentials);

	googleapis.discover('drive', 'v2').execute(function(err, client) {
	    if (!!err) {
		failure();
		return;
	    }
	    data_type = 'application/octet-stream';
	    content = '101';
	    client.drive.files.insert({ title: 'OkXXXZZZaaAA'} ).withMedia(data_type ,  content)
	    .withAuthClient( oauth2Client ).execute(console.log  );
	});
	res.write('Glass Mirror API with Node');
	res.end();
    }

});

app.get('/oauth2callback', function (req, res) {
    // if we're able to grab the token, redirect the user back to the main page
    grabToken(req.query.code, failure, function () {
        res.redirect('/');
    });
});
app.post('/reply', function(req, res){
    console.log('replied',req);
    res.end();
});
app.post('/location', function(req, res){
    console.log('location',req);
    res.end();
});

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
