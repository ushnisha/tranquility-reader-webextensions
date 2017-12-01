'use strict';

var browser = browser || chrome;

let processMessage = function (message) {
    if (message.action == "savetoDB") {
        db_saveContentOffline(message.db_data);
    }
    else if (message.action == "getOfflinePagesList") {
        db_getOfflinePagesList();
    }
    else if (message.action == "getAllOfflineContent") {
        db_getAllOfflineContent();
    }
    else if (message.action == "getOfflineData") {
        console.log("Got message for URL: " + message.url);
        db_getDocFromDB(message.url);
    }
    else if (message.action == "DeleteDocFromDB") {
        db_delDocFromDB(message.url);
    }
    else if (message.action == "modifyTabURL") {
        modifyTabURL(message.url);
    }
    else if (message.action == "RunTranquility") {
        runTranquility("Run");
    }
    else if (message.action == "RunTranquilityAndReadLater") {
        runTranquility("RunAndSave");
    }
    else if (message.action == "RunTranquilityViewOfflinePages") {
        displayTranquilityOfflinePages();
    }
    else if (message.action == "RunTranquilityExportOfflinePages") {
        exportTranquilityOfflinePages();
    }
    else if (message.action == "RunTranquilityImportOfflinePages") {
        importTranquilityOfflinePages();
    }
    else if (message.action == "loadLinkInTranquilBrowsingMode") {
        console.log("Trying to browse in tranquil browsing mode: " + message.url);
        loadLinkAndRunTranquility(message.url, "Run");
    }
    else {
        console.log("Unsupported message: " + message);
    }
}

browser.runtime.onMessage.addListener(processMessage);

// browser.commands API not supported on AndroidOS
//
let gettingInfo = browser.runtime.getPlatformInfo(function (info) {
    if (info.os != "android") {
        browser.commands.onCommand.addListener(function(command) {
            if (command == "run-tranquility") {
                runTranquility("Run");
            }
        });
    }
});
