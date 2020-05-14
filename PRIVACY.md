# PRIVACY POLICY:

TLDR; Tranquility Reader *does not* collect or transmit any information to an external website.  

## Privacy philosophy:

From its very early versions in 2012 as a legacy addon, the aim of the extension has been to respect the privacy of the user.  

It was developed as an addon/extension rather than as a web service explicitly for this reason (in contrast with other applications like Instapaper, Evernote etc. which either processed the webpage on their remote servers, or stored the transformed page on their remote servers or both).

For the above reasons, there has never been and there is no plan in the foreseeable future to process or store any information outside of your browser/computer.  In the unlikely even that such a change is necessary, this will almost certainly happen as a new/separate extension.

## How the extension works:

Tranquility Reader modifies a web page locally on your browser by modifying/deleting/hiding elements on the original web page.

As a part of its working, it can stop loading a partially loaded page and re-fetch the page before modifying it.

The extension stores your preferences/settings locally on your browser.  Similarly, if you choose to save pages for reading later (offline), it stores such offline pages in your browser (local storage).

## Permissions sought by the extension (technical):

For Mozilla's end user friendly explanations of the different permissions please refer to [this page](https://support.mozilla.org/en-US/kb/permission-request-messages-firefox-extensions?as=u&utm_source=inproduct).

* "<all_urls>":  In the "continuous browsing mode", the extension may try to fetch data from a link that has a different origin from that of the activeTab in which it has already been run. To do this, the "activeTab" permission alone is insufficient and we need the "<all_urls>" permission.

This permission request  may raise a warning message that the extension can read all your data as well as information you enter in forms, like usernames, passwords etc.  Unfortunately, without this permission, I will need to create a whitelist/blacklist that makes using the extension difficult for a novice user.  At the time of writing this policy, Tranquility Reader is a "RECOMMENDED" extension which means that the Firefox staff have carefully reviewed this extension and deemed it safe for use.

* "activeTab": Modify data on the current tab (required when running the extension to modify the web page and make it readable).

* "tabs":  Access all tabs in the browser.  When you change a preference (font name, font color, reading width, etc. all tabs on which you have already run Tranquility Reader are automatically updated with these new preferences.

* "storage": Store user preferences and offline pages locally on your browser.

* "alarms": A way of giving visual clues (with built in time delays) to the user when preferences have been updated successfully (or if there are errors).

* "contextMenus": Allow for the "right-click" menu options on desktop version of the browser.  This lets you process and load a link in a new tab, highlight text and transform just that portion of the page, or add annotations.
