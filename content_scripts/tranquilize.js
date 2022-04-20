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

/*
 * Process the messages appropriately
 * 
 */

'use strict';
var browser = browser || chrome;
var currentURL = null;
var dfsIndex = 1;
var osVersion = browser.runtime.PlatformOs;
var zoomValue = 1.0;
var currentFontSize = "20px";

function tranquilize(request, sender, sendResponse) {

    if (request.tranquility_action === 'Run') {
        console.log("Called to run Tranquility at: " + new Date());
        RunOnLoad();
        return Promise.resolve({response: "Completed Running Tranquility"});
    }
    else if (request.tranquility_action === 'RunAndSave') {
        console.log("Called to run and Save Tranquility at: " + new Date());
        RunAndSaveOnLoad();
        return Promise.resolve({response: "Completed Saving Content Offline"});
    }
    else if (request.tranquility_action == 'RunOnSelection') {
        console.log("Called to run Tranquility at: " + new Date());
        RunOnSelection();
        return Promise.resolve({response: "Completed Running Tranquility on Selection"});
    }
    else if (request.tranquility_action === 'PopulateOfflineList') {
        console.log("Receive message to display offline files list");
        displayOfflinePages(request.offline_data);
    }
    else if (request.tranquility_action === 'DisplayOfflineDocument') {
        console.log("Received offline document from database");
        displayDocFromDB(request.cached_doc, request.url);
    }
    else if (request.tranquility_action === 'DeleteOfflineDocumentLink') {
        delDocFromDB(request.url);
    }
    else if (request.tranquility_action === 'CreateExportLink') {
        console.log("Received message to export offline links");
        displayExportLink(request.offline_data);
    }
    else if (request.tranquility_action === 'ImportOfflinePages') {
        displayImportPage();
        return Promise.resolve({response: "Created Page for Import Prompt"});
    }
    else if (request.tranquility_action === 'AddAnnotation') {
        addAnnotation();
    }
    else if (request.tranquility_action === 'UpdateTranquilityPreferences') {
        if (document.getElementsByClassName("tranquility_container").length > 0) {
            applyAllTranquilityPreferences();
            return Promise.resolve({response: "Updated Tranquility Preferences"});
        }
        else {
            return Promise.resolve({response: "Tab does not contain Tranquility Reader elements"});
        }
    }
    else if (request.tranquility_action == 'Status') {
        return Promise.resolve({response: "Tranquility Has Already Run"});
    }
    else if (request.tranquility_action == 'UpdateZoomValue') {
        updateZoomValue(request.zoomValue);
        return Promise.resolve({response: "Updated Zoom Value"});
    }
    else if (request.tranquility_action == 'ExecutePostPDFPrintActions') {

        // Reset page to default column-num value post printing
        // Then reapply the image display preferences
        applyNumColumnsPreferences('defaultMode');
        applyImageDisplayPreferences();

        return Promise.resolve({response: "Executed Post PDF Print Actions"});
    }
    else if (request.tranquility_action == 'None') {
        return Promise.resolve({response: "Receive Do Nothing Message"});
    }
    else {
        console.log("Message not implemented: " + request.tranquility_action);
    }
}

function RunOnLoad() {

    requestZoomValue();

    currentURL = location.toString();
    // If we have already run tranquility, then just toggle back to the original webpage (un-tranquilize the page)
    if (document.body.getElementsByClassName("tranquility").length > 0) {
        // If this is an offline link, we need to get the data-active-link of the tranquility_offline_links_btn
        console.log("Document already in tranquility mode. Reverting to original page...");
        let btn = document.getElementById('tranquility_offline_links_btn');
        let url = null;
        if(btn.getAttribute('data-active-link')) {
            console.log("Found data active link...");
            url = btn.getAttribute('data-active-link');
        }
        else {
            url = currentURL;
        }
        console.log("url: " + url);

        // Handle corner case when the url has a "#" tag
        // this can prevent the window.location.assign from working!
        //
        window.location.assign(url.split("#")[0]);
    }
    // If tranquility has not been run, then "tranquilize" the document
    else {
        // Stop loading the document if it has not completed loading
        if(document.readyState == "loading") {
            window.stop();
            // Show a progress-bar to indicate activity and then process the request
            // bar will automatically disappear since the document will be replaced
            let pbar = getProgressBar(document);
            pbar.style.visibility = 'visible';
            processXMLHTTPRequest(currentURL, false);
        }
        else {
            // Show a progress-bar to indicate activity and then process the request
            // bar will automatically disappear since the document will be replaced
            let pbar = getProgressBar(document);
            pbar.style.visibility = 'visible';
            processContentDoc(document, currentURL, false);
        }
    }
}

function RunOnSelection() {
    currentURL = location.toString();
   
    // Typically used when the page has at least partially loaded and user has selected some text
    // However this should work even if we are running on an already processed page; maybe the user wants to
    // prune the tranquilized content further and read just a portion of the article

    // Stop loading the document if it has not completed loading
    if(document.readyState == "loading") {
        window.stop();
    }

    // Obtain a DocumentFragment of the selected portion of the webpage
    let selection = document.getSelection();
    let range = selection.getRangeAt(0);
    let frag = range.cloneContents();

    // Show a progress-bar to indicate activity and then process the request
    // bar will automatically disappear since the document will be replaced
    let pbar = getProgressBar(document);
    pbar.style.visibility = 'visible';

    // Clone the current page and replace entire body with the DocumentFragment
    let contentDoc = document.cloneNode(true);
    let docBody = contentDoc.body;
    while (docBody.firstChild) {
        docBody.removeChild(docBody.firstChild);
    }
    docBody.appendChild(frag);

    // Now run tranquility to process the DocumentFragment
    processContentDoc(contentDoc, currentURL, false);
}

function RunAndSaveOnLoad() {
    currentURL = location.toString();
    // If we have already run tranquility, then just save content offline and exit
    if (document.readyState == "complete" && document.body.getElementsByClassName("tranquility").length > 0) {
        saveContentOffline(currentURL, document.cloneNode(true));
        return;
    }

    // If tranquility has not been run, then "tranquilize" the document and then save the content offline
    if(document.readyState == "loading") {
        window.stop();
    }
    // Show a progress-bar to indicate activity and then process the request
    // bar will automatically disappear since the document will be replaced
    let pbar = getProgressBar(document);
    pbar.style.visibility = 'visible';
    processXMLHTTPRequest(currentURL, true);
}

function processXMLHTTPRequest(url, saveOffline) {

    // Handle corner case to avoid mixed content security warnings/errors
    let getURL = url;
    if (getURL.substr(0,5) == 'https') {
        console.log(getURL);
        getURL = getURL.replace(/^http\:/, 'https:');
        console.log(getURL);
    }

    let oXHR = new XMLHttpRequest();
    oXHR.onreadystatechange = function() {
        console.log(oXHR.readyState  + ", " + oXHR.status);
        if(oXHR.readyState === 4) {
            if(oXHR.status === 200) {
                let oXHRDoc = oXHR.responseText;
                processResponse(oXHRDoc, url, saveOffline);
            }
            else {
                // Print error message to console and remove progress bar if any
                //
                console.log("Response status: " + oXHR.status);
                console.log("Unable to process document");
                let pbar = document.getElementById("tranquility_progress_bar");
                if (pbar) {
                    pbar.style.backgroundColor = '#FF0000';
                    setTimeout(function() {
                        pbar.parentNode.removeChild(pbar);
                    }, 3000);
                }
            }
        }        
    };
    console.log(getURL);
    oXHR.open("GET", getURL, true);

    // Fix to handle pages that use iso-8859-1/windows-1252 encoding
    //
    if (document.characterSet.toLowerCase() == "windows-1252") {
        oXHR.overrideMimeType('text/html; charset=iso-8859-1');
    }

    oXHR.send(null);
}
          
function processResponse (oXHRDoc, thisURL, saveOffline) {

    console.log("Processing Response...");

    let parser = new DOMParser();
    let contentDoc = parser.parseFromString(oXHRDoc, "text/html");
    processContentDoc(contentDoc, thisURL, saveOffline);
}

function processContentDoc(contentDoc, thisURL, saveOffline) {

    // First move to the top of the document; for some reason
    // window.scroll(0, 0) at the end of processing does not seem to
    // always work
    //
    document.documentElement.scrollTop = 0;

    // Remove all event handlers by "deep" cloning the document
    // instead of cloning each element (saves some time and
    // the code is cleaner); now cloning the entire document
    // instead of just cloning only the body
    //
    let clonedDoc = contentDoc.cloneNode(true);
    document.replaceChild(clonedDoc.documentElement, document.documentElement);

    contentDoc = document;

    // Remove all script tags
    //
    let scriptTags = ["SCRIPT", "NOSCRIPT"];
    for (let i = 0; i < scriptTags.length; i++) {
        removeTag(contentDoc, scriptTags[i]);
    }

    // Now replace document.documentElement; It looks like we need this step for
    // the window.getComputedStyle() function to work correctly
    // we can then copy over the document to the contentDoc variable and continue
    // as before
    //
    document.replaceChild(contentDoc.documentElement, document.documentElement);
    contentDoc = document;

    // First get a dfs search to index every single element in the
    // document
    let indexMap = {};
    indexElements(indexMap, contentDoc.body);

    // Backup any title/heading related tags to restore in case they are removed
    // by the deletion logic
    //
    let hElemsMap = {};
    cloneHElems(hElemsMap, contentDoc);

    // Collect any supporting links before processing the webpage
    let supporting_links = getSupportingLinks(contentDoc);
    console.log("Got supporting links...");

    // Remove some elements that are typically like hidden elements
    // but can add to the text size of a document; remove them so that
    // their effect on later logic (textContent.length value) is minimized
    //
    let likeHidden = ["HEADER", "FOOTER", "NAV", "SVG", "PATH", "LINK", "STYLE"];
    for (let i = 0; i < likeHidden.length; i++) {
        removeTag(contentDoc, likeHidden[i]);
    }

    // Remove unnecessary whitespaces and comments
    removeWhiteSpaceComments(contentDoc);
    //console.log("Removed white spaces and comments");

    // Cleanup the head and unnecessary tags
    // Delete All Hidden Elements before doing anything further
    // These could be hidden images, div, spans, spacers, etc...
    // Delete any content that has display = 'none' or visibility == 'hidden'
    // This was originally done only for spacer images, but seems like a meaningful thing
    // to do for all elements, given that all scripts are also deleted in the Tranquility view
    //

    // First get the size of the document before removing hidden content and make a clone
    // in case we need to revert
    //
    let sizeBeforeDelHidden = computeSize(contentDoc.documentElement);
    let bkpContentDoc = contentDoc.cloneNode(true);

    deleteHiddenElements(contentDoc, "*");
    console.log("Removed Hidden elements");

    let sizeAfterDelHidden = computeSize(contentDoc.documentElement);

    console.log(sizeBeforeDelHidden, sizeAfterDelHidden);

    // If the content after deletion of hidden elements is less than 10% of the
    // content before deletion of hidden elements and the size after deletion
    // is less than 200 characters, then it is possible that the
    // website is hiding content within hidden elements
    //
    // Revert to the document state before this step and continue...
    //
    if (sizeAfterDelHidden < 200 && sizeAfterDelHidden / sizeBeforeDelHidden < 0.1) {
        console.log("Problem removing hidden elements...");
        console.log("Website may be hiding content within hidden elements...");
        console.log("Reverting to backedup document and continuing...");
        console.log("Size Before: ", sizeBeforeDelHidden, "Size After: ", sizeAfterDelHidden);
        document.replaceChild(bkpContentDoc.documentElement, document.documentElement);
        contentDoc = document;
    }

    console.log("Size: ", computeSize(contentDoc.documentElement));

    // Remove zero sized images; this is just another way of hiding elements
    // otherwise, these can get cloned and reappear
    // resized to the reading width, which is very annoying
    // This has a side effect of removing images that have not yet loaded
    // The problem will be addressed in a later release
    //
    deleteZeroSizeImages(contentDoc);
    console.log("Removed Zero Sized Images");
    console.log("Size: ", computeSize(contentDoc.documentElement));

    // Ensure that we set a base element before we replace the
    // web page with the new content; otherwise, relative URL
    // links will be based on the incorrect URL present in the
    // window.location 
    // Then call convertLinksAbsolute to convert all relative
    // links to absolute links so that these links will also
    // work if we save this document for reading later
    //
    let baseElem = createNode(contentDoc, {type: 'BASE', attr: { href: thisURL } });

    let heads = contentDoc.getElementsByTagName('HEAD');
    for(let i = 0; i < heads.length; i++) {
        heads[i].appendChild(baseElem.cloneNode(true));
    }
    convertLinksAbsolute(contentDoc, thisURL);

    console.log("Processing document...");

    // Remove any links that have an onclick event (these are usually for sharing to social media)
    // removing such links is consistent with our preference to delete all javascript
    //
    console.log("Removing links with associated javascript events...");
    let all_links = contentDoc.getElementsByTagName("A");
    for (let i = all_links.length - 1; i >= 0; i--) {
        let onclickVal = all_links[i].getAttribute('onclick');
        if (onclickVal != null) {
            all_links[i].setAttribute('onclick', "void(0);");
        }
    }

    // If there is a single "MAIN" tag, then replace the entire document content with just the
    // contents of the main tag.  Trust that the content creator has done the correct thing.
    // If and article tag exists, then...
    // If there is a single "ARTICLE" tag, then replace the entire document content with just the
    // contents of the article.  Trust that the content creator has done the correct thing
    // (this is because articles are supposed to be within the main tag)
    //
    let mainsOrArticle = false;
    let mains = contentDoc.getElementsByTagName("main");
    let articles = contentDoc.getElementsByTagName("article");
    if (mains.length == 1) {
        let docBody = contentDoc.body;
        let mainContent = mains[0].cloneNode(true);
        if (computeSize(mainContent) > 200) {
            while (docBody.firstChild) {
                docBody.removeChild(docBody.firstChild);
            }
            docBody.appendChild(mainContent);
            console.log("Replaced body content with main contents...");
            mainsOrArticle = true;
        }
    }
    if (articles.length == 1) {
        let docBody = contentDoc.body;
        let mainArticle = articles[0].cloneNode(true);
        if (computeSize(mainArticle) > 200) {
            while (docBody.firstChild) {
                docBody.removeChild(docBody.firstChild);
            }
            docBody.appendChild(mainArticle);
            console.log("Replaced body content with article contents...");
            mainsOrArticle = true;
        }
    }
    console.log("Processed article/main content...");
    console.log("Size: ", computeSize(contentDoc.documentElement));

    // Remove unnecessary whitespaces and comments
    //removeWhiteSpaceComments(contentDoc);
    //console.log("Removed white spaces and comments");

    // Cleanup the head and unnecessary tags
    let delTags = ["STYLE", "LINK", "META", "SCRIPT", "NOSCRIPT", "IFRAME",
                   "SELECT", "DD", "INPUT", "TEXTAREA", "HEADER", "FOOTER",
                   "NAV", "FORM", "BUTTON", "PICTURE", "FIGURE", "SVG"];
    for(let i=0; i<delTags.length; i++) {
        let delTagExceptions = ["PICTURE", "FIGURE", "SVG"];
        if (mainsOrArticle) {
            if (!delTagExceptions.includes(delTags[i])) {
                removeTag(contentDoc, delTags[i]);
            }
        }
        else {
            removeTag(contentDoc, delTags[i]);
        }
        console.log("Size: ", computeSize(contentDoc.documentElement));
    }
    
    console.log("Cleaned up unnecessary tags and headers");
    console.log("Size: ", computeSize(contentDoc.documentElement));

    // Cleanup elements that have classnames that are typically not main content
    // This was included as a hidden element via css @media settings in 3.0.18
    // but moving it to a regexp for more flexibility (borrowing idea from readability)
    // since it is easier to undo the cleanup in javascript or add logic to skip
    // certain elements that seem to have actual content in them
    //
    let unlikelyCandidates = /^social|soc|^header|footer|related|recommended|sponsored|action|navigation|promo|adCaption|comment|dfp|adHolder|billboard|slide|-ad-|_ad_|control-bar|menu|disqus|popup|pop-up|crumb|more-stories/i
    let nodeIter = getNodeIterator(contentDoc.body, unlikelyCandidates, "className");
    let node = null;
    while ((node = nodeIter.nextNode())) {
        let exceptions = ["BODY", "MAIN", "ARTICLE"];
        if (exceptions.includes(node.nodeName.toUpperCase())) {
            continue;
        }
        let docSize = computeSize(contentDoc.body);
        let nodeSize = computeSize(node);

        if (nodeSize/docSize > 0.9) {
            continue;
        }
        console.log("Removing node with classname: ", node.className);
        console.log(nodeSize, docSize);
        node.parentNode.removeChild(node);
    }

    console.log("Cleaned up unlikely candidates");
    console.log("Size: ", computeSize(contentDoc.documentElement));

    // Reformat the header and use custom css
    reformatHeader(contentDoc);

    console.log("Reformatted headers...");

    // Moving the cloneImage calls after we have
    // cleaned up the unnecessary tags.  This can help filter of any
    // unneccessary icons ad images that are in these deleted tags
    // and get added back later.

    // Clone all the image nodes for later insertion
    let imgCollection = {};
    cloneImages(contentDoc.body, imgCollection);

    // Ensure that we set a base element before we replace the
    // Processing for ads related DIV's; several websites seem to use LI elements
    // within the ads DIV's, or for navigation links which are not required in the 
    // Tranquility view.  In this section, we try to delete DIV's that have at least 
    // x% of the DIV content within LI tags
    let pruneAdsTagList = ["UL", "DIV", "ARTICLE", "SECTION"];
    let totalSize = computeSize(contentDoc.documentElement);
    for(let p=0; p < pruneAdsTagList.length; p++) {
        pruneAdsTag(contentDoc, thisURL, pruneAdsTagList[p], 0.7, totalSize, imgCollection);
    }

    console.log("Pruned the AdsTag");
    console.log("Size: ", computeSize(contentDoc.documentElement));
   
    // Cleanup select tags that have content length smaller than minSize 
    // This helps clean up a number of junk DIV's before we get to real content
    // Can be made a parameter in later versions
    // First run with minSize ZERO
    // Removed TD and DD for now
    let pruneTagList = ["LI", "DIV", "OL", "UL", "FORM", "TABLE", "ARTICLE", "SECTION", "SPAN", "P"];
    let minSize = 0;
    totalSize = computeSize(contentDoc.documentElement);
    for(let p=0; p < pruneTagList.length; p++) {
        pruneTag(contentDoc, pruneTagList[p], 0.0, minSize, totalSize);
    } 
    // Next run with minsize 5 (for a reduced subset of the tags)
    // Removed TD, TABLE, and DD for now
    pruneTagList = ["FORM", "DIV", "ARTICLE", "SECTION"];
    minSize = 5;
    totalSize = computeSize(contentDoc.documentElement);
    for(let p=0; p < pruneTagList.length; p++) {
        pruneTag(contentDoc, pruneTagList[p], 0.0, minSize, totalSize);
    } 

    // Second pass
    // Remove any elements that have zero length textContent
    pruneTagList = ["LI", "DIV", "OL", "UL", "FORM", "TABLE", "ARTICLE", "SECTION", "SPAN", "P"];
    minSize = 0;
    totalSize = computeSize(contentDoc.documentElement);
    for(let p=0; p < pruneTagList.length; p++) {
        pruneTag(contentDoc, pruneTagList[p], 0.0, minSize, totalSize);
    } 

    console.log("Completed second pass pruning");
    
    // Try to remove unnecessary nested DIV's
    // They mess up the padding and margins; use only in moderate pruning
    // if the threshold is < 0.99999
    for(let i=0; i < 5; i++) {
        replaceParent(contentDoc, "DIV",  0.99999);
        replaceParent(contentDoc, "SPAN", 0.99999);
    }
    
    console.log("Completed Replace parent loops");

    // Format the tags in a nice readable font/style using custom css loaded in header
    let reformatTagList = ["UL", "OL", "LI", "DIV", "SPAN", "P", "FONT", "BODY", "H1", 
                           "H2", "H3", "PRE", "TABLE", "ARTICLE", "SECTION", "MAIN"];
    for(let r=0; r < reformatTagList.length; r++) {
        reformatTag(contentDoc, reformatTagList[r]);
    }

    console.log("Completed reformatting tags");

    // Time to add back the images that we have cloned
    //
    addBackElems(contentDoc, "IMG", imgCollection, indexMap);

    // Add back any title/h1 tags we backup that were removed incorrectly
    addBackElems(contentDoc, "H1", hElemsMap, indexMap);

    console.log("Reinserted images and H1 tags...");

    // Remove target attribute from all anchor elements
    // this will enable opening the link in the same browser tab
    //
    removeAnchorAttributes(contentDoc);
    console.log("Removed Anchor attributes");

    // Create the tranquility UI related elements
    create_ui_elements(contentDoc, supporting_links, thisURL);
    console.log("Created Tranquility UI elements");

    console.log("Finished processing document");

    // Finally apply all preferences and add Event listeners
    applyAllTranquilityPreferences();
    addBackEventListeners();

    // Try one last time to remove any hidden/script elements that did not get removed for any reason
    for (let i = 0; i < scriptTags.length; i++) {
        removeTag(contentDoc, scriptTags[i]);
    }
    for (let i = 0; i < likeHidden.length; i++) {
        removeTag(contentDoc, likeHidden[i]);
    }

    if (saveOffline) {
        saveContentOffline(thisURL, document.cloneNode(true));
    }
}

function removeWhiteSpaceComments(cdoc) {

    let cnodes = cdoc.childNodes;
    for(let i=cnodes.length -1; i > -1; i--) {
        // Make sure that PRE nodes are ignored
        // Otherwise, their spaces and line breaks are removed
        // destroying their formatting
               
        if(cnodes[i].nodeName == "PRE") {
            continue;
        }
        if(cnodes[i].nodeType == 1) {
            removeWhiteSpaceComments(cnodes[i]);
        }
        if(cnodes[i].nodeType == 3) {
            let allText = cnodes[i].data;
            cnodes[i].data = allText.replace(/\s{2,}/g, ' ');
        }
        if(cnodes[i].nodeType == 8 || cnodes[i].nodeType == 4) {
            cnodes[i].parentNode.removeChild(cnodes[i]);
        }
    }
}

function removeTag(cdoc, tagString) {

    console.log("Removing items with tag: ", tagString);
    let regexp = new RegExp(tagString, 'i');
    console.log(cdoc.body.getElementsByTagName(tagString).length);
    let nodeIter = getNodeIterator(cdoc.body, regexp, "nodeName");
    let node = null;
    let ncounter = 0;
    while ((node = nodeIter.nextNode())) {
        ncounter += 1;
        if(node.id == undefined || node.id.substr(0,11) !== "tranquility") {
            node.parentNode.removeChild(node);
        }
    }
    console.log("Removed ", ncounter, " items with tag: ", tagString);
}

function reformatHeader(cdoc) {
    
    let heads = cdoc.getElementsByTagName('HEAD');
    for(let i=0; i < heads.length; i++) {
        let hChildren = heads[i].getElementsByTagName("*");
        let titleNodeCount = 0;
        while(hChildren.length > titleNodeCount) {
            if (hChildren[titleNodeCount].nodeName.toUpperCase() !== "TITLE") {
                heads[i].removeChild(hChildren[titleNodeCount]);
            }
            else {
                titleNodeCount++;
            }
        }
    }    
}

function deleteHiddenElements(cdoc, tagString) {
    // Remove elements that have display==none or visibility==hidden
    let elems = cdoc.getElementsByTagName(tagString);

    let ignoreList = ["HEAD", "TITLE"];

    for(let i=elems.length - 1; i >=0;  i--)  {

        if (ignoreList.includes(elems[i].nodeName.toUpperCase())) {
            continue;
        }

        let cssProp = window.getComputedStyle(elems[i], null);
        let cssVisibility = cssProp.getPropertyValue("visibility");
        let cssDisplay = cssProp.getPropertyValue("display");

        if(((cssVisibility != undefined) && (cssVisibility == 'hidden')) ||
           ((cssDisplay != undefined) && (cssDisplay == 'none'))) {
            elems[i].parentNode.removeChild(elems[i]);
        }
    }
}


function pruneAdsTag(cdoc, url, tagString, thresholdPctg, totalSize, imgCollection) {

    let c = cdoc.getElementsByTagName(tagString);
    let len = c.length;
    let tElem;
    for(let i=0; i < len; i++) {
        tElem = c[len-i-1];

        let cLength = computeSize(tElem);
        let pctg = cLength/totalSize; 
        // If the DIV/SECTION/ARTICLE is empty remove it right away
        if(cLength == 0) {
            tElem.parentNode.removeChild(tElem);
        }
        // If the DIV does not contain a significant portion of the web content
        // AND the DIV contain mainly list elements then we can process to remove ads
        // Here, we use the "A" anchor node as a proxy for the LI node since each
        // navigation menu (or ads links menu) has a list of LI nodes that contain
        // anchor nodes with links to a new web page/section
        //
        else if(pctg < 0.8) { 
            let anchorNodes = tElem.getElementsByTagName("A");
            let anchorLength = 0;
            let num_words = 0;
            for(let j=0; j < anchorNodes.length; j++) { 
                // Ignore links that are # tags in the same document
                // These are typically table of content type links for the
                // current document and are useful to retain
                //
                if(anchorNodes[j].href.split("#")[0] == url.split("#")[0])
                    continue;
                anchorLength += computeSize(anchorNodes[j]);
                num_words += anchorNodes[j].textContent.split(/\s+/).length;
            }
            let avg_words_per_anchor = num_words/anchorNodes.length;
            let inner_div_pctg = anchorLength/cLength; 
            // If the DIV has > thresholdPctg of its content within anchor nodes
            // remove, the DIV.  Additionally we can also look at the number of words
            // per anchor, but for now, that is not enabled
            if (inner_div_pctg >= thresholdPctg) {
                let images = tElem.getElementsByTagName('img');
                if (images.length > 0) {
                    for (let k = 0; k < images.length; k++) {
                        let idx = images[k].getAttribute('data-dfsIndex');
                        if (idx in imgCollection) {
                            delete imgCollection[idx];
                        }
                    }
                }
                tElem.parentNode.removeChild(tElem); 
            }
        }
        else {
            // Do nothing
        }
    }
}

function pruneTag(cdoc, tagString, thresholdPctg, minSize, totalSize) {

    let c = cdoc.getElementsByTagName(tagString);
    let len = c.length;
    let tElem;
    for(let i=0; i < len; i++) {
        tElem = c[len-i-1];

        // If the DIV has a H1 child, then we want to retain the article
        // heading and not delete it.
        let h1elems = tElem.getElementsByTagName("H1");
        if(h1elems.length > 0) 
            continue;

        let cLength = computeSize(tElem);
        let pctg = cLength/totalSize; 
        // Experimental; do not delete if the text content is > threshold of innerHTML
        // currently hardcoded; trying to do better with blog style pages and comments
        let ilength = tElem.innerHTML.replace('/\s/g', '').length + 1;
        let inner_html_pctg = cLength/ilength; 
        if (((inner_html_pctg < 0.5) && (pctg < thresholdPctg)) || (cLength <= minSize)) {
            tElem.parentNode.removeChild(tElem); 
        }
        else {
            // Do nothing
        }
    }
}

function replaceParent(cdoc, tagString, thresholdPctg) {

    let c = cdoc.getElementsByTagName(tagString);
    let cArray = [];
    let len = c.length;
    for(let i=0; i < len; i++) {
        cArray[i] = c[i];
    }
    cArray.sort(function (a,b) { return b.innerHTML.length - a.innerHTML.length } );

    let tElem; 
    for(let i=0; i < len; i++) {
        tElem = cArray[len-i-1];
        if((tElem.parentNode != undefined) && (tElem.parentNode.tagName == tElem.tagName)) {
            let cLength = computeSize(tElem);
            let pLength = computeSize(tElem.parentNode);
            let pctg = cLength/pLength;
            if ((pctg > thresholdPctg)) {
                // If grandparent exists replace parent with this element
                // else, remove all siblings
                let grandparent = tElem.parentNode.parentNode;
                if(grandparent != undefined) 
                    grandparent.replaceChild(tElem.cloneNode(true), tElem.parentNode);
                else { 
                    let siblings = tElem.parentNode.childNodes;
                    for(let j=siblings.length - 1; j > -1; j--) {
                        if(siblings[j] !== tElem) {
                            tElem.parentNode.removeChild(siblings[j]);
                        }
                    }
                }
            }
            else {
            }
        }
    }
}

function reformatTag(cdoc, tagString) {

    let c = cdoc.getElementsByTagName(tagString);
    for(let i=0; i < c.length; i++) {
        c[i].removeAttribute('class');
        c[i].removeAttribute('style');
        c[i].removeAttribute('width');
        c[i].setAttribute('class', 'tranquility');
        
        // Exception for the preformatted text so that we can
        // apply only some of the formatting changes to preformatted text
        // for example, fontName must not be changes so that we have an
        // equal width character font for code readability, etc
        // 
        if (c[i].nodeName == "PRE") {
            c[i].setAttribute('class', 'tranquility_pre');
        }
    }
}


function computeSize(dElem) {

    // Compute size removes spaces to do a better job of true size calculations
    //
    if(dElem.innerHTML) {
        if(dElem.textContent) {
            return dElem.textContent.replace(/\s/g, '').length;
        }
        else if(dElem.innerText) {
            return dElem.innerText.replace(/\s/g, '').length;
        }
        else {
            return 0;
        }
    }
    else {
        return 0;
    }
}


function convertLinksAbsolute(node, baseURL) {
    let alinks = node.getElementsByTagName('A');    
    for(let i=0; i < alinks.length; i++) {
        // Fix where some pages with a "mail:" link fail when trying to construct
        // the new URL; wrap this in a try/catch to handle any links that cannot
        // be processed
        try {
            var absURL = new URL(alinks[i].href, baseURL);
            alinks[i].href = absURL.href;
        }
        catch(error) {
            console.log(error);
        }
    }
}


function getSupportingLinks(cDoc) {

    // Search for 'Single Page' links and load them in current window
    // Helps in simplifying the processing as well as in handling multi-page document

    let altString = browser.i18n.getMessage("singlePageString").split(",");
    let navString = browser.i18n.getMessage("navigationString").split(",");
    let navRegExp = /^\d+$/;
    
    let altURL;
    let altLink;
    let found = 0;

    let altlinks = cDoc.getElementsByTagName('A');
    // Insert all links into a temporary div for later use 
    let links_div = createNode(cDoc, {type: 'DIV', attr: { class:'tranquility_links', id:'tranquility_links' } });
    let nav_links_div = createNode(cDoc, {type: 'DIV', attr: { class:'tranquility_nav_links' } });
    let spacerString = "  ";
    let sp_elem = cDoc.createTextNode(spacerString);
    
    for(let i=0; i < altlinks.length; i++) {
        let altLinkClone = altlinks[i].cloneNode(true);
        // Replace the contents of the link with its text content
        // this can help cleanup images and other pointless tags/children
        // that can cause problems for tranquility
        altLinkClone.textContent = altLinkClone.textContent;
        removeWhiteSpaceComments(altLinkClone);
        //Collect any links that can be added to the "More Links" section
        if(altLinkClone.textContent.length >= 20) {
            let p_elem = createNode(cDoc, {type: 'P', attr: { class:'tranquility_links' } });
            p_elem.appendChild(altLinkClone.cloneNode(true));
            links_div.appendChild(p_elem.cloneNode(true));
        }
        // Collect any link that might be used for navigation in a multipage document
        let navstr = altLinkClone.textContent.replace(/\s/g, '');
        if(navstr && ((navString.indexOf(navstr.toUpperCase()) >= 0) || 
                      (navstr.search(navRegExp) != -1)) &&
          (!altLinkClone.getAttribute('onclick')) && 
          (altLinkClone.href) &&
          (altLinkClone.href != "#") &&
          (altLinkClone.href != (currentURL + "#")) &&
          (altLinkClone.href.substr(0,10) !== "javascript")) {
            nav_links_div.appendChild(altLinkClone.cloneNode(true));
            nav_links_div.appendChild(sp_elem.cloneNode(true));
        } 
    }
    nav_links_div = cleanupNavLinks(nav_links_div.cloneNode(true));
    return {links_div : links_div.cloneNode(true), 
            nav_links : nav_links_div.cloneNode(true) 
           };
}

function cleanupNavLinks(nlinks_div) {

    let nlinks = nlinks_div.getElementsByTagName('A');
    let nlinks_count = nlinks.length;
    let navRegExp = /^\d+$/;
    let nLinkExists = [];
    let intNavLinks = 0;

    for(let i=0; i < nlinks_count; i++) {
        let navStr = nlinks[i].textContent.replace(/\s/g, ''); 
        if(navStr.search(navRegExp) != -1)
            intNavLinks++;
    }

    for(let i=nlinks_count - 1; i > -1; i--) {
        let navStr = nlinks[i].textContent.replace(/\s/g, ''); 
        // Remove the link if the number within is greater than the total number
        // of navigation links collected.  This will eliminate arbitrary links
        // that have numbers within them
        //
        if((navStr.search(navRegExp) != -1) && (navStr > intNavLinks + 1))
            nlinks[i].parentNode.removeChild(nlinks[i]);
        // Remove links that are duplicates; some pages have navigation links at
        // the top and bottom of the page; no need for us to duplicate them
        //
        else if(nLinkExists[navStr] != undefined)
            nlinks[i].parentNode.removeChild(nlinks[i]);
        // Else remove comment style links from the navigation bar
        else if(nlinks[i].href.split("#")[0] == currentURL) {
            nlinks[i].parentNode.removeChild(nlinks[i]);
        }
        else {
            // Do nothing
        }
        nLinkExists[navStr] = 1;    
    }
    
    return nlinks_div;
}

function removeDuplicateAndBadLinks(cdoc, url, orig_links) {

    let encodedURL = encodeURIComponent(url.split("#")[0]);
    let re = new RegExp("^http:");

    let c = cdoc.getElementsByTagName('A');
    let bodyHrefs = [];
    for(let i=0; i < c.length; i++) {
        bodyHrefs[c[i].href] = 1;
    }

    let d = orig_links.getElementsByTagName('A');
    let moreHrefCounts = [];
    for(let i=0; i < d.length; i++) {
        if(moreHrefCounts[d[i].href] != undefined)
            moreHrefCounts[d[i].href] += 1;
        else
            moreHrefCounts[d[i].href] = 1;
    }

    let len = d.length;
    for(let j=0; j < len; j++) {
        let tElem = d[len-j-1];
        // Remove link if the "More Links" anchor node is either present in the main document
        // or if it is a #tag reference to some element in the main document
        if(bodyHrefs[tElem.href] != undefined) {
            tElem.parentNode.removeChild(tElem);
        }
        else if(tElem.href.substr(0,10) == "javascript") {
            tElem.parentNode.removeChild(tElem);
        }
        else if(encodeURIComponent(tElem.href.split("#")[0]) == encodedURL) {
            tElem.parentNode.removeChild(tElem);
        }
        else if(tElem.textContent.replace('^/s+', '').search(re) != -1) {
            tElem.parentNode.removeChild(tElem);
        }
        else if((moreHrefCounts[tElem.href] != undefined) && (moreHrefCounts[tElem.href] > 1)) {
            moreHrefCounts[tElem.href] -= 1;
            tElem.parentNode.removeChild(tElem);
        }
        else {
            // Nothing to do
        }
    }
    
    return orig_links.cloneNode(true);
}



function getAnchorNode(elem) {

    let urlString = elem.href;

    while((urlString == undefined) && (elem.parentNode != undefined)) {
        elem = elem.parentNode;     
        urlString = elem.href;
        if(urlString != undefined)
            return urlString;
    }
    return urlString;
}

function removeAnchorAttributes(cdoc) {

    let c = cdoc.getElementsByTagName('A');

    for(let i=0; i < c.length; i++) {

        // Do not process the tranquility_original_link_anchor
        //
        if (c[i].className == 'tranquility_original_link_anchor') {
            continue;
        }

        if(c[i].getAttribute('target')) {
            c[i].removeAttribute('target');
        }
        if(c[i].getAttribute('class')) {
            c[i].removeAttribute('class');
        }
        if(c[i].getAttribute('onmousedown')) {
            c[i].removeAttribute('onmousedown');
        }
        // Add all links to the 'tranquil_mode_links' to enable continuous browsing
        c[i].setAttribute('class', 'tranquil_browsing_mode_link');
    }    
}

function createNode(cdoc, props) {
    let thisNode = cdoc.createElement(props.type);
    let keys = Object.keys(props.attr);
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        thisNode.setAttribute(key, props.attr[key]);
    }
    return thisNode;
}

function getProgressBar(cdoc) {
    let pbar = cdoc.getElementById('tranquility_progress_bar');
    if (pbar == undefined) {
        pbar = createNode(cdoc, {type: 'DIV', attr: { class:'tranquility_progress_bar', id:'tranquility_progress_bar' } });
        pbar.style.visibility = 'hidden';
        if (cdoc.body != undefined) {
            cdoc.body.appendChild(pbar);
        }
    }
    return pbar;
}

function indexElements(indexMap, node) {

    if (node == null) return;

    indexMap[dfsIndex] = node;
    if (node.nodeType == 1) {
        node.setAttribute('data-dfsIndex', dfsIndex);
        node.setAttribute('data-origClassName', node.className);
    }
    dfsIndex += 1;
    let children = node.childNodes;
    for (let i = 0; i < children.length; i++) {
        indexElements(indexMap, children[i]);
    }
}

function cloneImages(cdoc, collection) {

    // This function also preserves the original width/height of the images
    // in data fields
    let images = cdoc.getElementsByTagName('IMG');
    for (let i = 0; i < images.length; i++) {
        if (images[i].src.substr(0,4) == "data") {
            continue;
        }
        let img = new Image();
        let idx = images[i].getAttribute('data-dfsIndex');
        img.src = images[i].src;
        img.setAttribute('data-dfsIndex', idx);
        img.alt = images[i].alt;

        collection[idx] = img;
        console.log(images[i].src + ": " + images[i].alt);
    }
}

function addBackElems(cdoc, tagName, bkpElems, indexMap) {

    let elems = cdoc.body.getElementsByTagName(tagName);
    let elemMap = {};
    for (let i = 0; i < elems.length; i++) {
        let idx = elems[i].getAttribute('data-dfsIndex');
        elemMap[idx] = i;
        //console.log(idx, elems[i]);
    }

    for (let key in bkpElems) {

        let elem = bkpElems[key];

        // Skip adding back element if the current cleanup has already
        // retained the original element
        //
        //console.log(elem.getAttribute('data-dfsIndex'), elem);
        if (key in elemMap) {
            //console.log("Found duplicate key...: ", key);
            continue;
        }

        insertByDFSIndex(elem, cdoc);
    }
}

function insertByDFSIndex(elem, cdoc) {

    let children = cdoc.body.getElementsByTagName("*");

    elem.className = 'tranquility';

    let nextSibling = null;
    let prevSibling = null;
    let prevSiblingIdx = -1;
    let elemIdx = parseInt(elem.getAttribute('data-dfsIndex'));
    console.log(elemIdx);
    for (let i = 0; i < children.length; i++) {
        if (children[i].nodeType == 1) {
            let idx = parseInt(children[i].getAttribute('data-dfsIndex'));
            if (idx < elemIdx && idx > prevSiblingIdx) {
                prevSibling = children[i];
                prevSiblingIdx = idx;
            }
            if (idx > elemIdx) {
                nextSibling = children[i];
                break;
            }
        }
        else {
        }
    }

    if (nextSibling != null) {
        nextSibling.insertAdjacentElement('beforebegin', elem);
    }
    else if (prevSibling != null) {
        prevSibling.insertAdjacentElement('afterend', elem);
    }
}


// Remove a node recursively based on the text-content of its parent
//
function removeNodeRecursive(thisNode) {
    let thisNodeTextLen = computeSize(thisNode);
    let parent = thisNode.parentNode;
    let parentTextLen = computeSize(parent);
    if (parentTextLen == thisNodeTextLen) {
        removeNodeRecursive(parent);
    }
    else {
        parent.removeChild(thisNode);
    }
}

// Remove any image elements that are not hidden, but have a height/width set to zero
//
function deleteZeroSizeImages(cdoc) {
    let images = cdoc.getElementsByTagName('IMG');
    for (let i = images.length-1; i >= 0; i--) {
        if (parseInt(images[i].getAttribute('height')) == 0 ||
            parseInt(images[i].getAttribute('width')) == 0 ||
            images[i].src.substr(0,4) == "data") {
            images[i].parentNode.removeChild(images[i]);
        }
    }
}

function requestZoomValue() {
    browser.runtime.sendMessage(
        {
            "action": "getZoomValue"
        });
}


function updateZoomValue(zoom) {
    console.log("Updating zoomValue to: " + zoom);
    zoomValue = zoom;
}


function cloneHElems(hdict, cdoc) {

    let hs = cdoc.getElementsByTagName("H1");
    for (let i = 0; i < hs.length; i++) {
        let elem = hs[i];
        let idx = elem.getAttribute('data-dfsIndex');
        hdict[idx] = elem.cloneNode(true);
    }
}

function getNodeIterator(root, regexp, attr) {

    return document.createNodeIterator(
        root,

        NodeFilter.SHOW_ALL,

        { acceptNode: function(node) {
            let nodeAttr = node.className;
            if (attr == "nodeName") {
                nodeAttr = node.nodeName;
            }
            if (regexp.test(nodeAttr)) {
                return NodeFilter.FILTER_ACCEPT;
            }
        }}
    );
}

/*
 * Assign tranquilize() as a listener for messages from the extension.
 * */
browser.runtime.onMessage.addListener(tranquilize);
