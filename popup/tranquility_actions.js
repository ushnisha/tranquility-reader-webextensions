'use strict';

var browser = browser || chrome;

function callRunTranquility() {    

    browser.runtime.sendMessage(
      {
          "action": "RunTranquility"
      });
    window.close();
}

function callRunTranquilityAndReadLater() {
    browser.runtime.sendMessage(
      {
          "action": "RunTranquilityAndReadLater"
      });
    window.close();
}

function callViewTranquilityOfflinePages() {
    browser.runtime.sendMessage(
      {
          "action": "RunTranquilityViewOfflinePages"
      });
    window.close();
}

function callExportTranquilityOfflinePages() {
    browser.runtime.sendMessage(
      {
          "action": "RunTranquilityExportOfflinePages"
      });
    window.close();
}

function callImportTranquilityOfflinePages() {
    browser.runtime.sendMessage(
      {
          "action": "RunTranquilityImportOfflinePages"
      });
    window.close();
}

function onOptionsOpening() {
    if (browser.runtime.lastError) {
        console.log(`Error: ${browser.runtime.lastError}`);
    }
}

function openTranquilityOptionsPage() {
    let opening = browser.runtime.openOptionsPage(onOptionsOpening);
    window.close();
}


document.getElementById("tranquility-run-action").addEventListener("click", callRunTranquility);
document.getElementById("tranquility-read-later-action").addEventListener("click", callRunTranquilityAndReadLater);
document.getElementById("tranquility-view-offline-pages-action").addEventListener("click", callViewTranquilityOfflinePages);
document.getElementById("tranquility-export-offline-pages-action").addEventListener("click", callExportTranquilityOfflinePages);
document.getElementById("tranquility-import-offline-pages-action").addEventListener("click", callImportTranquilityOfflinePages);
document.getElementById("tranquility-options-action").addEventListener("click", openTranquilityOptionsPage);

let runStr = browser.i18n.getMessage("runTranquilityFromBrowserAction");
let readLaterStr = browser.i18n.getMessage("runTranquilityReadLaterFromBrowserAction");
let viewOfflineStr = browser.i18n.getMessage("runTranquilityViewOfflinePagesFromBrowserAction");
let exportOfflineStr = browser.i18n.getMessage("runTranquilityExportOfflinePagesFromBrowserAction");
let importOfflineStr = browser.i18n.getMessage("runTranquilityImportOfflinePagesFromBrowserAction");
let optionsStr = browser.i18n.getMessage("runTranquilityOptionsFromBrowserAction");

document.getElementById("tranquility-run-action").textContent = runStr;
document.getElementById("tranquility-read-later-action").textContent = readLaterStr;
document.getElementById("tranquility-view-offline-pages-action").textContent = viewOfflineStr;
document.getElementById("tranquility-export-offline-pages-action").textContent = exportOfflineStr;
document.getElementById("tranquility-import-offline-pages-action").textContent = importOfflineStr;
document.getElementById("tranquility-options-action").textContent = optionsStr;

