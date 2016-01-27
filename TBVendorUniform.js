
var request = require("request");
var fs = require("fs");
var path = require("path");
var crypto = require('crypto');

var TBVendorGoogleDriveAPI = require('./TBVendorGoogleDriveAPI.js');
var TBVendorDropboxAPI     = require('./TBVendorDropboxAPI.js');


function cloudAccountInfo(vendor, APIcallback){

    switch( vendor.vendorName){
    case 'dropbox' : 
	{
	    TBVendorDropboxAPI.cloudAccountInfo(vendor, APIcallback);
	    break;
	}
    case 'google-drive':
	{
	    TBVendorGoogleDriveAPI.cloudAccountInfo(vendor , APIcallback);
	    break;
	}
    default:
	{
	    console.log("Wrong in the cloud get account Info @ TBVendorUniform.js: cloudAccountInfo ");
	    APIcallback(err);
	}
   }

}

function cloudUploadFile(segment, APIcallback){

    switch( segment.vendorName){
    case 'dropbox' : 
	{
	    TBVendorDropboxAPI.cloudUploadFile(segment , APIcallback);
	    break;
	}
    case 'google-drive':
	{
	    TBVendorGoogleDriveAPI.cloudUploadFile(segment , APIcallback);
	    break;
	}
    default:
	{
	    console.log("Wrong in the uploading @ TBVendorUniform.js: cloudUploadFile ");
	    APIcallback(err);
	}
   }
}


function cloudDownloadFile(segment, APIcallback){

    switch( segment.vendorName){
    case 'dropbox' : 
	{
	    TBVendorDropboxAPI.cloudDownloadFile(segment , APIcallback);
	    break;
	}
    case 'google-drive':
	{
	    TBVendorGoogleDriveAPI.cloudDownloadFile(segment , APIcallback);
	    break;
	}
    default:
	{
	    console.log("Wrong  @ TBVendorUniform.js: cloudDownloadFile ");
	    APIcallback(err);
	}
   }
}


function cloudDeleteFile(segment, APIcallback){

    switch( segment.vendorName){
    case 'dropbox' : 
	{
	    TBVendorDropboxAPI.cloudDeleteFile(segment , APIcallback);
	    break;
	}
    case 'google-drive':
	{
	    TBVendorGoogleDriveAPI.cloudDeleteFile(segment , APIcallback);
	    break;
	}
    default:
	{
	    console.log("Wrong in the uploading @ TBVendorUniform.js: cloudDownloadFile ");
	    APIcallback(err);
	}
   }
}

function cloudCleanUpFile(segment, APIcallback){

    switch( segment.vendorName){
    case 'dropbox' : 
	{
	    TBVendorDropboxAPI.cloudCleanUpFile( segment , APIcallback);
	    break;
	}
    case 'google-drive':
	{
	    TBVendorGoogleDriveAPI.cloudCleanFile( segment , APIcallback);
	    break;
	}
    default:
	{
	    console.log("Wrong @ TBVendorUniform.js: cloudCleanUpFile ");
	    APIcallback(err);
	}
   }
}

module.exports.cloudAccountInfo = cloudAccountInfo;
module.exports.cloudUploadFile = cloudUploadFile;
module.exports.cloudDownloadFile = cloudDownloadFile;
module.exports.cloudDeleteFile = cloudDeleteFile;
module.exports.cloudCleanUpFile = cloudCleanUpFile;

// module.exports.APIcallback = APIcallback;


