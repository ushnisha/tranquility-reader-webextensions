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

function applyAllTranquilityPreferences() {
    applyTranquilityCSS();
    applyBackgroundColorPreferences();
    applyFontPreferences();
    applyFontColorPreferences();
    applyLinkColorPreferences();
    applyAnnotationHighlightColorPreferences();
    applyReadingWidthPreferences();
    applyNumColumnsPreferences('defaultMode');
    applyTextJustificationPreferences();
    applyLineHeightPreferences();
    applyImageDisplayPreferences();
}

function applyTranquilityCSS() {
    let hlink = createNode(document, {type: 'LINK', attr: { href:browser.runtime.getURL("css/tranquility.css"), rel:'stylesheet', type:'text/css' } });
    let heads = document.getElementsByTagName('HEAD');
    for(let i=0; i < heads.length; i++) {
        heads[i].appendChild(hlink);
    }
}

function applyBackgroundColorPreferences() {
    //Apply backgroundColor preference

    let onGetting = function(result) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            console.log("Applying Background Color Preferences");
            let elems = document.documentElement.getElementsByTagName("*");
            let exclude_tags = ["tranquility_links", "tranquility_masker",
                            "tranquility_annotation", "tranquility_annotation_selection"];
            for(let i=0; i < elems.length; i++) {
                if((elems[i].getAttribute('class')) && 
                   (exclude_tags.indexOf(elems[i].getAttribute('class')) == -1) &&
                   (elems[i].getAttribute('class').substr(0,11) === 'tranquility')) {
                    elems[i].style.backgroundColor = result.tranquility_background_color;
                }
            }
        }
    };

    let getting = browser.storage.local.get("tranquility_background_color", onGetting);
}

function applyFontPreferences() {
    // Apply font preferences
    let elems = document.documentElement.getElementsByTagName("*");
    let include_tags = ["tranquility", "tranquility_annotation_note", "tranquility_annotation_text", 
                        "tranquility_annotation_selection", "tranquility_annotation", 
                        "tranquility_view_notes", "tranquility_offline_links",
                        "tranquility_nav_links", "tranquility_quick_links_div",
                        "tranquility_pre", "tranquility_expand_menu_btn",
                        "tranquility_menu", "tranquility_annotation"];
    
    let onGetting = function(result) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            console.log("Applying Font Preferences");

            let adjustedFontSize = parseFloat(result.tranquility_font_size) / zoomValue;
            console.log(zoomValue, result.tranquility_font_size, adjustedFontSize);
            currentFontSize = adjustedFontSize;

            for(let i=0; i < elems.length; i++) {
                if(include_tags.indexOf(elems[i].getAttribute('class')) != -1) {
                    elems[i].style.fontSize = Math.round(adjustedFontSize) + "px";
                    elems[i].style.fontFamily = result.tranquility_font_name;
                    if (elems[i].nodeName == "H1") {
                        elems[i].style.fontSize = "150%";
                    }
                }
            }
        }
    };
    
    let getting = browser.storage.local.get(["tranquility_font_size", "tranquility_font_name"], onGetting);
}
    
function applyFontColorPreferences() {
    // Apply fontColor preference

    let onGetting = function(result) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            console.log("Applying Font Color Preferences");
            let elems = document.documentElement.getElementsByTagName("*");
            for(let i=0; i < elems.length; i++) {
                if((elems[i].getAttribute('class')) && 
                   (elems[i].getAttribute('class').substr(0,11) === 'tranquility')) {
                    elems[i].style.color = result.tranquility_font_color;
                }
            }   
        }
    };

    let getting = browser.storage.local.get("tranquility_font_color", onGetting);

}

function applyLinkColorPreferences() {
    // Apply linkColor preference
    let onGetting = function(result) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            console.log("Applying Link Color Preferences");
            let elems = document.documentElement.getElementsByTagName("A");
            for(let i=0; i < elems.length; i++) {
                elems[i].style.color = result.tranquility_link_color;
            }   
        }
    };
    
    let getting = browser.storage.local.get("tranquility_link_color", onGetting);
}

function applyAnnotationHighlightColorPreferences() {
    // Apply linkColor preference
    let onGetting = function(result) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            console.log("Applying Annotation Highlight Color Preferences");
            let elems = document.documentElement.getElementsByClassName("tranquility_annotation_selection");
            for(let i=0; i < elems.length; i++) {
                elems[i].style.backgroundColor = result.tranquility_annotation_highlight_color;
            }  
        }            
    };
    
    let getting = browser.storage.local.get("tranquility_annotation_highlight_color", onGetting);
}

function applyReadingWidthPreferences() {
    let cdiv = document.getElementById('tranquility_container');
    let menu_div = document.getElementById('tranquility_menu');
    // Update the width based on the preference setting
    // Do this for the images also
    let onGetting = function(result) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            console.log("Applying Reading Width Preferences");
            cdiv.style.width = result.tranquility_reading_width + "%"; 
            menu_div.style.width = result.tranquility_reading_width + "%"; 
            resizeImages(document, result.tranquility_reading_width);

        }
    };

    let getting = browser.storage.local.get("tranquility_reading_width", onGetting);
}


function applyNumColumnsPreferences(columnMode) {
    let inner_div = document.getElementById('tranquility_innercontainer');

    // Update the number of columns based on the preference setting
    let onGetting = function(result) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            console.log("Applying Num Columns Preferences");
            let numCols = result.tranquility_num_columns;
            let readingWidth = result.tranquility_reading_width;

            if (columnMode == 'singlePagePrintMode') {
                numCols = 1;
            }

            inner_div.style.columnCount = numCols;
            inner_div.style.columnRule = "5px solid rgb(127, 127, 127, 0.3)";
            inner_div.style.columnGap = "2em";
            resizeImages(document, readingWidth/numCols);
        }
    };

    let getting = browser.storage.local.get(["tranquility_reading_width",
                                             "tranquility_num_columns"], onGetting);
}

function applyTextJustificationPreferences() {
    // Apply text justification
    let elems = document.documentElement.getElementsByTagName("*");
    let exclude_tags = ["tranquility_links", "tranquility_nav_links", "tranquility_more_links_btn", 
                    "tranquility_offline_links_btn", "tranquility_viewnotes_btn", 
                    "tranquility_read_later_btn"];

    let onGetting = function(result) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            console.log("Applying Text Justification Preferences");
            for(let i=0; i < elems.length; i++) {
                if((elems[i].getAttribute('class')) && 
                   (exclude_tags.indexOf(elems[i].getAttribute('class')) == -1) &&
                   (elems[i].getAttribute('class').substr(0,11) === 'tranquility')) {
                    elems[i].style.textAlign = result.tranquility_text_align;
                }
            }   
        }
    };
    
    let getting = browser.storage.local.get("tranquility_text_align", onGetting);
}

function applyLineHeightPreferences() {
    // Apply line height preferences
    let elems = document.documentElement.getElementsByTagName("*");
    let onGetting = function(result) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            console.log("Applying Line Height Preferences");
            for(let i=0; i < elems.length; i++) {
                if((elems[i].getAttribute('class')) && 
                   (elems[i].getAttribute('class').substr(0,11) === 'tranquility')) {
                    elems[i].style.lineHeight = result.tranquility_line_height + "%";
                }
            }   
        }
    };
    
    let getting = browser.storage.local.get("tranquility_line_height", onGetting);
}

function resizeImages(document, reading_width) {
    let images = document.getElementsByTagName("IMG");
    let max_width = document.body.clientWidth * 0.9 * reading_width / 100.0;
    console.log("Resizing images...");
    for(let im=0; im < images.length; im++)  {
        if (images[im].complete) {
            resizeLoadedImage(images[im], max_width);
        }
        else {
            images[im].onload = function() {resizeLoadedImage(this, max_width);};
        }
    } 
}


function resizeLoadedImage(image, max_width) {    

    let origWidth = image.naturalWidth;
    let origHeight = image.naturalHeight;

    if((origWidth != undefined) && (origHeight != undefined) &&
       (origWidth > max_width))  {
        let aspect_ratio = origHeight/origWidth;
        image.width = max_width;
        image.height = max_width*aspect_ratio;
    }  
}

function applyImageDisplayPreferences() {

    // Update the display of images based on the preference setting
    let onGetting = function(result) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            console.log("Applying Image Display Preferences");
            if (result.tranquility_hide_images == 'never' ||
                result.tranquility_hide_images == 'hide_only_for_print') {
                setImageDisplay('inline');
            }
            else if (result.tranquility_hide_images == 'always') {
                setImageDisplay('none');
            }
        }
    };

    let getting = browser.storage.local.get("tranquility_hide_images", onGetting);
}

function setImageDisplay(displayVal) {
    //let images = document.getElementsByTagName("IMG");
    let images = document.querySelectorAll("IMG, FIGURE, FIGCAPTION, PICTURE, SVG");
    console.log("Setting display of images... to " + displayVal);
    for(let im=0; im < images.length; im++)  {
        if (images[im].id == "tranquility_saveaspdf_img") {
            continue;
        }
        console.log(images[im]);
        images[im].style.display = displayVal;
    }
}

window.addEventListener("resize", applyAllTranquilityPreferences);
