'use strict';

var browser = browser || chrome;

function runTranquility(mode) {
    
    console.log("Entered runTranquility at: " + new Date());
    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
        let active_tab = tabs[0];
        console.log(active_tab.id);
        insertContentScriptsAndCSSAndAction(active_tab.id, mode);
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
                //
                setZoom(1);
                
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
        }).catch(
        function(error) {
            console.log("Error: " + error);
        });
    
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
        
    // url: "about:blank" not supported in Firefox 52
    // will change this once Firefox 53 is out
    //
    let updating = browser.tabs.create(
        {
            active: true, 
            url: "http://www.mozilla.org"
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
            url: "http://www.mozilla.org"
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
            url: "http://www.mozilla.org"
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

// On installation check to see if an option is gettable; if not, set that option
function handleInstalled(details) {

    console.log("Tranquility installed!");
    console.log(details);
    
    let options_list = {"tranquility_background_color"              : "#FFFFFF", 
                        "tranquility_font_color"                    : "000000", 
                        "tranquility_link_color"                    : "#0000FF", 
                        "tranquility_annotation_highlight_color"    : "#FFFF99",
                        "tranquility_font_name"                     : "Georgia", 
                        "tranquility_font_size"                     : "22", 
                        "tranquility_reading_width"                 : "55", 
                        "tranquility_line_height"                   : "140", 
                        "tranquility_text_align"                    : "Left"
    };
      
    let option_keys = Object.keys(options_list);
    
    for (let opt=0; opt < option_keys.length; opt++) {

        let opt_name = option_keys[opt];
        let opt_value = options_list[opt_name];
        initializeOption(opt_name, opt_value);        
  }
  
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


browser.runtime.onInstalled.addListener(handleInstalled);