'use strict';

var browser = browser || chrome;

let runStr = browser.i18n.getMessage("extensionRunTranquilityFromContextMenu");
let addNoteStr = browser.i18n.getMessage("extensionAddTranquilityAnnotationFromContextMenu");

browser.contextMenus.create({
  id: "run_tranquility",
  title: runStr,
  type: "normal",
  contexts: ["link"]
});

browser.contextMenus.create({
  id: "add_tranquility_note",
  title: addNoteStr,
  type: "normal",
  contexts: ["selection"]
});

browser.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId == "run_tranquility") {
        loadLinkAndRunTranquility(info.linkUrl, "Run");
    }
    else if (info.menuItemId == "add_tranquility_note") {
        console.log("Right click context menu triggered for adding annotation...");
        addTranquilityAnnotation();
    }
});
