

var http = require('http');
var googleapis = require('googleapis');
var OAuth2Client = googleapis.OAuth2Client;
var fs = require("fs");
var path = require("path");

var config = require('./config.json');
var request = require('request');

/**
 * @param {String} refreshToken is the refresh token returned from the
 *   authorization code exchange.
 * @param {String} clientId is the client_id obtained during application registration.
 * @param {String} clientSecret is the client secret obtained during the
 *   application registration.
 * @param {Function} cb(err, {accessToken, expiresIn, idToken}, response);
 * MIT License
 */



function refreshGoogleToken(refreshToken, clientId, clientSecret, cb) {
  request.post('https://accounts.google.com/o/oauth2/token', {
    form: {
      refresh_token: refreshToken
    , client_id: clientId
    , client_secret: clientSecret
    , grant_type: 'refresh_token'
    }
  , json: true
  }, function (err, res, body) {
    // `body` should look like:
    // {
    //   "access_token":"1/fFBGRNJru1FQd44AzqT3Zg",
    //   "expires_in":3920,
    //   "token_type":"Bearer",
    // }
      if (err) {
	  console.log('error in refreshing: '+err); 
	  return cb(err, body, res); 
      }
      if (parseInt(res.statusCode / 100, 10) !== 2) {
	  if (body.error) {
	      console.log('body wrong:'+ body.error);
	      return cb(new Error(res.statusCode + ': ' + (body.error.message || body.error)), body, res);
	  }
	  if (!body.access_token) {
	      console.log('now access_token');
	      return cb(new Error(res.statusCode + ': refreshToken error'), body, res);
	  }
	  console.log(( res.statusCode / 100, 10));
	  return cb(null, body, res);
      }
      cb(null, {
	  accessToken: body.access_token
	  , expiresIn: body.expires_in
	  , expiresAt: +new Date + parseInt(body.expires_in, 10)
	  , idToken: body.id_token
      }, res);
  });
}

// ----
var clientID = config.GoogleDrive.CLIENT_ID; 
var clientSecret = config.GoogleDrive.CLIENT_SECRET;
var clientRedirectURL = config.GoogleDrive.REDIRECT_URL;

// global authorization for google-drive api 
var oauth2Client = new OAuth2Client(clientID,
				    clientSecret, 
				    clientRedirectURL ) ;



function cloudAccountInfo( segment, APIcallback ){
    // https://developers.google.com/drive/v2/reference/about
    refreshGoogleToken(segment.token[0], 
		       clientID, 
		       clientSecret,  
		       function(err, cb, res_null  ){
			   if(err){
			       console.log("wrong in refreshing");
			       APIcallback(err);
			   }
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
				       APIcallback(err);
				   }

				   console.log("Getting info from Google Drive");
				   //data_type = 'application/octet-stream';
				   //client.drive.files.list().withAuthClient(oauth2Client).execute(console.log);
				   // accountInfo = {};
				   client.drive.about.get().withAuthClient(oauth2Client).execute( function(err, accountInfo){
				       if(err) {console.log( 'err in accountInfo: \n'+err);} 
				       else{
					   // console.log(accountInfo);
					   /*
					      quotaBytesTotal longThe total number of quota bytes.bytes
					      quotaBytesUsed longThe number of quota bytes used by Google Drive.Drive
					      quotaBytesUsedAggregate longThe number of quota bytes used by all Google apps (Drive, Picasa, etc.).etc
					      quotaBytesUsedInTrash longThe number of quota bytes used by trashed items.
					      */
					   segment.freeSpace = accountInfo.quotaBytesTotal - accountInfo.quotaBytesUsedAggregate ; 
					   //accountInfo.quota-accountInfo.usedQuota;
					   segment.connected = true;
					   console.log('After getting Info:\n '+ segment.freeSpace);
					   APIcallback();
				       }
				   });
			       });
			   }
		       });
}


// function cloudUploadFile( refreshToken , accessToken , file ){
function cloudUploadFile( segment, APIcallback ){
    // refreshToken = '1/VgMZsjg-69BEP-3dAY7NINRGzXkoEtGuqGnQJHidden';
//    refreshGoogleToken(segment.token[0], config.CLIENT_ID, config.CLIENT_SECRET,  function(err, cb, res_null  ){
    refreshGoogleToken(segment.token[0], 
		       clientID, 
		       clientSecret,  
		       function(err, cb, res_null  ){
	if(err){
	    console.log("wrong in refreshing");
	    APIcallback(err);
	}
	else{
	    // updated 
	    oauth2Client.credentials = {
		access_token: cb.accessToken, token_type: 'Bearer', expires_in: cb.expiresIn 
	    };

	    console.log(oauth2Client.credentials);

	    googleapis.discover('drive', 'v2').execute(function(err, client) {
		if (!!err) {
		    failure();
		    APIcallback(err);
		}


		fs.readFile( segment.path, function(err, file_content){
		    if(err){
			console.log(err);
			APIcallback(err);
		    }
		    else{	    	
			console.log("Uploading");
			TBAPI = 'TBAPI2';
			var params = {q : "title = '"+TBAPI+"'"};

			client.drive.files.list( params ).withAuthClient(oauth2Client).execute( function( err_request , file_list){
				if(err_request ) {
				    console.log(err_request );
				    APIcallback(err_request );
				}
				else{

			    
				    if(file_list.items.length == 0 ){

					file_type = 'application/vnd.google-apps.folder';
					client.drive.files.insert({ title: TBAPI, mimeType : file_type } )
						.withAuthClient( oauth2Client )
						.execute();


				    }
				    else { 
					if(file_list.items.length == 1){
					    console.log( "item size = "+file_list.items.length);
					    console.log( JSON.stringify(file_list, null, 4) ); 
					    console.log( ' parent ID ::: ' + file_list.items[0].parents[0].id); 
					    data_type = 'application/octet-stream';

					    var parents_list_id  ={};
					    parents_list_id["id"] = file_list.items[0].id;
					    var parents_list = [ parents_list_id  ] ; 
					    console.log( JSON.stringify( parents_list_id , null, 4 ) );
					    sbody = { title: segment.name , parents : parents_list_id };
					    console.log('body ' + JSON.stringify( sbody , null, 4 ) );


					    client.drive.files.insert({ title: segment.name , parents : parents_list } )
						.withMedia( data_type ,  file_content )
						.withAuthClient( oauth2Client )
						.execute();

					    APIcallback();
					}
					else{

					    APIcallback(err);
					}
				    }
				}
			});
						//*/
			}



		    // }
		});
	    }); // googleapis.discover
	}  //if-else err
    }); //
}


function cloudDownloadFile( segment, APIcallback ){
//    refreshGoogleToken(segment.token[0], config.CLIENT_ID, config.CLIENT_SECRET,  function(err, cb, res_null  ){
    refreshGoogleToken(segment.token[0], 
		       clientID, 
		       clientSecret,  
		       function(err, cb, res_null  ){
	if(err){
	    console.log("wrong in refreshing");
	    APIcallback(err);
	}
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
		    APIcallback(err);
		}
		var params = {q : "title = '"+segment.name+"'"};
		client.drive.files.list( params ).withAuthClient(oauth2Client).execute( function(err, file_list){
		    console.log(file_list.items[0].id);
		    console.log(file_list.items[0].downloadUrl);
		    download_url = file_list.items[0].downloadUrl; 

		    var option_get = {
			method: 'GET',
		        url : download_url,
		        headers: {
			  'Authorization' : 'Bearer '+ cb.accessToken
		        } 
		    };

		    request( option_get, function (err, res, body) {
			if(err) {
			    console.log(err);
			    APIcallback(err);
			}
			else{
			    console.log('!!!! Downloading ');
			    // console.log(res );

			    fs.writeFile(segment.path, res.body, function(err, stat){

				if(err){console.log('Bug Bug');}
				else{
				    console.log("writing... ");
				}
			    } );
			    APIcallback();
			}
		    });

		});
	    });
	}
    });
}


function cloudDeleteFile( segment, APIcallback ){

//    refreshGoogleToken(segment.token[0], config.CLIENT_ID, config.CLIENT_SECRET,  function(err, cb, res_null  ){
    refreshGoogleToken(segment.token[0], 
		       clientID, 
		       clientSecret,  
		       function(err, cb, res_null  ){
	if(err){
	    console.log("wrong in refreshing");
	    APIcallback(err);
	}
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
		    APIcallback(err);
		}
		var params = {q : "title = '"+segment.name+"'"};
		client.drive.files.list( params ).withAuthClient(oauth2Client).execute( function(err, file_list){
		    // check the file is existed 
		    console.log(file_list.items);
		    if(file_list.items.length == 1){
			console.log(file_list.items[0].id);
			var fileID = file_list.items[0].id;
			client.drive.files.delete( {'fileId': fileID} ).withAuthClient( oauth2Client ).execute(function(err, file_list){
			    if(err) {
				console.log('ERROR in deleting '+err);
				APIcallback(err);
			    }
			    else{
				console.log('deleting');
				APIcallback(null, 'delete done!');
			    }
			});
		    }
		});

	    });
	}
    });
}

function cloudCleanUpFile( segment, APIcallback ){

    if( segment.uploadDone == true){ 
//	refreshGoogleToken(segment.token[0], config.CLIENT_ID, config.CLIENT_SECRET,  function(err, cb, res_null  ){
	    refreshGoogleToken(segment.token[0], 
		       clientID, 
		       clientSecret,  
		       function(err, cb, res_null  ){
	    if(err){
		console.log("wrong in refreshing");
		APIcallback(err);
	    }
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
			APIcallback(err);
		    }
		    var params = {q : "title = '"+segment.name+"'"};
		    client.drive.files.list( params ).withAuthClient(oauth2Client).execute( function(err, file_list){

			if(file_list.items.length == 1){
			    console.log(file_list.items[0].id);
			    var fileID = file_list.items[0].id;
			    client.drive.files.delete( {'fileId': fileID} ).withAuthClient( oauth2Client ).execute(function(err, file_list){
				if(err) {
				    console.log('ERROR in deleting '+err);
				    APIcallback(err);
				}
				else{
				    console.log('deleting');
				    APIcallback( null, "clean up" );
				}
			    });
			}
		    });

		});
	    }
	});
    }
    else{
	APIcallback(null, "not need clean up");
    }
}






// function cloudUploadFile( refreshToken , accessToken , file ){
function cloudDeleteFolder( segment, APIcallback ){
    // refreshToken = '1/VgMZsjg-69BEP-3dAY7NINRGzX5LsgHidden';
    //refreshGoogleToken(segment.token[0], config.CLIENT_ID, config.CLIENT_SECRET,  function(err, cb, res_null  ){
    refreshGoogleToken(segment.token[0], 
		       clientID, 
		       clientSecret,  
		       function(err, cb, res_null  ){
	if(err){
	    console.log("wrong in refreshing");
	    APIcallback(err);
	}
	else{
	    // updated 
	    oauth2Client.credentials = {
		access_token: cb.accessToken, token_type: 'Bearer', expires_in: cb.expiresIn 
	    };

	    console.log(oauth2Client.credentials);

	    googleapis.discover('drive', 'v2').execute(function(err, client) {
		if (!!err) {
		    failure();
		    APIcallback(err);
		}
		fs.readFile( segment.path, function(err, file_content){
		    if(err){
			console.log(err);
			APIcallback(err);
		    }
		    else{	    	
			// console.log(file_content);
			console.log("Uploading");
			var params = {q : "title = '"+segment.name+"'"};

			client.drive.files.list( params ).withAuthClient(oauth2Client).execute( function( err_request , file_list){
			    if(err_request ) {
				console.log(err_request );
				APIcallback(err_request );
			    }
			    else{

				if(file_list.items.length == 1 ){

				    file_type = 'application/vnd.google-apps.folder';
				    client.drive.files.delete({ 'fileId': file_list.items[0].id } ).withAuthClient( oauth2Client ).execute();
				}
				else { 
				    APIcallback(err);
				}
			    }
			});
		    }
		});
	    }); // googleapis.discover
	}
    }); //
}


// function cloudUploadFile( refreshToken , accessToken , file ){
function cloudCreateFolder( segment, APIcallback ){
    // refreshToken = '1/VgMZsjg-69BEP-3dAY7NINRGzXkoEtGuqGnQJHidden';
    //refreshGoogleToken(segment.token[0], config.CLIENT_ID, config.CLIENT_SECRET,  function(err, cb, res_null  ){
    refreshGoogleToken(segment.token[0], 
		       clientID, 
		       clientSecret,  
		       function(err, cb, res_null  ){
	


	if(err){
	    console.log("wrong in refreshing");
	    APIcallback(err);
	}
	else{
	    // updated 
	    oauth2Client.credentials = {
		access_token: cb.accessToken, token_type: 'Bearer', expires_in: cb.expiresIn 
	    };

	    console.log(oauth2Client.credentials);

	    googleapis.discover('drive', 'v2').execute(function(err, client) {
		if (!!err) {
		    failure();
		    APIcallback(err);
		}


		fs.readFile( segment.path, function(err, file_content){
		    if(err){
			console.log(err);
			APIcallback(err);
		    }
		    else{	    	
			// console.log(file_content);
			console.log("Uploading");
			// data_type = 'application/octet-stream';
			//data_type = 'application/vnd.google-apps.folder';
			//client.drive.files.list().withAuthClient(oauth2Client).execute(console.log);
			//var quota = client.drive.about.get().withAuthClient(oauth2Client).execute(console.log);
			//segment.TBLocation
			//client.drive.files.insert({ title: segment.name} ).withAuthClient( oauth2Client ).execute();

		//	/*

			var params = {q : "title = '"+segment.name+"'"};

			client.drive.files.list( params ).withAuthClient(oauth2Client).execute( function( err_request , file_list){
				if(err_request ) {
				    console.log(err_request );
				    APIcallback(err_request );
				}
				else{


				    // delete directory
	//			    console.log("file list parents: " + file_list.parents.id );
				   // console.log("file_list %j " , file_list);
				    
				    if(file_list.items.length == 1 ){

					file_type = 'application/vnd.google-apps.folder';
					client.drive.files.insert({ title: TBAPI, mimeType : file_type } )
						.withAuthClient( oauth2Client )
						.execute();


				    }
				    else { 
					APIcallback(err);
				    }
				}
			});
						//*/
			}



		    // }
		});
	    }); // googleapis.discover
	}  //if-else err
    }); //
}



module.exports.cloudAccountInfo = cloudAccountInfo;
module.exports.cloudUploadFile = cloudUploadFile;
module.exports.cloudDownloadFile = cloudDownloadFile;
module.exports.cloudDeleteFile = cloudDeleteFile;
module.exports.cloudCleanUpFile = cloudCleanUpFile;




