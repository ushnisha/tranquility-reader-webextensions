'use strict';

var browser = browser || chrome;

function saveContentOffline(thisURL, cdoc) {
    
    let doctitle = cdoc.title;
    if(doctitle == undefined) {
        doctitle = thisURL;
    }
    let indata = {url: null, title: null, contentDoc: null, dateCreated: null};
    indata.url = thisURL;
    indata.title = doctitle;
    let s = new XMLSerializer();
    indata.contentDoc = s.serializeToString(cdoc); 
    indata.dateCreated = new Date();
    
    browser.runtime.sendMessage(
      {
          "action": "savetoDB",
          "db_data": indata
      });
}      


function requestOfflinePagesList() {
    browser.runtime.sendMessage(
      {
          "action": "getOfflinePagesList"
      });
}

function requestAllOfflineContent() {
    browser.runtime.sendMessage(
      {
          "action": "getAllOfflineContent"
      });
}
    
function displayOfflinePages(offline_data) {

    document.body.addEventListener("click", handleClickEvent, false);
    appendOfflinePageDetails(offline_data);
}

function appendOfflinePageDetails(offline_data) {
        
    console.log("Got to the point of displaying offline data...");
    
    // Since we can display offline pages even when not in tranquility mode
    // check to see if masker div exists; if not, create it
    let masker_div = document.getElementById('tranquility_masker');
    if (masker_div == undefined) {
        // Add the masking div for effects
        let mdiv = createNode(document, {type: 'DIV', attr: { class:'tranquility_masker', id:'tranquility_masker' } });
        document.body.appendChild(mdiv);
    }
    
    let links_div = document.getElementById('tranquility_offline_links');
    // If div exists, delete and recreate children from IndexedDB
    if(links_div) {
        while( links_div.hasChildNodes() ){
            links_div.removeChild(links_div.lastChild);
        }
    }
    // Else create the div afresh
    else {
        links_div = createNode(document, {type: 'DIV', attr: { class:'tranquility_offline_links', id:'tranquility_offline_links' } });
        document.body.appendChild(links_div);
    }

    let keys = Object.keys(offline_data);
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let p_elem = createNode(document, {type: 'P', attr: { class:'tranquility_offline_link', id:key } });
        let del_img = createNode(document, {type: 'IMG', attr: { class:'tranquility_delete_offline_link_img', href:key,
                                                                 height: '20px', width: '20px', 
                                                                 src: browser.extension.getURL("icons/delete_icon.png") } });
        let del_a_elem = createNode(document, {type: 'A', attr: { class:'tranquility_delete_offline_link', href:key } });
        del_a_elem.appendChild(del_img);
        del_a_elem.addEventListener("click", handleDeleteOfflineLinkClickEvent, false);
        p_elem.appendChild(del_a_elem);

        let a_elem = createNode(document, {type: 'A', attr: { class:'tranquility_offline_link', href:key } });
        a_elem.textContent = "  " + offline_data[key];
        a_elem.addEventListener("click", handleLoadOfflineLinkClickEvent, false);
        p_elem.appendChild(a_elem);
        links_div.appendChild(p_elem);
    }
    applyFontPreferences();
    links_div = document.getElementById('tranquility_offline_links');
    links_div.style.visibility = 'visible';
}


function requestDocFromDB(thisURL) {
    console.log("Requesting doc from DB: " + thisURL);
    browser.runtime.sendMessage(
      {
          "action": "getOfflineData",
          "url": thisURL
      });
}


function displayDocFromDB(cached_doc, thisURL) {

    console.log("Entered displayDocFromDB function");
    let parser = new DOMParser();
    let doc = parser.parseFromString(cached_doc, "text/xml");
    
    // Delete existing base elements and include new ones with 'thisURL'
    // as the base URL; this helps handle saved/imported offline documents
    // that continue to have relative links
    let bases = doc.getElementsByTagName("base");
    for (let i=0; i < bases.length; i++) {
        bases[i].parentNode.removeChild(bases[i]);
    }
    
    let baseElem = createNode(document, {type: 'BASE', attr: { href:thisURL } });
    let heads = doc.getElementsByTagName('head');
    for(let i = 0; i < heads.length; i++) {
        heads[i].appendChild(baseElem.cloneNode(true));
    }
    convertLinksAbsolute(doc, thisURL);
    
    // Handle cases where offline documents where links were not updated
    // to support tranquil_browsing_mode
    removeAnchorAttributes(doc);

    // Now we can replace the document with the saved offline document
    // from the indexedDB and process the document further
    document.replaceChild(doc.documentElement, document.documentElement);
    applyAllTranquilityPreferences();
    let btn = document.getElementById('tranquility_offline_links_btn');
    btn.setAttribute('data-active-link', thisURL);

    // Remove the progress bar; don't need it any longer
    let pbar = document.getElementById("tranquility_progress_bar");
    if (pbar) {
        pbar.parentNode.removeChild(pbar);
    }

    addBackEventListeners();
    hideMenuDiv(document);
}


function displayExportLink(offline_data) {
    
    console.log("Got to the point of displaying offline data...");
        
    let links_div = document.getElementById('tranquility_offline_links');
    // If div exists, delete and recreate children from IndexedDB
    if(links_div) {
        while( links_div.hasChildNodes() ){
            links_div.removeChild(links_div.lastChild);
        }
    }
    // Else create the div afresh
    else {
        links_div = createNode(document, {type: 'DIV', attr: { class:'tranquility_offline_links', id:'tranquility_offline_links' } });
        links_div.style.visibility = 'hidden';
        document.body.appendChild(links_div);
    }

    let output_str = JSON.stringify(offline_data);
    let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(output_str);

    let dt = new Date();
    let dtStr = dt.toISOString();
    dtStr = dtStr.replace(/\-/g, "").replace(/T/, "_").replace(/\:/g, "").substr(0,15);
    let export_file_name = "tranquility_export_data_" +  dtStr + ".json";
    
    let export_link = createNode(document, {type: 'A', attr: { class:'tranquility_offline_content_export_link', href:dataUri, download:export_file_name } });
    export_link.textContent = browser.i18n.getMessage("exportNotesLinkContent");;
   
    links_div.appendChild(export_link);
    export_link.click();
}


function displayImportPage() {
    
    console.log("Got to the point of importing offline data...");
        
    let links_div = document.getElementById('tranquility_offline_links');
    // If div exists, delete and recreate children from IndexedDB
    if(links_div) {
        while( links_div.hasChildNodes() ){
            links_div.removeChild(links_div.lastChild);
        }
    }
    // Else create the div afresh
    else {
        links_div = createNode(document, {type: 'DIV', attr: { class:'tranquility_offline_links', id:'tranquility_offline_links' } });
        links_div.style.visibility = 'visible';
        document.body.appendChild(links_div);
    }

    let import_input = createNode(document, {type: 'INPUT', attr: { class:'tranquility_offline_content_import_input', 
                                                                    id:'tranquility_offline_content_import_input',
                                                                    type:'file', accept:'.json' } });
    import_input.style.visibility = 'hidden';
    import_input.addEventListener('change', handleImportInputClickEvent);
    
    let import_label = createNode(document, {type: 'LABEL', attr: { class:'tranquility_offline_content_import_label', 
                                                                    id:'tranquility_offline_content_import_label',
                                                                    for:'tranquility_offline_content_import_input' } });
    import_label.textContent = browser.i18n.getMessage("importNotesLabelContent");;
    import_label.style.color = '#0000FF';
    links_div.appendChild(import_label);
    links_div.appendChild(import_input);
}


function requestDelDocFromDB(thisURL) {
    
    console.log("Requesting deletion of: " + thisURL);
    browser.runtime.sendMessage(
      {
          "action": "DeleteDocFromDB",
          "url": thisURL
      });
}

function delDocFromDB(thisURL) {
    
    console.log("Trying to remove link for: " + thisURL);
    let links_p = document.getElementById(thisURL);
    links_p.parentNode.removeChild(links_p);
}

function loadOfflineContentInNewTab() {
    browser.runtime.sendMessage(
      {
          "action": "RunTranquilityViewOfflinePages"
      });
}
