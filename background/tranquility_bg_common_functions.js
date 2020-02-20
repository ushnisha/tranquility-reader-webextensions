/**
 **********************************************************************
 * Tranquility Reader - A Firefox Webextension that cleans up
 * cluttered web pages
 **********************************************************************

   Copyright (c) 2012-2019 Arun Kunchithapatham

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

function browserAction() {
    runTranquility("Run");
}

function runTranquility(mode) {
    console.log("Entered runTranquility at: " + new Date());
    console.log("Run Mode: " + mode);
    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
        let active_tab = tabs[0];
        console.log(active_tab.id);
        insertContentScriptsAndCSSAndAction(active_tab.id, mode);
     });
}

function runTranquilityOnSelection() {
    let mode = "RunOnSelection";
    console.log("Entered runTranquility at: " + new Date());
    console.log("Run Mode: " + mode);
    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
        let active_tab = tabs[0];

        console.log(active_tab.id);

        // Send message to tab to find out if Tranquility has already run on that tab

        let onSendMessage = function(response) {
            if (browser.runtime.lastError) {
                console.log(browser.runtime.lastError);
                // Tranquility has not already run; so insert content scripts and run Tranquility
                insertContentScriptsAndCSSAndAction(active_tab.id, mode);
            }
            else {
                // Tranquility must have run; only then we have a possible response from content script
                console.log("Response From Content Script: " + response.response);
                runAction(active_tab.id, mode);
            }
        }

        let sendMessage = browser.tabs.sendMessage(active_tab.id, {tranquility_action: "Status"}, onSendMessage);
     });
}

function addTranquilityAnnotation() {
    console.log("Sending message to content script to add an annotation...");
    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
        browser.tabs.sendMessage(tabs[0].id, {tranquility_action: "AddAnnotation"});
    }); 
}


function modifyTabURL(thisURL) {
    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
        let updating = browser.tabs.update(tabs[0].id, { url: thisURL });
    });    
}

function runAction(tabId, action) {
    // Send message to run tranquility (or other appropriate action that the content scripts
    // will handle
    let onSendMessage = function(response) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            console.log("Response From Content Script: " + response.response);
        }
    }
    
    let sendMessage = browser.tabs.sendMessage(tabId, {tranquility_action: action}, onSendMessage);
}

function insertContentScriptsAndCSSAndAction(tabId, action) {
    
    console.log("Inserting Scrips and CSS into tabId: " + tabId);
    let success = true;

    let p1 = browser.tabs.insertCSS(tabId, { matchAboutBlank: true, file: "/css/tranquility.css", runAt: "document_end"});
    let p2 = browser.tabs.executeScript(tabId, { matchAboutBlank: true, file: "/content_scripts/tranquilize.js", runAt: "document_end"});
    let p3 = browser.tabs.executeScript(tabId, { matchAboutBlank: true, file: "/content_scripts/apply_tranquility_preferences.js", runAt: "document_end"});
    let p4 = browser.tabs.executeScript(tabId, { matchAboutBlank: true, file: "/content_scripts/tranquility_annotations.js", runAt: "document_end"});
    let p5 = browser.tabs.executeScript(tabId, { matchAboutBlank: true, file: "/content_scripts/tranquility_offline_content.js", runAt: "document_end"});
    let p6 = browser.tabs.executeScript(tabId, { matchAboutBlank: true, file: "/content_scripts/tranquility_event_handlers.js", runAt: "document_end"});

    Promise.all([p1, p2, p3, p4, p5, p6]).then(
        function () { 
            if (action == "PopulateOfflinePages") {
                db_getOfflinePagesList();
            }
            else if (action == "ExportOfflinePages") {
                console.log("Calling function to gather all offline content");
                db_getAllOfflineContent();
            }
            else {
                // Remove zoom since we want to use the Tranquility font sizes only
                // Unfortunately, this will mean that page zoom settings are lost for
                // future normal loads of the page.  I am unable to figure out a way to
                // restore the original zoom in a straightforward manner given that
                // we support a tranquil browsing mode.
                // setZoom is not supported on AndroidOS
                //

                let gettingInfo = browser.runtime.getPlatformInfo(function (info) {
                    if (info.os != "android") {
                        setZoom(1);
                    }
                });

                runAction(tabId, action);
            }
        }).catch(
        function(error) {
            console.log("Error: " + error);
        });
    
}

function allTabsUpdateTranquilityPreferences() {

    let onQuerying = function(tabs) {

        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            for (let tab of tabs) {
                updateTab(tab.id);
            }
        }
    }

    let querying = browser.tabs.query({}, onQuerying);
}

function updateTab(tabId) {
    let onSendMessage = function(response) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            console.log("Response From Content Script: " + response.response);
        }
    }

    let sendMessage = browser.tabs.sendMessage(tabId,
                                               {tranquility_action: "UpdateTranquilityPreferences"}, 
                                               onSendMessage);
}

function displayTranquilityOfflinePages() {
        
    let onUpdate = function(tab) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            console.log("Call to insert Content for display offline pages");
            insertContentScriptsAndCSSAndAction(tab.id, "PopulateOfflinePages");
        }
    };
        
    let updating = browser.tabs.create(
        {
            active: true, 
            url: "about:blank"
        }, onUpdate);    
}


function exportTranquilityOfflinePages() {
    
    let onUpdate = function(tab) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            console.log("Call to insert Content for export");
            insertContentScriptsAndCSSAndAction(tab.id, "ExportOfflinePages");
        }
    };
    
    // url: "about:blank" not supported in Firefox 52
    // will change this once Firefox 53 is out
    //
    let updating = browser.tabs.create(
        {
            active: true, 
            url: "about:blank"
        }, onUpdate);
            
}


function importTranquilityOfflinePages() {
        
    let onUpdate = function(tab) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            insertContentScriptsAndCSSAndAction(tab.id, "ImportOfflinePages");
        }
    };
    
    // url: "about:blank" not supported in Firefox 52
    // will change this once Firefox 53 is out
    //
    let updating = browser.tabs.create(
        {
            active: true, 
            url: "about:blank"
        }, onUpdate);
    
}


function loadLinkAndRunTranquility(thisURL, mode) {
    console.log("Entered load and Run:" + thisURL);

    let onCreated = function (tab) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            runTranquility(mode);
        }
    }
        
    
    console.log("Invoking Browser update call for load and Run:" + thisURL);
    let updating = browser.tabs.create({active: true, url: thisURL}, onCreated);

}

function setZoom(zoom) {
    
    let onSetZoom = function () {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
    }

    let setting = browser.tabs.setZoom(zoom, onSetZoom);
}

function getIconFile(iconname) {
    let iconfile = "tranquility-32.png";
    if (iconname == "default") {
        iconfile = "tranquility-32.png";
    }
    else if (iconname == "grayscale") {
        iconfile = "tranquility-32-grayscale.png";
    }
    return iconfile;
}

function changeBrowserActionIcon(iconname) {
    let onChanging = function() {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
    }

    let iconfile = getIconFile(iconname);

    let changing = browser.browserAction.setIcon({"path": "icons/" + iconfile}, onChanging);
}

// On installation check to see if an option is gettable; if not, set that option
function handleInstalled(details) {

    console.log("Tranquility installed!");
    console.log(details);

    let options_list = tranquility_presets["Default (Light)"];

    // Android specific overrides to options
    //
    let gettingInfo = browser.runtime.getPlatformInfo(function (info) {

        if (info.os == "android") {
            options_list = tranquility_presets["Android"];
        }

        let option_keys = Object.keys(options_list);
    
        for (let opt=0; opt < option_keys.length; opt++) {
            let opt_name = option_keys[opt];
            let opt_value = options_list[opt_name];
            initializeOption(opt_name, opt_value);
        }

        // Finally, create a new option to store the presets
        // to allow users to add their own custom presets
        initializeOption("tranquility_presets", 
		         JSON.stringify(tranquility_presets));
    });
  
}

function initializeOption(opt_name, opt_value) {

    console.log(opt_name + ": " + opt_value);

    let onGettingSuccess = function(result) {            
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            if (Object.keys(result).length == 0) {
                let onSetting = function() {
                    if (browser.runtime.lastError) {
                        console.log(browser.runtime.lastError);
                    }
                }
                let setting = browser.storage.local.set({ [opt_name] : opt_value }, onSetting);
            }
        }
    }

    // Try to get an option; if it has not been set ever, 
    // then try setting the option in the onGettingSuccess function
    let getting = browser.storage.local.get(opt_name, onGettingSuccess);
}

function setBrowserActionIcon() {

    let onGettingSuccess = function(result) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            if (result.tranquility_browser_action_icon != null) {
                let onSetting = function() {
                    if (browser.runtime.lastError) {
                        console.log(browser.runtime.lastError);
                    }
                }
                console.log(result.tranquility_browser_action_icon);
                let iconfile = getIconFile(result.tranquility_browser_action_icon);
                console.log(iconfile);
                let setting = browser.browserAction.setIcon({"path": "icons/" + iconfile}, onSetting);
            }
        }
    }

    let getting = browser.storage.local.get("tranquility_browser_action_icon", onGettingSuccess);
}

function handleStartup() {
  setBrowserActionIcon();
}

browser.browserAction.onClicked.addListener(browserAction);
browser.runtime.onInstalled.addListener(handleInstalled);
browser.runtime.onStartup.addListener(handleStartup);
