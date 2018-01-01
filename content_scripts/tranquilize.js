/*
 * Process the messages appropriately
 * 
 */

'use strict';
var browser = browser || chrome;
var currentURL = null;
var dfsIndex = 1;

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
    else if (request.tranquility_action == 'None') {
        return Promise.resolve({response: "Receive Do Nothing Message"});
    }
    else {
        console.log("Message not implemented: " + request.tranquility_action);
    }
}

function RunOnLoad() {
    currentURL = location.toString();
    // If we have already run tranquility, then just toggle back to the original webpage (un-tranquilize the page)
    if (document.body.getElementsByClassName("tranquility").length > 0) {
        // If this is an offline link, we need to get the data-active-link of the tranquility_offline_links_btn
        let btn = document.getElementById('tranquility_offline_links_btn');
        let url = null;
        if(btn.getAttribute('data-active-link')) {
            url = btn.getAttribute('data-active-link');
        }
        else {
            url = currentURL;
        }
        window.location.assign(url);
    }
    // If tranquility has not been run, then "tranquilize" the document
    else {
        // Stop loading the document if it has not completed loading
        if(document.readyState != "complete") {
            window.stop();
        }
        // Show a progress-bar to indicate activity and then process the request
        // bar will automatically disappear since the document will be replaced
        let pbar = getProgressBar(document);
        pbar.style.visibility = 'visible';
        processXMLHTTPRequest(currentURL, false);
    }
}

function RunOnSelection() {
    currentURL = location.toString();
   
    // Typically used when the page has at least partially loaded and user has selected some text
    // However this should work even if we are running on an already processed page; maybe the user wants to
    // prune the tranquilized content further and read just a portion of the article
    
    // Stop loading the document if it has not completed loading
    if(document.readyState != "complete") {
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
    if(document.readyState != "complete") {
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
    if (location.toString().substr(5) == 'https') {
        getURL = getURL.replace(/^http\:/, 'https:');
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
    console.log(url);
    oXHR.open("GET", getURL, true);
    oXHR.send(null);
}
          
function processResponse (oXHRDoc, thisURL, saveOffline) {

    console.log("Processing Response...");
    
    let parser = new DOMParser();
    let contentDoc = parser.parseFromString(oXHRDoc, "text/html");
    processContentDoc(contentDoc, thisURL, saveOffline);
}

function processContentDoc(contentDoc, thisURL, saveOffline) {


    // First get a dfs search to index every single element in the
    // document
    let indexMap = {};
    indexElements(indexMap, contentDoc.body);

    // Clone all the image nodes for later insertion
    let imgCollection = {};
    cloneImages(contentDoc.body, imgCollection);

    // Ensure that we set a base element before we replace the
    // web page with the new content; otherwise, relative URL
    // links will be based on the incorrect URL present in the
    // window.location 
    // Then call convertLinksAbsolute to convert all relative
    // links to absolute links so that these links will also
    // work if we save this document for reading later
    //
    let baseElem = createNode(contentDoc, {type: 'base', attr: { href: thisURL } });
    let heads = contentDoc.getElementsByTagName('head');
    for(let i = 0; i < heads.length; i++) {
        heads[i].appendChild(baseElem.cloneNode(true));
    }
    convertLinksAbsolute(contentDoc, thisURL);

    console.log("Processing document...");
            
    // Collect any supporting links before processing the webpage
    let supporting_links = getSupportingLinks(contentDoc);
    
    console.log("Got supporting links...");
    
    // Remove unnecessary whitespaces and comments
    removeWhiteSpaceComments(contentDoc);

    console.log("Removed white spaces and comments");
    
    // Cleanup the head and unnecessary tags
    let delTags = ["STYLE", "LINK", "META", "SCRIPT", "NOSCRIPT", "IFRAME", 
                   "SELECT", "DD", "INPUT", "TEXTAREA", "HEADER", "NAV",
                   "BUTTON", "PICTURE", "FIGURE"];
    for(let i=0; i<delTags.length; i++) {
        removeTag(contentDoc, delTags[i]);
    }
    
    console.log("Cleaned up unnecessary tags and headers");
   
    // Reformat the header and use custom css
    reformatHeader(contentDoc);

    console.log("Reformatted headers...");

    // Delete any hidden images (these are typically spacers)
    // Also, delete any content that has display = 'none' or visibility == 'hidden'
    // This was being done only for spacer images, but seems like a meaningful thing
    // to do for all elements, given that all scripts are also deleted in the Tranquility view
    let hiddenTags = ["DIV", "P", "IMG", "FIGURE", "PICTURE"];
    for(let i=0; i < hiddenTags.length; i++) {
        deleteHiddenElements(contentDoc, hiddenTags[i], imgCollection);
    }

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
    // Next run with minsize 200 (for a reduced subset of the tags)
    // Removed TD, TABLE, and DD for now
    pruneTagList = ["FORM", "DIV", "ARTICLE", "SECTION"];
    minSize = 200;
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
    // They mess up the padding and margins; use only in moderate pruning
    // if the threshold is < 0.99999
    for(let i=0; i < 5; i++) {
        replaceParent(contentDoc, "DIV",  0.99999);
        replaceParent(contentDoc, "SPAN", 0.99999);
    }
    
    console.log("Completed Replace parent loops");
        
    // Format the tags in a nice readable font/style using custom css loaded in header
    let reformatTagList = ["UL", "OL", "LI", "DIV", "SPAN", "P", "FONT", "BODY", "H1", 
                           "H2", "H3", "PRE", "TABLE", "ARTICLE", "SECTION"];
    for(let r=0; r < reformatTagList.length; r++) {
        reformatTag(contentDoc, reformatTagList[r]);
    }

    console.log("Completed reformatting tags");
   
    // Time to add back the images that we have cloned
    //
    addBackImages(contentDoc, imgCollection, indexMap);


    // Add the "Menu Items" to the top of the page
    let menu_div = createNode(contentDoc, {type: 'DIV', attr: { class:'tranquility_menu', id:'tranquility_menu', align:'center' } });

    // Finally, beautify with two container DIV's to center align the content
    let cdiv = createNode(contentDoc, {type: 'DIV', attr: { class:'tranquility_container', id:'tranquility_container', align:'center' } });    
    let cdiv_inner = createNode(contentDoc, {type: 'DIV', attr: { class:'tranquility_innercontainer', id:'tranquility_innercontainer' } });
    cdiv.appendChild(menu_div);
    cdiv.appendChild(cdiv_inner);
    contentDoc.body.appendChild(cdiv);


    // Add the masking div for effects
    let mdiv = createNode(contentDoc, {type: 'DIV', attr: { class:'tranquility_masker', id:'tranquility_masker' } });
    contentDoc.body.appendChild(mdiv);
        
    // Move the other divs into cdiv
    // Code modified from version 1.1.12 to take care of a corner case where the 
    // tranquility version had all <p> elements in reverse order
    let bchildren = contentDoc.body.childNodes;
    for(let i=0; i<bchildren.length; i++) {
        if((bchildren[i].id !== 'tranquility_container') && 
           (bchildren[i].id !== 'tranquility_innercontainer')) {
            cdiv_inner.appendChild(bchildren[i]);
            // decrement count since we have moved element i from the body to cdiv_inner
            // otherwise, we will only add alternate elements
            i--; 
        }
    }

    // Add the navigation links div into the tranquility_innercontainer
    //    
    if(computeSize(supporting_links["nav_links"]) > 0) {
        let p_elem = contentDoc.createElement("p");
        cdiv_inner.insertBefore(p_elem.cloneNode(true), cdiv_inner.firstChild);
        cdiv_inner.appendChild(p_elem.cloneNode(true));
        let bot_nav_links_div = supporting_links["nav_links"].cloneNode(true);
        bot_nav_links_div.setAttribute('id', 'tranquility_nav_links_bot');
        cdiv_inner.appendChild(bot_nav_links_div);
    }
    
    // Provide "more links" functionality
    //
    let links_button_div = createNode(contentDoc, {type: 'DIV', attr: { class:'tranquility_more_links_btn', id:'tranquility_more_links_btn' } });
    links_button_div.textContent = browser.i18n.getMessage("morelinks");
    menu_div.appendChild(links_button_div);

    // Remove links from the links_div that are already a part of the main document
    // This will prevent duplication of links and remove links that are out of
    // context as well as comment style links from repeating in the "More Links" div
    //
    let links_div = removeDuplicateAndBadLinks(contentDoc, thisURL, supporting_links["links_div"].cloneNode(true));

    // Append the links div
    links_div.style.visibility = 'hidden';
    contentDoc.body.appendChild(links_div);

    // Allow saving offline content (add "Read Later" button)
    //
    let readlater_button_div = createNode(contentDoc, {type: 'DIV', attr: { class:'tranquility_read_later_btn', id:'tranquility_read_later_btn'} });
    readlater_button_div.textContent = browser.i18n.getMessage("readlater");
    menu_div.appendChild(readlater_button_div);

    // Provide "Offline links" functionality
    //
    let offline_button_div = createNode(contentDoc, {type: 'DIV', attr: { class:'tranquility_offline_links_btn', id:'tranquility_offline_links_btn' } });
    offline_button_div.textContent = browser.i18n.getMessage("offlinelinks");
    offline_button_div.setAttribute('data-active-link', thisURL);
    menu_div.appendChild(offline_button_div);

    let offline_links_div = createNode(contentDoc, {type: 'DIV', attr: { class:'tranquility_offline_links', id:'tranquility_offline_links' } });
    offline_links_div.style.visibility = 'hidden';
    contentDoc.body.appendChild(offline_links_div);
  
    // Provide "View Notes" functionality
    //
    let viewnotes_button_div = createNode(contentDoc, {type: 'DIV', attr: { class:'tranquility_viewnotes_btn', id:'tranquility_viewnotes_btn' } });
    viewnotes_button_div.textContent = browser.i18n.getMessage("viewnotes");
    menu_div.appendChild(viewnotes_button_div);

    hideMenuDiv(contentDoc);
    
    console.log("Added all custom buttons and menus");
    
    // Remove target attribute from all anchor elements
    // this will enable opening the link in the same browser tab
    //
    removeAnchorAttributes(contentDoc);
    console.log("Removed Anchor attributes");
    console.log("Finished processing document");
    
    // Now, we are ready to replace the current webpage document with the processed contentDoc
    //
    // First remove all event listeners from the old body by replacing it with the clone
    let old_body = document.body;
    // sometimes, document has not even loaded the body; in these cases, there is nothing to do
    if (old_body) {
        let new_body = old_body.cloneNode(true);
        document.documentElement.replaceChild(new_body, old_body);
    }
    
    // Next replace the documentElement with the processed contentDoc
    document.replaceChild(contentDoc.documentElement, document.documentElement);

    // Finally apply all preferences and add Event listeners
    applyAllTranquilityPreferences();
    addBackEventListeners();

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
        if(cnodes[i].nodeType == 8) {
            cnodes[i].parentNode.removeChild(cnodes[i]);
        }
    }
}

function removeTag(cdoc, tagString) {

    let c = cdoc.getElementsByTagName(tagString);
    let len = c.length;
    let tElem;
    for(let dt=0; dt < len; dt++) {
        tElem = c[len-dt-1];
        // Do not delete iframes with links to youtube videos
        if((tagString == "IFRAME") && (tElem.src.search(/youtube/) != -1)) {
            continue;
        }
        
        // Do not delete this element if it is either a H1 tag 
        //(or contains child elements which are H1)
        let h1elems = tElem.getElementsByTagName("H1");
        if(tElem.nodeName == "H1" || h1elems.length > 0) 
            continue;

        if(tElem.id == undefined || tElem.id.substr(0,11) !== "tranquility") {
            tElem.parentNode.removeChild(tElem);
        }
    }
}

function reformatHeader(cdoc) {
    
    let heads = cdoc.getElementsByTagName('head');
    for(let i=0; i < heads.length; i++) {
        let hChildren = heads[i].getElementsByTagName("*");
        let titleNodeCount = 0;
        while(hChildren.length > titleNodeCount) {
            if (hChildren[titleNodeCount].nodeName !== "TITLE") {
                heads[i].removeChild(hChildren[titleNodeCount]);
            }
            else {
                titleNodeCount++;
            }
        }
    }    
}

function deleteHiddenElements(cdoc, tagString, imgCollection) {
    // Remove elements that have display==none or visibility==hidden
    let elems = cdoc.getElementsByTagName(tagString);
    for(let i=elems.length - 1; i >=0;  i--)  {
        if(((elems[i].style.visibility != undefined) && 
            (elems[i].style.visibility == 'hidden')) ||
           ((elems[i].style.display != undefined) && 
            (elems[i].style.display == 'none'))) {
            if (tagString == 'IMG') {
                if (elems[i].src in imgCollection) {
                    delete imgCollection[elems[i].src];
                }
            }
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

        // If the DIV has a H1 child, then we want to retain the article
        // heading and not delete it.
        let h1elems = tElem.getElementsByTagName("H1");
        if(h1elems.length > 0) 
            continue;

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
                        if (images[k].src in imgCollection) {
                            delete imgCollection[images[k].src];
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
        var absURL = new URL(alinks[i].href, baseURL);
        alinks[i].href = absURL.href;
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

    let nlinks = nlinks_div.getElementsByTagName('a');
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

    let c = cdoc.getElementsByTagName('a');
    let bodyHrefs = [];
    for(let i=0; i < c.length; i++) {
        bodyHrefs[c[i].href] = 1;
    }

    let d = orig_links.getElementsByTagName('a');
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

function toggleMenuDisplay(cdoc) {

    let expand_menu_btn = cdoc.getElementById('tranquility_expand_menu_btn');
    if (expand_menu_btn != undefined) {
        showMenuDiv(cdoc);
    }
    else {
        hideMenuDiv(cdoc);
    }
}


function showMenuDiv(cdoc) {
    let menu_div = cdoc.getElementById('tranquility_menu');
    menu_div.style.height = '50px';
    menu_div.style.opacity = 1;
    let menu_items = menu_div.childNodes;
    for(let i=0; i < menu_items.length; i++) {
        menu_items[i].style.visibility = 'visible';
    };

    // Delete the expand menu button and trigger a hide of the menu 
    // within 'hideInTime' milliseconds
    let hideInTime = 10000;
    let expand_menu_btn = cdoc.getElementById('tranquility_expand_menu_btn');
    if(expand_menu_btn != undefined) {
        expand_menu_btn.parentNode.removeChild(expand_menu_btn);
        setTimeout(function() {
            hideMenuDiv(cdoc);
        }, hideInTime);
    }

}


function hideMenuDiv(cdoc) {

    // This is the setTimeout function for hiding menu after loading a page
    // either from the database or during the first tranquility conversion
    
    let menu_div = cdoc.getElementById('tranquility_menu');
    // Hide all the menu items and reduce its height
    let menu_items = menu_div.childNodes;
    for(let i=0; i < menu_items.length; i++) {
        menu_items[i].style.visibility = 'hidden';
    }
    menu_div.style.height = '0px';
    menu_div.style.opacity = 0.1;

    
    // Provide a simple button to expand the menu if it is auto-minimized
    let expandMenuString = browser.i18n.getMessage("expandMenuString");
    let expand_menu_btn = cdoc.getElementById('tranquility_expand_menu_btn');
    if (expand_menu_btn == undefined) {
        let expand_menu_btn = createNode(cdoc, {type: 'DIV', attr: { title:expandMenuString, class:'tranquility_expand_menu_btn', 
                                                                           id:'tranquility_expand_menu_btn' } });
        expand_menu_btn.textContent = "(+)";
        expand_menu_btn.addEventListener("click", handleExpandMenuButtonClickEvent, false);
        cdoc.body.appendChild(expand_menu_btn);
    }
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


function hideLinksDiv(cdoc) {

    let target = cdoc.getElementById('tranquility_links');
    let masker = cdoc.getElementById('tranquility_masker');
    if(target != undefined) { 
        target.style.visibility = 'hidden';
    }
    if(masker != undefined) {
        masker.style.visibility = 'hidden';
    }
}


function hideOfflineLinksDiv(cdoc) {

    let target = cdoc.getElementById('tranquility_offline_links');
    let masker = cdoc.getElementById('tranquility_masker');
    if(target != undefined) { 
        target.style.visibility = 'hidden';
    }
    if(masker != undefined) {
        masker.style.visibility = 'hidden';
    }
}


function removeAnchorAttributes(cdoc) {

    let c = cdoc.getElementsByTagName('a');

    for(let i=0; i < c.length; i++) {
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

    indexMap[dfsIndex] = node;
    if (node.nodeType == 1) {
        node.setAttribute('data-dfsIndex', dfsIndex);
    }
    dfsIndex += 1;
    let children = node.childNodes;
    for (let i = 0; i < children.length; i++) {
        indexElements(indexMap, children[i]);
    }
}

function cloneImages(cdoc, collection) {

    let images = cdoc.getElementsByTagName('img');
    for (let i = 0; i < images.length; i++) {
        collection[images[i].src] = images[i].cloneNode(true);
    }
}

function addBackImages(cdoc, imgs, indexMap) {

    let images = cdoc.body.getElementsByTagName('img');
    let imgMap = {};
    for (let i = 0; i < images.length; i++) {
        imgMap[images[i].src] = 1;
    }

    let children = cdoc.body.getElementsByTagName('*');

    for (let key in imgs) {

        // Skip adding back image if the current cleanup has already
        // retained the original image
        //
        if (key in imgMap) {
            continue;
        }

        let img = imgs[key];

        // Should we include images without alt text?  Maybe these
        // are not important and/or are advertisment/unrelated images?
        //
        //if (img.alt.length == 0) {
        //    continue;
        //}

        let nextSibling = null;
        let prevSibling = null;
        let prevSiblingIdx = -1;
        let imgIdx = parseInt(img.getAttribute('data-dfsIndex'));
        for (let i = 0; i < children.length; i++) {
            if (children[i].nodeType == 1) {
                let idx = parseInt(children[i].getAttribute('data-dfsIndex'));
                if (idx < imgIdx && idx > prevSiblingIdx) {
                    prevSibling = children[i];
                    prevSiblingIdx = idx;
                }
                if (idx > imgIdx) {
                    nextSibling = children[i];
                    break;
                }
            }
            else {
            }
        }

        if (nextSibling != null) {
            nextSibling.insertAdjacentElement('beforebegin', img);
        }
        else if (prevSibling != null) {
            prevSibling.insertAdjacentElement('afterend', img);
        }
    }
}


/*
 * Assign tranquilize() as a listener for messages from the extension.
 * */
browser.runtime.onMessage.addListener(tranquilize);
