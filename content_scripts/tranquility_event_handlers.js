'use strict';

var browser = browser || chrome;

// Process clicking on the "Read Later" button
function handleReadLaterButtonClickEvent(event) {    
    event.stopPropagation();
    
    // Check to ensure that we are not in private browsing mode
    if (browser.extension.inIncognitoContext) {
        alert(browser.i18n.getMessage("readLaterNotSupportedString"));
    }
    else {
        // Open the indexedDB and add link and content to the db for offline reading
        let pbar = getProgressBar(document);
        pbar.style.visibility = 'visible';
        saveContentOffline(currentURL, document.cloneNode(true));
        setTimeout(function() {
            pbar.style.visibility = 'hidden';
        }, 1000);
    }
}

// Process clicking on the "Offline Links" button
function handleOfflineLinksButtonClickEvent(event) {
    event.stopPropagation();
    
    if (browser.extension.inIncognitoContext) {
        alert(browser.i18n.getMessage("readLaterNotSupportedString"));
    }
    else {
        let target = document.getElementById('tranquility_offline_links');
        let masker = document.getElementById('tranquility_masker');
        if(target != undefined) {
            if(target.style.visibility == 'hidden') {
                target.style.visibility = 'visible';
                masker.style.visibility = 'visible';
                requestOfflinePagesList();
                return;
            }
            if(target.style.visibility == 'visible') {
                target.style.visibility = 'hidden';
                masker.style.visibility = 'hidden';
            }
        }
    }
}


// Process clicking on the "More Links" button
function handleMoreLinksButtonClickEvent(event) {    
    event.stopPropagation();

    let target = document.getElementById('tranquility_links');
    let masker = document.getElementById('tranquility_masker');
    if(target != undefined) {
        if(target.style.visibility == 'hidden') {
            target.style.visibility = 'visible';
            masker.style.visibility = 'visible';
            event.stopPropagation();
            return;
        }
        if(target.style.visibility == 'visible') {
            target.style.visibility = 'hidden';
            masker.style.visibility = 'hidden';
        }
    }
}


// Process clicking on the "View Notes" button
function handleViewNotesButtonClickEvent(event) {
    event.stopPropagation();
    
    let onGetting = function(result) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {        
            let view_notes_div = viewAnnotationNotes(result.tranquility_reading_width);
            let masker = document.getElementById('tranquility_masker');            
            view_notes_div.style.visibility = 'visible';
            masker.style.visibility = 'visible';
        }
    };
    
    let getting = browser.storage.local.get("tranquility_reading_width", onGetting);
}


// if clicked on an annotation, toggle the visibility of the annotation note
function handleAnnotationSelectionClickEvent(event) {
    // handle the case where a link within an annotation seleciton is clicked
    //
    let urlStr = getAnchorNode(event.target);
    if (urlStr != undefined) {
        handleClickEvent(event);
    }
    else {
        event.stopPropagation();
        
        let onGetting = function(result) {        
            if (browser.runtime.lastError) {
                console.log(browser.runtime.lastError);
            }
            else {            
                console.log(event.target);
                console.log(event.target.nextSibling);
                let orig_note = event.target.nextSibling;
                if (orig_note != undefined) {
                    let notep = orig_note.cloneNode(true);
                    // Set the user data flag on the original note; 
                    //this is used to update a note that is edited.
                    orig_note.setAttribute('data-active-note', 'true');
                    let note_div = createAnnotationNote(notep,
                                                        result.tranquility_reading_width,
                                                        event.pageY);
                    let masker = document.getElementById('tranquility_masker');
                    note_div.style.visibility = 'visible';
                    note_div.contentEditable = 'true';
                    masker.style.visibility = 'visible';
                }
            }
        };

        let getting = browser.storage.local.get("tranquility_reading_width", onGetting);
    }
}


// if clicked on an annotation, do nothing; clicking outside should delete annotation
// if clicked on aggregated annotations view , do nothing; clicking outside should delete view
function handleAnnotationViewOrNoteClickEvent(event) {
    event.stopPropagation();
    if(event.target.className == 'tranquility_annotation_note')
        event.target.setAttribute('contentEditable', 'true');
    event.target.focus();
}


// If clicked on the "expand menu div" button, then expand the menu div
function handleExpandMenuButtonClickEvent(event) {    
    showMenuDiv(document);
}
    

function handleLoadOfflineLinkClickEvent(event) {
    event.preventDefault();
    console.log("Stopped Propagation");
    event.stopPropagation();
    console.log("Got into load Offline Link DIV click event handler");
    let urlStr = getAnchorNode(event.target);
    if (urlStr != undefined) {
        console.log("urlStr is defined: " + urlStr);
        let pbar = getProgressBar(document);
        pbar.style.visibility = 'visible';
        requestDocFromDB(urlStr);
    }
}

function handleDeleteOfflineLinkClickEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    console.log("Got into delete Offline Link DIV click event handler");
    let urlStr = getAnchorNode(event.target);
    if (urlStr != undefined) {
        console.log("urlStr is defined!");
        console.log("Stopped Propagation");
        requestDelDocFromDB(urlStr);
    }
}

function handleImportInputClickEvent(event) {
    console.log("Handling the import offline content event...");
    let input_file = event.target.files[0];
    console.log(input_file);
    let reader = new FileReader();
    reader.onload = 
        function(e) {
            let inputStr = e.target.result;
            try {
                let input_data = JSON.parse(inputStr);
                let offline_docs = input_data["export_array"];
                for(let i = 0; i < offline_docs.length; i++) {
                    browser.runtime.sendMessage(
                    {
                        "action": "savetoDB",
                        "db_data": offline_docs[i]
                    });
                }
                requestOfflinePagesList();
            }
            catch (e) {
                console.log(e);
            }
        };
    reader.readAsText(input_file);
}


function handleClickEvent(event) {

    let urlStr = getAnchorNode(event.target);
    // Handle tranquility_continuous browsing
    //
    if (urlStr != undefined) {
        // First check the link to see if it is a "#" reference; that is, it is
        // pointing to just another tag/location within the current page.  In this
        // case, we don't run tranqulity, but perform the default browser action
        // and continue
        //
        if (urlStr.split("#")[0] == currentURL.split("#")[0]) {
            console.log("Do nothing - we want to navigate to an anchor in the current page...");
        }
        // Else...
        // Do not load link - instead request background page to load it and then
        // run tranquility
        else {
            event.preventDefault();
            event.stopPropagation();
            console.log("Entered click event of more links link....");
            console.log(urlStr);
            currentURL = urlStr;
            let pbar = getProgressBar(document);
            pbar.style.visibility = 'visible';
            processXMLHTTPRequest(currentURL, false);
        }
    }
    else if((document.getElementById('tranquility_links') != undefined) &&
       (document.getElementById('tranquility_links').style.visibility == 'visible')) {
        hideLinksDiv(document);  
    }
    else if((document.getElementById('tranquility_offline_links') != undefined) &&
            (document.getElementById('tranquility_offline_links').style.visibility == 'visible')) {
        hideOfflineLinksDiv(document);  
    }
    else if(document.getElementById('tranquility_annotation_note') != undefined) {
        // First, check to see if the note has been modified/edited
        // If yes, update the original note element and update the DB
        let note = document.getElementById('tranquility_annotation_note');
        let orig_note;
        let orig_notes = document.getElementsByClassName('tranquility_annotation_text');
        for(let i=0; i < orig_notes.length; i++) {
            if ((orig_notes[i].getAttribute('data-active-note') != undefined && 
                 orig_notes[i].getAttribute('data-active-note') == "true")) {
                orig_note = orig_notes[i];
            }
        }
        
        if(orig_note != undefined) {
            orig_note.setAttribute('data-active-note', 'false');
            if(orig_note.textContent != note.textContent) {
                let note_p = note.childNodes;
                let newText = "";
                for(let i=0; i < note_p.length; i++) {
                    newText = newText + note_p[i].textContent + "\n";
                }
                orig_note.textContent = newText;

                let masker = document.getElementById('tranquility_masker');
                masker.style.visibility = 'hidden';            
                note.parentNode.removeChild(note);
                
                let btn = document.getElementById('tranquility_offline_links_btn');
                let url =  btn.getAttribute('data-active-link');
                saveContentOffline(url, documentument.cloneNode(true));                    
            }
        }
        else {
            // Next, delete the note view and hide the masker
            let masker = document.getElementById('tranquility_masker');
            masker.style.visibility = 'hidden';            
            note.parentNode.removeChild(note);
        }
    }
    else if(document.getElementById('tranquility_view_notes') != undefined) {
        let masker = document.getElementById('tranquility_masker');
        masker.style.visibility = 'hidden';            
        let note = document.getElementById('tranquility_view_notes');
        note.parentNode.removeChild(note);
    }
}

function addBackEventListeners() {

    console.log("Adding back all event listeners...");
    // Add back click event listener to body 
    document.body.addEventListener("click", handleClickEvent, false);

    let eventHandlersMap = {
        "tranquility_more_links_btn"        : handleMoreLinksButtonClickEvent, 
        "tranquility_offline_links_btn"     : handleOfflineLinksButtonClickEvent,
        "tranquility_read_later_btn"        : handleReadLaterButtonClickEvent,
        "tranquility_viewnotes_btn"         : handleViewNotesButtonClickEvent,
        "expand_menu_btn"                   : handleExpandMenuButtonClickEvent,
        "tranquility_annotation"            : handleAnnotationSelectionClickEvent,
        "tranquility_annotation_note"       : handleAnnotationViewOrNoteClickEvent,
        "tranquility_view_notes"            : handleAnnotationViewOrNoteClickEvent,
        "tranquility_delete_offline_link"   : handleDeleteOfflineLinkClickEvent,
        "tranquility_offline_link"          : handleLoadOfflineLinkClickEvent,
        "tranquility_expand_menu_btn"       : handleExpandMenuButtonClickEvent

    };

    // Add back click event listener to each of the eventElements
    let keys = Object.keys(eventHandlersMap);
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let matching = document.getElementsByClassName(key);
        console.log("Adding event listeners for: " + key);
        for (let i=0; i < matching.length; i++) {
            let thisElement = matching[i];
            if(thisElement != undefined) {
                thisElement.addEventListener("click", eventHandlersMap[key], false);
            }
        }
    }            
}
