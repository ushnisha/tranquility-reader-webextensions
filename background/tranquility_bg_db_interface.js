/**
 **********************************************************************
 * Tranquility Reader - A Firefox Webextension that cleans up
 * cluttered web pages
 **********************************************************************

   Copyright (c) 2012-2022 Arun Kunchithapatham

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

   Contributors:
   Arun Kunchithapatham - Initial Contribution
 ***********************************************************************
 *
 */

'use strict';

var browser = browser || chrome;

let dbOpenErrorString = browser.i18n.getMessage("dbOpenErrorString");
let duplicateURLErrorString = browser.i18n.getMessage("duplicateURLErrorString");
let urlNotFoundErrorString = browser.i18n.getMessage("urlNotFoundErrorString");
let urlNotDeletedErrorString = browser.i18n.getMessage("urlNotDeletedErrorString");

function db_saveContentOffline(indata) {

    let request = indexedDB.open("Tranquility_Reader_Offline_Content", 1);

    console.log("Save Document Message Received");
    
    // Handle first time (database creation)
    request.onupgradeneeded = function(event) {    
        let db = event.target.result;
        let objectStore = db.createObjectStore("offline_content", {keyPath: "url"});
    };

    // Handle errors
    request.onerror = function(event) {
        console.log(dbOpenErrorString + event.target.errorCode);
    };

    // Handle success
    request.onsuccess = function(event) {
        let db = request.result;
        let transaction = db.transaction(["offline_content"], "readwrite");
        let offline_docStore = transaction.objectStore("offline_content");
        console.log(indata);
        let req = offline_docStore.put(indata); 
        req.onsuccess = function(event) {
            console.log("Succeeded writing data into indexedDB for: " + indata.url);
        };
        req.onerror = function(event) {
            console.log("Failed writing data into indexedDB for: " + indata.url);
            console.log(duplicateURLErrorString);
        };      
    };
}

function db_getOfflinePagesList() {
        
    let request = indexedDB.open("Tranquility_Reader_Offline_Content", 1);

    // Handle first time (database creation)
    request.onupgradeneeded = function(event) {    
        let db = event.target.result;
        let objectStore = db.createObjectStore("offline_content", {keyPath: "url"});
    };

    // Handle errors
    request.onerror = function(event) {
        console.log(dbOpenErrorString + event.target.errorCode);
    };

    // Handle success
    let offline_details = {};
    
    request.onsuccess = function(event) {
        let db = request.result;
        // Iterate through all objects in the database
        let transaction = db.transaction(["offline_content"], "readonly");
        let offline_docStore = transaction.objectStore("offline_content");

        offline_docStore.openCursor().onsuccess = function(evt) {
            let cursor = evt.target.result;
            if (cursor) {
                console.log("URL: " + cursor.key);
                console.log("Title: " + cursor.value.title);
                offline_details[cursor.key] = cursor.value.title;
                cursor.continue();
            }
            else {
                browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    browser.tabs.sendMessage(tabs[0].id, 
                    {
                        tranquility_action: "PopulateOfflineList", 
                        offline_data: offline_details
                    });
                });                
            }
        };
    };
}


function db_getDocFromDB(thisURL) {

    let request = indexedDB.open("Tranquility_Reader_Offline_Content", 1);
    console.log(thisURL);
    
    // Handle first time (database creation)
    request.onupgradeneeded = function(event) {    
        let db = event.target.result;
        let objectStore = db.createObjectStore("offline_content", {keyPath: "url"});
    };

    // Handle errors
    request.onerror = function(event) {
        console.log(dbOpenErrorString + event.target.errorCode);
    };

    // Handle success
    request.onsuccess = function(event) {
        let db = request.result;
        // Retreive data for the input url
        let transaction = db.transaction(["offline_content"], "readonly");
        let offline_docStore = transaction.objectStore("offline_content");

        let req = offline_docStore.get(thisURL);
        req.onerror = function(e) {
            // Handle errors!
            console.log(urlNotFoundErrorString + thisURL);
        };
        req.onsuccess = function(e) {
            // Do something with the request.result!
            console.log("Retreived the content corresponding to: " + thisURL);
            browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
                browser.tabs.sendMessage(tabs[0].id, 
                  {
                      tranquility_action: "DisplayOfflineDocument", 
                      cached_doc: req.result.contentDoc,
                      url: thisURL
                  });
            });                            
        };      
    };
}


function db_delDocFromDB(thisURL) {

    let request = indexedDB.open("Tranquility_Reader_Offline_Content", 1);

    // Handle first time (database creation)
    request.onupgradeneeded = function(event) {    
        let db = event.target.result;
        let objectStore = db.createObjectStore("offline_content", {keyPath: "url"});
    };

    // Handle errors
    request.onerror = function(event) {
        console.log(dbOpenErrorString + event.target.errorCode);
    };

    // Handle success
    request.onsuccess = function(event) {
        let db = request.result;
        // Retreive data for the input url
        let transaction = db.transaction(["offline_content"], "readwrite");
        let offline_docStore = transaction.objectStore("offline_content");

        let req = offline_docStore.delete(thisURL);
        req.onerror = function(e) {
            // Handle errors!
            console.log(urlNotDeletedErrorString + thisURL);
        };
        req.onsuccess = function(e) {
            // Do something with the request.result!
            console.log("Deleted Document From DB: " + thisURL);
            console.log("Sending message back to content script to remove link");
            browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
                browser.tabs.sendMessage(tabs[0].id, 
                  {
                      tranquility_action: "DeleteOfflineDocumentLink", 
                      url: thisURL
                  });
            });                            
        };      
    };
}

function db_getAllOfflineContent() {
        
    let request = indexedDB.open("Tranquility_Reader_Offline_Content", 1);

    // Handle first time (database creation)
    request.onupgradeneeded = function(event) {    
        let db = event.target.result;
        let objectStore = db.createObjectStore("offline_content", {keyPath: "url"});
    };

    // Handle errors
    request.onerror = function(event) {
        console.log(dbOpenErrorString + event.target.errorCode);
    };

    let export_dttm = new Date();
    let export_content = { export_array: [],
                           export_date: export_dttm
                         };
    
    // Handle success
    request.onsuccess = function(event) {
        let db = request.result;
        // Iterate through all objects in the database
        let transaction = db.transaction(["offline_content"], "readonly");
        let offline_docStore = transaction.objectStore("offline_content");

        offline_docStore.openCursor().onsuccess = function(evt) {
            let cursor = evt.target.result;
            if (cursor) {
                export_content["export_array"].push({"url"        : cursor.key,
                                                     "title"      : cursor.value.title,
                                                     "contentDoc" : cursor.value.contentDoc,
                                                     "dateCreated": cursor.value.dateCreated
                });
                cursor.continue();
            }
            else {
                browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    browser.tabs.sendMessage(tabs[0].id, 
                    {
                        tranquility_action: "CreateExportLink", 
                        offline_data: export_content
                    });
                });                
            }
        };
    };
}
