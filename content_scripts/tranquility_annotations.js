'use strict';

var browser = browser || chrome;

function addAnnotation() {

    let onGetting = function(result) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            let cDocBkp = document.cloneNode(true);
            let selObj = document.getSelection();
            let masker = document.getElementById('tranquility_masker');
            masker.style.visibility = 'visible';

            console.log("Entering getting promise within addAnnotation at: " + new Date());

            // Create the wrapper annotation span
            let parent_span = createNode(document, {type: 'SPAN', attr: { class:'tranquility_annotation', align:'right' } });
         
            // Separate the selection range to a new span and highlight it
            // using the annotation background color
            let sel_span = createNode(document, {type: 'SPAN', attr: { class:'tranquility_annotation_selection' } });
            let range = selObj.getRangeAt(0);
            sel_span.appendChild(range.extractContents());
            parent_span.appendChild(sel_span);
            range.insertNode(parent_span);
           
            // Create a form for entering the annotation;
            // if Submitted, then create annotation; else cancel
            let entryDiv = createNode(document, {type: 'DIV', attr: { class:'tranquility_annotation_entry' } });
            let note_width = result.tranquility_reading_width;
            let delta = (100 - note_width)/2;
            let target_width = Math.round(note_width * 0.8);
            entryDiv.style.width = target_width + "%";
            entryDiv.style.left = Math.round(delta + (0.1 * note_width)) + "%";
            document.body.appendChild(entryDiv);

            entryDiv.appendChild(document.createElement('p').cloneNode(true));
            
            let annotationText = createNode(document, {type: 'TEXTAREA', attr: { class:'tranquility_annotation_textarea', textAlign:'left' } });
            entryDiv.appendChild(annotationText);
            
            entryDiv.appendChild(document.createElement('p').cloneNode(true));
            
            let submitButton = createNode(document, {type: 'INPUT', attr: { type:'button', value:'Submit' } });
            entryDiv.appendChild(submitButton);
            
            let cancelButton = createNode(document, {type: 'INPUT', attr: { type:'button', value:'Cancel' } });
            entryDiv.appendChild(cancelButton);
                    
            submitButton.onclick = function() {

                let selectionSpan = parent_span.childNodes[0];
                selectionSpan.style.backgroundColor = result.tranquility_annotation_highlight_color;
                
                // Add a place holder annotation text for now; will enhance later
                // to allow users to edit this content
                let note_p = createNode(document, {type: 'P', attr: { class:'tranquility_annotation_text' } });
                note_p.textContent = annotationText.value;
                parent_span.appendChild(note_p);
                
                // Create an event listener to capture mouse click on the iframe (to hide if required)
                parent_span.addEventListener("click", handleAnnotationSelectionClickEvent, false);
                
                // delete the entry div
                entryDiv.parentNode.removeChild(entryDiv);
                let masker = document.getElementById('tranquility_masker');
                masker.style.visibility = 'hidden';
                
                // Save the updated content to the database
                let btn = document.getElementById('tranquility_offline_links_btn');
                // We could either be adding annotations to the offline content in which case
                // the URL key must be obtained from the 'data-active-link' attribute on tranquility_offline_links_btn
                // Or we could be adding annotations after the first run of Tranquility on that page
                // in which case the URL key is obtained from the currentURI.spec
                let url = null;
                if(btn.getAttribute('data-active-link')) {
                    url = btn.getAttribute('data-active-link');
                    }
                else {
                    url = currentURL;
                    btn.setAttribute('data-active-link', url);
                }
                            
                console.log("Before applying font preferences....");

                applyFontPreferences();
                // But save to database only if not in private browsing mode
                if (!browser.extension.inIncognitoContext) {
                    saveContentOffline(url, document.cloneNode(true));
                }
            };
            
            cancelButton.onclick = function() {
                // On cancellation, restore the document from the backup
                document.replaceChild(cDocBkp.documentElement, document.documentElement);
                addBackEventListeners();
            };
        }
    };

    console.log("Entering addAnnotation at: " + new Date());
    let getting = browser.storage.local.get(["tranquility_reading_width", 
                                             "tranquility_annotation_highlight_color", 
                                             "tranquility_link_color"],
                                            onGetting);
}

function createAnnotationNote(note_p, read_width, ycoord) {

    console.log("Creating annotation note...");
    let note_div = createNode(document, {type: 'DIV', attr: { class:'tranquility_annotation_note', id:'tranquility_annotation_note' } });
    note_div.style.visibility = 'hidden';
    note_div.addEventListener("click", handleAnnotationViewOrNoteClickEvent, true);
    document.body.appendChild(note_div);

    note_p.setAttribute('class', 'tranquility_annotation_note');
    note_div.appendChild(note_p);

    let delta = (100 - read_width)/2;
    let note_width = Math.round(read_width * 0.8);
    note_div.style.width = note_width + "%";
    note_div.style.left = Math.round(delta + (0.1 * read_width)) + "%";

    applyFontPreferences();
    return note_div;
}

function viewAnnotationNotes(read_width) {

    let view_notes_div = createNode(document, {type: 'DIV', attr: { class:'tranquility_view_notes', id:'tranquility_view_notes' } });
    //view_notes_div.style.visibility = 'hidden';
    view_notes_div.addEventListener("click", handleAnnotationViewOrNoteClickEvent, false);
    document.body.appendChild(view_notes_div);
    
    let emptyp = document.createElement('p');
    let hline = document.createElement('hr');
    
    let notes = document.getElementsByClassName('tranquility_annotation');
    for (let i=0; i < notes.length; i++) {
        let sel = notes[i].getElementsByClassName('tranquility_annotation_selection')[0].cloneNode(true);
        sel.setAttribute('class', 'tranquility_view_notes');
        let txt = notes[i].getElementsByClassName('tranquility_annotation_text')[0];
        if (txt) {
            view_notes_div.appendChild(emptyp.cloneNode(true));
            view_notes_div.appendChild(sel.cloneNode(true));
            let note_p = txt.cloneNode(true);
            note_p.setAttribute('class', 'tranquility_view_notes');
            let note = createNode(document, {type: 'BLOCKQUOTE', attr: { class:'tranquility_view_notes' } });
            note.appendChild(note_p.cloneNode(true));
            view_notes_div.appendChild(note.cloneNode(true));
            view_notes_div.appendChild(emptyp.cloneNode(true));
            view_notes_div.appendChild(hline.cloneNode(true));            
        }
    }

    if(notes.length == 0) {
        view_notes_div.textContent = browser.i18n.getMessage("noNotes");
    }
    
    let delta = (100 - read_width)/2;
    let note_width = Math.round(read_width * 0.8);
    view_notes_div.style.width = note_width + "%";
    view_notes_div.style.left = Math.round(delta + (0.1 * read_width)) + "%";

    applyFontPreferences();
    return view_notes_div;
}
