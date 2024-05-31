/**
 **********************************************************************
 * Tranquility Reader - A Firefox Webextension that cleans up
 * cluttered web pages
 **********************************************************************

   Copyright (c) 2012-2024 Arun Kunchithapatham

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

function create_ui_elements(contentDoc, supporting_links, thisURL) {

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
        bot_nav_links_div.style.columnSpan = "all"; // span navigation links across all columns
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

    // Add a div to hold some useful links/icons/functionality
    let quick_tools_div = createNode(contentDoc, {type: 'DIV', attr: {class:'tranquility_quick_tools_div', id:'tranquility_quick_tools_div' } });
    contentDoc.body.insertBefore(quick_tools_div, contentDoc.body.firstChild);

    // Add a link to the preferences page for quick access rather than to go through about:addons
    let prefs_link_div = createNode(contentDoc, {type: 'DIV', attr: {class:'tranquility_prefs_link_div', id:'tranquility_prefs_link_div' } });
    prefs_link_div.setAttribute('title', browser.i18n.getMessage("prefslink"));
    let prefs_symbol = '\u2699';
    prefs_link_div.textContent = prefs_symbol;
    prefs_link_div.addEventListener("click", handleShowPreferencesClickEvent, false);
    quick_tools_div.appendChild(prefs_link_div);

    // Add a link to the original webpage for quick navigation/copying at the top of the page
    let original_link_div = createNode(contentDoc, {type: 'DIV', attr: {class:'tranquility_original_link_div', id:'tranquility_original_link_div' } });
    original_link_div.setAttribute('title', browser.i18n.getMessage("originallink"));
    let original_link_anchor = createNode(contentDoc, {type: 'A', attr: {class:'tranquility_original_link_anchor', id:'tranquility_original_link_anchor' } });
    original_link_anchor.href = thisURL;
    original_link_anchor.alt = browser.i18n.getMessage("originallink");
    let link_symbol = '\u26D3';
    original_link_anchor.textContent = link_symbol;
    original_link_div.appendChild(original_link_anchor);
    quick_tools_div.appendChild(original_link_div);

    // Add a button to save page as PDF file
    //
    console.log(osVersion);
    if (osVersion != null && osVersion != 'android') {
        console.log("Adding Save as PDF icon...");
        let saveaspdf_div = createNode(contentDoc, {type: 'DIV', attr: {class:'tranquility_saveaspdf_div', id:'tranquility_saveaspdf_div' } });
        saveaspdf_div.setAttribute('title', browser.i18n.getMessage("saveaspdf"));
        let saveaspdf_img = createNode(contentDoc, {type: 'IMG', attr: {class:'tranquility_saveaspdf_img', id:'tranquility_saveaspdf_img', height: '40px', width:'40px', src: browser.runtime.getURL("icons/tranquility_pdf.png")}});
        saveaspdf_img.alt = browser.i18n.getMessage("saveaspdf");
        saveaspdf_div.appendChild(saveaspdf_img);
        saveaspdf_div.addEventListener("click", handleSaveAsPDFClickEvent, false);
        quick_tools_div.appendChild(saveaspdf_div);
    }

    // Adding custom navigation buttons for page-up and page-down scrolling
    //
    let page_down_div = createNode(contentDoc, {type: 'DIV', attr: {class: 'tranquility_page_down_div', id: 'tranquility_page_down_div' } });
    page_down_div.setAttribute('title', browser.i18n.getMessage("pageDown"));
    page_down_div.textContent = '\u226b';
    page_down_div.addEventListener("click", handlePageDownClickEvent, false);
    contentDoc.body.insertBefore(page_down_div, contentDoc.body.firstChild);

    let page_up_div = createNode(contentDoc, {type: 'DIV', attr: {class: 'tranquility_page_up_div', id: 'tranquility_page_up_div' } });
    page_up_div.setAttribute('title', browser.i18n.getMessage("pageUp"));
    page_up_div.textContent = '\u226a';
    page_up_div.addEventListener("click", handlePageUpClickEvent, false);
    contentDoc.body.insertBefore(page_up_div, contentDoc.body.firstChild);

    console.log("Added all custom buttons and menus");
    
    // Create a div to list the originalURL explicity at the top of the article
    //
    let original_url_div = createNode(contentDoc, {type: 'DIV', attr: {class:'tranquility_annotation_selection', id:'tranquility_original_url_div' } });
    original_url_div.textContent = "Source : " + thisURL;
    original_url_div.style.columnSpan = "all"; // span original_url_div across all columns
    cdiv_inner.insertBefore(original_url_div, cdiv_inner.firstChild);

    // span all H1 elements across all columns
    //
    let h1_elems = document.documentElement.getElementsByTagName("H1");
    for(let i=0; i < h1_elems.length; i++) {
        h1_elems[i].style.columnSpan = "all";
    }

    toggle_ui_controls_visibility();

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
    menu_div.style.height = currentFontSize * 3 + 'px';
    menu_div.style.opacity = 1;
    let menu_items = menu_div.childNodes;
    for(let i=0; i < menu_items.length; i++) {
        menu_items[i].style.visibility = 'visible';
        menu_items[i].style.height = Math.round(currentFontSize * 1.4) + 'px';
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

