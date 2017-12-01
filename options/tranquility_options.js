'use strict';

var browser = browser || chrome;

function saveOptions(e) {
    e.preventDefault();
    browser.storage.local.set(
    {
    tranquility_background_color:           document.getElementById("tranquility_background_color").value,
    tranquility_font_color:                 document.getElementById("tranquility_font_color").value,
    tranquility_link_color:                 document.getElementById("tranquility_link_color").value,
    tranquility_annotation_highlight_color: document.getElementById("tranquility_annotation_highlight_color").value,
    tranquility_font_name:                  document.getElementById("tranquility_font_name").value,
    tranquility_font_size:                  document.getElementById("tranquility_font_size").value,
    tranquility_reading_width:              document.getElementById("tranquility_reading_width").value,
    tranquility_line_height:                document.getElementById("tranquility_line_height").value,
    tranquility_text_align:                 document.getElementById("tranquility_text_align").value    
    });

    // Clear any prior alarms
    browser.alarms.clearAll();

    // Change bg-color of the save label to visually indicated that save worked
    document.getElementById("tranquility_save_changes").style.backgroundColor = "#90EE90";

    // Create an alarm to restore the save label to its original color after 0.1 minutes
    let DELAY = 0.1;
    browser.alarms.create("restore-save-bg-color", {delayInMinutes: DELAY});
    browser.alarms.onAlarm.addListener( (alarm) => {
        if (alarm.name === "restore-save-bg-color") {
            document.getElementById("tranquility_save_changes").style.backgroundColor = "#E6E6FA";
        }
    });
}

function restoreOptions() {

    let options_list = ["tranquility_background_color", "tranquility_font_color", 
                      "tranquility_link_color", "tranquility_annotation_highlight_color",
                      "tranquility_font_name", "tranquility_font_size", 
                      "tranquility_reading_width", "tranquility_line_height", 
                      "tranquility_text_align"];

    // Default initialize form; then replace with values from storage.local, if exists  
    for (let opt=0; opt < options_list.length; opt++) {
        let opt_name = options_list[opt];
        initializeOption(opt_name);
    }

    for (let opt=0; opt < options_list.length; opt++) {

        let opt_name = options_list[opt];

        let onGetOption = function (result) {
            if (browser.runtime.lastError) {
                console.log(browser.runtime.lastError);
            }
            else {
                let keys = Object.keys(result);
                for (let k=0; k < keys.length; k++) {
                    let opt_name = keys[k];
                    let elem_name = opt_name;
                    if (opt_name == "tranquility_background_color") {
                        document.getElementById(elem_name).value = result.tranquility_background_color || "#FFFFFF";
                    }
                    else if (opt_name == "tranquility_font_color") {
                        document.getElementById(elem_name).value = result.tranquility_font_color || "#000000";
                    }
                    else if (opt_name == "tranquility_link_color") {
                        document.getElementById(elem_name).value = result.tranquility_link_color || "#0000FF";
                    }
                    else if (opt_name == "tranquility_annotation_highlight_color") {
                        document.getElementById(elem_name).value = result.tranquility_annotation_highlight_color || "#FFFF99";
                    }
                    else if (opt_name == "tranquility_font_name") {
                        document.getElementById(elem_name).value = result.tranquility_font_name || "Georgia";
                    }
                    else if (opt_name == "tranquility_font_size") {
                        document.getElementById(elem_name).value = result.tranquility_font_size || "22";
                    }
                    else if (opt_name == "tranquility_reading_width") {
                        document.getElementById(elem_name).value = result.tranquility_reading_width || "55";
                    }
                    else if (opt_name == "tranquility_line_height") {
                        document.getElementById(elem_name).value = result.tranquility_line_height || "140";
                    }
                    else if (opt_name == "tranquility_text_align") {
                        document.getElementById(elem_name).selectedItem = result.tranquility_text_align;
                    }
                }
            }
        };
    
        let getting = browser.storage.local.get(opt_name, onGetOption);
  }
}

function initializeOption(opt_name) {
    let elem_name = opt_name;
    if (opt_name == "tranquility_background_color") {
        document.getElementById(elem_name).value = "#FFFFFF";
    }
    else if (opt_name == "tranquility_font_color") {
        document.getElementById(elem_name).value = "#000000";
    }
    else if (opt_name == "tranquility_link_color") {
        document.getElementById(elem_name).value = "#0000FF";
    }
    else if (opt_name == "tranquility_annotation_highlight_color") {
        document.getElementById(elem_name).value = "#FFFF99";
    }
    else if (opt_name == "tranquility_font_name") {
        document.getElementById(elem_name).value = "Georgia";
    }
    else if (opt_name == "tranquility_font_size") {
        document.getElementById(elem_name).value = "22";
    }
    else if (opt_name == "tranquility_reading_width") {
        document.getElementById(elem_name).value = "55";
    }
    else if (opt_name == "tranquility_line_height") {
        document.getElementById(elem_name).value = "140";
    }
    else if (opt_name == "tranquility_text_align") {
        document.getElementById(elem_name).selectedItem = "left";
    }
}

function loadPresetFormats() {
    
    
    let idx = document.getElementById("tranquility_preset_combination").selectedIndex;
    let selOpt = document.getElementById("tranquility_preset_combination").options[idx].value;
    
    if (selOpt == "default") {
        document.getElementById("tranquility_background_color").value = "#FFFFFF";
        document.getElementById("tranquility_font_color").value = "#000000";
        document.getElementById("tranquility_link_color").value = "#0000FF";
        document.getElementById("tranquility_annotation_highlight_color").value = "#FFFF99";
        document.getElementById("tranquility_font_name").value = "Georgia";
        document.getElementById("tranquility_font_size").value = "22";
        document.getElementById("tranquility_reading_width").value = "55";
        document.getElementById("tranquility_line_height").value = "140";
        document.getElementById("tranquility_text_align").selectedItem = "left";
    }
    else if (selOpt == "dark") {
        document.getElementById("tranquility_background_color").value = "#000000";
        document.getElementById("tranquility_font_color").value = "#FFFFFF";
        document.getElementById("tranquility_link_color").value = "#0000FF";
        document.getElementById("tranquility_annotation_highlight_color").value = "#FFFF99";
        document.getElementById("tranquility_font_name").value = "Georgia";
        document.getElementById("tranquility_font_size").value = "22";
        document.getElementById("tranquility_reading_width").value = "55";
        document.getElementById("tranquility_line_height").value = "140";
        document.getElementById("tranquility_text_align").selectedItem = "left";
    }
    else if (selOpt == "matrix") {
        document.getElementById("tranquility_background_color").value = "#000000";
        document.getElementById("tranquility_font_color").value = "#006400";
        document.getElementById("tranquility_link_color").value = "#0000FF";
        document.getElementById("tranquility_annotation_highlight_color").value = "#FFFF99";
        document.getElementById("tranquility_font_name").value = "Courier";
        document.getElementById("tranquility_font_size").value = "22";
        document.getElementById("tranquility_reading_width").value = "55";
        document.getElementById("tranquility_line_height").value = "140";
        document.getElementById("tranquility_text_align").selectedItem = "left";
    }
    else if (selOpt == "highcontrastlargefont") {
        document.getElementById("tranquility_background_color").value = "#000000";
        document.getElementById("tranquility_font_color").value = "#FFFFFF";
        document.getElementById("tranquility_link_color").value = "#0000FF";
        document.getElementById("tranquility_annotation_highlight_color").value = "#FFFF99";
        document.getElementById("tranquility_font_name").value = "Verdana";
        document.getElementById("tranquility_font_size").value = "54";
        document.getElementById("tranquility_reading_width").value = "75";
        document.getElementById("tranquility_line_height").value = "140";
        document.getElementById("tranquility_text_align").selectedItem = "left";
    }
    
    if (selOpt !== "custom") {
        document.getElementById("tranquility_save_changes").click();
    }
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


document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("tranquility_save_changes").addEventListener("click", saveOptions);
document.getElementById("tranquility_export_offline_pages").addEventListener("click", callExportTranquilityOfflinePages);
document.getElementById("tranquility_import_offline_pages").addEventListener("click", callImportTranquilityOfflinePages);
document.getElementById("tranquility_preset_combination").addEventListener("change", loadPresetFormats);