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
    else if (message.action == "AllTabsUpdateTranquilityPreferences") {
        allTabsUpdateTranquilityPreferences();
    }
    else if (message.action == "loadLinkInTranquilBrowsingMode") {
        console.log("Trying to browse in tranquil browsing mode: " + message.url);
        loadLinkAndRunTranquility(message.url, "Run");
    }
    else if (message.action == "ChangeTranquilityBrowserActionIcon") {
        console.log("Changing browser action icon");
        console.log(message.iconname);
        changeBrowserActionIcon(message.iconname);
    }
    else if (message.action == "getZoomValue") {
        getZoom();
    }
    else if (message.action == "saveAsPDF") {
        console.log("Saving page as PDF file");
        saveAsPDF();
    }
    else if (message.action == "openOptionsPage") {
        console.log("Opening options Page");
        openOptionsPage();
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
            else if (command == "show-tranquility-preferences") {
                openOptionsPage();
            }
            else if (command == "show-tranquility-offline-pages") {
                displayTranquilityOfflinePages();
            }
        });
    }
});
