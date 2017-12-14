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
    applyTextJustificationPreferences();
    applyLineHeightPreferences();
}

function applyTranquilityCSS() {
    let hlink = createNode(document, {type: 'LINK', attr: { href:browser.extension.getURL("css/tranquility.css"), rel:'stylesheet', type:'text/css' } });
    let heads = document.getElementsByTagName('head');
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
                        "tranquility_view_notes"];
    
    let onGetting = function(result) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {
            console.log("Applying Font Preferences");
            for(let i=0; i < elems.length; i++) {
                if(include_tags.indexOf(elems[i].getAttribute('class')) != -1) {
                    elems[i].style.fontSize = result.tranquility_font_size + "px";
                    elems[i].style.fontFamily = result.tranquility_font_name;
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
            let elems = document.documentElement.getElementsByTagName("a");
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
            let elems = document.documentElement.getElementsByTagName("tranquility_annotation_selection");
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
    let images = document.getElementsByTagName("img");
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
    image.removeAttribute('class');
    image.removeAttribute('style');
    if((image.width != undefined) && (image.height != undefined) &&
       (image.width > max_width))  {
        let aspect_ratio = image.height/image.width;
        image.width = max_width;
        image.height = max_width*aspect_ratio;
    }  
}