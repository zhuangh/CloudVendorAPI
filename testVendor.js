/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var googleapis = require('googleapis');
var OAuth2Client = googleapis.OAuth2Client;
var google_refresh_token = require('./google-refresh-token.js');
var TBVendorGoogleDriveAPI = require('./TBVendorGoogleDriveAPI.js');

// Use environment variables to configure oauth client.
// That way, you never need to ship these values, or worry
// about accidentally committing them
// var oauth2Client = new OAuth2Client(process.env.MIRROR_DEMO_CLIENT_ID, process.env.MIRROR_DEMO_CLIENT_SECRET, process.env.MIRROR_DEMO_REDIRECT_URL);

var config = require('./config.json');

var oauth2Client = new OAuth2Client(config.CLIENT_ID, config.CLIENT_SECRET,  config.REDIRECT_URL);
// config should be replaced by TBConstants 

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

    var refreshToken = '1/VgMZsjg-69BEP-3dAY7NINRGzXkoEtGuqGnQJpq5Lsg';
    // call TB Google API parameter is refreshToken get from DB, 
    // the Client information should stay in the API server 
    //
    // function cloudAccountInfo(vendor, APIcallback){
    // function cloudUploadFile(segment, APIcallback){
    // function cloudDownloadFile(segment, APIcallback){
    // function cloudCleanUpFile(segment, APIcallback){
    // function cloudDeleteFile(segment, APIcallback){


    var token_array = [ 
       refreshToken, 
       '0'
    ];

    segment = {
	//TBLocation: 'TBTrials/',
	TBLocation: '',
	vendorName : 'google-drive',
	name: 'text.txt',
        path:  './test1.txt',
        token: token_array 
    }; 

    console.log('token[0] '+ segment.token[0]);

    res.write("4001 port playing " + segment.token[0]);
    res.end();

    TBVendorGoogleDriveAPI.cloudAccountInfo(segment , function(err) {

	res.write('writing file ' + segment.path);

	if(err) {
	    console.log('err in cloud uploading @ Google Drive! '+ err);
	}
	else{
	    console.log('vendor free space: '+segment.freeSpace);
	
	}

    }); 


    TBVendorGoogleDriveAPI.cloudUploadFile(segment , function(err) {

	res.write('writing file ' + segment.path);

	if(err) {
	    console.log('err!!!')
//	    console.log('err in cloud uploading @ Google Drive! '+ err);
	}
    }); 



    TBVendorGoogleDriveAPI.cloudDownloadFile(segment , function(err) {

	res.write('writing file ' + segment.path);

	if(err) {
	    console.log('err!!!')
//	    console.log('err in cloud uploading @ Google Drive! '+ err);
	}
    }); 


    segment1 = {
	//TBLocation: 'TBTrials/',
	TBLocation: '',
	vendorName : 'google-drive',
	name: 'SS',
        path:  './SS.txt',
        token: token_array 
    }; 


    TBVendorGoogleDriveAPI.cloudDeleteFile(segment1 , function(err) {

	res.write('delete file ' + segment1.path);

	if(err) {
	    console.log('err!!!')
//	    console.log('err in cloud uploading @ Google Drive! '+ err);
	}
    }); 

    segment2 = {
	//TBLocation: 'TBTrials/',
	TBLocation: '',
	vendorName : 'google-drive',
	name: 'text_delete.txt',
        path:  './SS.txt',
        token: token_array, 
	uploadDone : true 
    }; 



    TBVendorGoogleDriveAPI.cloudCleanUpFile( segment2 , function(err) {

	res.write('Clean up file ' + segment2.path);

	if(err) {
	    console.log('err!!!')
//	    console.log('err in cloud uploading @ Google Drive! '+ err);
	}
    }); 







    /*
    if (!oauth2Client.credentials) {
	if( true  ){
	    google_refresh_token.refreshGoogleToken(refreshToken, config.CLIENT_ID, config.CLIENT_SECRET, function(err, cb, res_null  ){
		if(err){console.log("wrong in refreshing");}
		else{
		    console.log("google refreshing "+cb);

		    // updated 
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
    */

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

