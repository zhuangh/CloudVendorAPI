
var Dropbox = require("dropbox");
var request = require("request");
var fs = require("fs");
var path = require("path");
var crypto = require('crypto');

var config = require('./config.json');

var TBDropbox = {};
TBDropbox.AppKey =  config.Dropbox.CLIENT_ID ; 
TBDropbox.AppSecret =  config.Dropbox.CLIENT_SECRET ;
//var Access_token = "RHIDDEN____AAAAAUVgon9aGkK8a8Pq8xfvGTPNwTjMRQpExI29k4TMmvD9LA"; // should be provided by 'vendor' input

function cloudAccountInfo(vendor, APIcallback){

    var dbClient = new Dropbox.Client({
	key: TBDropbox.AppKey,	
	secret: TBDropbox.AppSecret,
	token: vendor.token[0]
    });


    dbClient.getAccountInfo(function(error, accountInfo) {
	if (error) {
	    console.log("wrong loggin Dropbox");
	    APIcallback(error);
	    // 	return ;  // Something went wrong.
	}
	else{
	    console.log("loggin Dropbox... the ID is " + accountInfo.name);
	    console.log(accountInfo);
	    vendor.freeSpace = accountInfo.quota-accountInfo.usedQuota;
	    vendor.connected = true;
	    console.log("free space "+ vendor.freeSpace);
	    APIcallback();
	}
    });

}

function cloudUploadFile(segment, APIcallback){


    var dbClient = new Dropbox.Client({
	key: TBDropbox.AppKey,	
	secret: TBDropbox.AppSecret,
	token: segment.token[0]
    });

    fs.readFile( segment.path, function(err, file_content){
	if(err){
	    console.log(err);
	    APIcallback(err);
	}
	else{	    	
	    console.log(file_content);
	    console.log("Uploading");
	    dbClient.writeFile( segment.TBLocation + segment.name, 
				file_content, function( error, stat){
				    if(error) {
					console.log("Wrong in Dropbox API writing to cloud", error);
					APIcallback(error);
				    }	    
				    else{
					console.log("Finish in Dropbox API writing to cloud");
					segment.uploadDone = true;
					APIcallback();
				    }
				});
	}
    });


}

function cloudDownloadFile(segment, APIcallback){

    var dbClient = new Dropbox.Client({
	key: TBDropbox.AppKey,	
	secret: TBDropbox.AppSecret,
	token: segment.token[0]
    });

    dbClient.readFile( segment.TBLocation + segment.name, {buffer : true},function(err, file_content){
	if(err){
	    console.log(err);
	    APIcallback(err);
	}
	else{
	    // console.log(file_content);
	    console.log("Uploading");
	    fs.writeFile(segment.path, 
			 file_content,function( error, stat){
			     if(error) {
				 console.log("Wrong in Dropbox API download from cloud");
				 APIcallback(error);
			     }	    
			     else{
				 console.log("Finish in Dropbox API download from cloud now get checksum for downloaded segment");
				 var SegReadStreamForData = fs.createReadStream(segment.path);

				 segment.downloadDone = true;

				 var shaStream = crypto.createHash('sha1');
				 shaStream.setEncoding('hex');
				 shaStream.once('finish',function(err){
				     if(err){
					 console.log("check sum error",err);
				     }
				     else{
					 segment.downloadedchecksum = shaStream.read();
					 if(segment.downloadedchecksum != segment.checksum){
					     console.log("original checksum is " + segment.checksum);
					     console.log("downloaded file checksum is "+ segment.downloadedchecksum);
					 }
				     }
				 APIcallback();
				 });
				 shaStream.once('error',function(err){
				     checkSumCallback(new Error("calculating checksum failed for segment " + segment.order + " of file " + FsTaskContext.filepath));
				     APIcallback();
				 });
				 SegReadStreamForData.pipe(shaStream);	
			     }
			 });

	}
    });

}


function cloudDeleteFile(segment, APIcallback){
    var dbClient = new Dropbox.Client({
	key: TBDropbox.AppKey,	
	secret: TBDropbox.AppSecret,
	token: segment.token[0]
    });



    console.log(segment.TBLocation);

    dbClient.remove( segment.TBLocation + segment.name, function(err){
	if(err){
	    console.log(err);
	    APIcallback(err);
	}
	else{
	    segment.deleteDone = true;
	    APIcallback(null);
	}
    });

}

function cloudCleanUpFile(segment, APIcallback){
    var dbClient = new Dropbox.Client({
	key: TBDropbox.AppKey,	
	secret: TBDropbox.AppSecret,
	token: segment.token[0]
    });

    console.log(segment.TBLocation);

    if( segment.uploadDone == true){ 
	dbClient.remove( segment.TBLocation + segment.name, function(err){
	    if(err){
		console.log(err);
		APIcallback(err);
	    }
	    else{
		APIcallback( null, "clean up" );
	    }
	});
    }
    else{
	APIcallback(null, "not need clean up");
    }
}


module.exports.cloudAccountInfo = cloudAccountInfo;
module.exports.cloudUploadFile = cloudUploadFile;
module.exports.cloudDownloadFile = cloudDownloadFile;
module.exports.cloudDeleteFile = cloudDeleteFile;
module.exports.cloudCleanUpFile = cloudCleanUpFile;



