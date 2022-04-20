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

let runStr = browser.i18n.getMessage("extensionRunTranquilityFromContextMenu");
let addNoteStr = browser.i18n.getMessage("extensionAddTranquilityAnnotationFromContextMenu");
let runOnSelStr = browser.i18n.getMessage("extensionRunTranquilityOnSelectionFromContextMenu");

// browser.contextMenus API not supported on AndroidOS
//
let gettingInfoPOS = browser.runtime.getPlatformInfo(function (info) {
    if (info.os != "android") {
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

        browser.contextMenus.create({
          id: "run_tranquility_on_selection",
          title: runOnSelStr,
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
            else if (info.menuItemId == "run_tranquility_on_selection") {
                console.log("Right click context menu triggered for running tranquility on selection...");
                runTranquilityOnSelection();
            }
        });
    }
});
