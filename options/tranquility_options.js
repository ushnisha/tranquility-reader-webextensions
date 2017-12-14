'use strict';

var browser = browser || chrome;

function saveOptions(e) {
    e.preventDefault();

    let current_settings = {
        tranquility_background_color:           document.getElementById("tranquility_background_color").value,
        tranquility_font_color:                 document.getElementById("tranquility_font_color").value,
        tranquility_link_color:                 document.getElementById("tranquility_link_color").value,
        tranquility_annotation_highlight_color: document.getElementById("tranquility_annotation_highlight_color").value,
        tranquility_font_name:                  document.getElementById("tranquility_font_name").value,
        tranquility_font_size:                  document.getElementById("tranquility_font_size").value,
        tranquility_reading_width:              document.getElementById("tranquility_reading_width").value,
        tranquility_line_height:                document.getElementById("tranquility_line_height").value,
        tranquility_text_align:                 document.getElementById("tranquility_text_align").value    
    };

    // First save all of the current settings in the individual options
    browser.storage.local.set(current_settings);

    // Now check to see if a preset name is created, in which case save the preset
    let custom_name = document.getElementById("tranquility_custom_preset_name").value;

    if (custom_name !== "") {
        let onGetting = function(result) {
            if (browser.runtime.lastError) {
                console.log(browser.runtime.lastError);
            }
            else {
                let tranquility_presets = JSON.parse(result.tranquility_presets);
                tranquility_presets[custom_name] = current_settings;
                browser.storage.local.set({"tranquility_presets" : JSON.stringify(tranquility_presets)});

                // Update the select option to include this new preset
                let presetSelect = document.getElementById("tranquility_preset_combination");
                let opt = document.createElement('option');
                opt.value = custom_name;
                opt.text = custom_name;
                presetSelect.appendChild(opt);

                // Finally clear the preset name text box
                document.getElementById("tranquility_custom_preset_name").value = "";
            }
        }
        let getting_presets = browser.storage.local.get("tranquility_presets", onGetting);
    }
   
    // Send a message to instruct all tabs to update their tranquility view to use the new
    // preferences
    browser.runtime.sendMessage(
      {
          "action": "AllTabsUpdateTranquilityPreferences"
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

function deletePreset(e) {
    e.preventDefault();

    // Now check to see if a preset name as specified exists, in which case delete the preset and
    // remove it from the select options
    
    let custom_name = document.getElementById("tranquility_custom_preset_name").value;

    if (custom_name !== "") {

        let onGetting = function(result) {
            if (browser.runtime.lastError) {
                console.log(browser.runtime.lastError);
            }
            else {

                let tranquility_presets = JSON.parse(result.tranquility_presets);
                
                // check if the custom preset exists and update the presets options object
                if (custom_name in tranquility_presets) {
                    delete tranquility_presets[custom_name];
                    browser.storage.local.set({"tranquility_presets" : JSON.stringify(tranquility_presets)});
                    // update the select options list to remove the deleted preset
                    let presetSelect = document.getElementById("tranquility_preset_combination");
                    for (let i = 0; i < presetSelect.length; i++) {
                        if (presetSelect.options[i].value == custom_name) {
                            presetSelect.remove(i);
                            document.getElementById("tranquility_custom_preset_name").value = "";
                            break;
                        }
                    }
                }
            }
        }
        let getting_presets = browser.storage.local.get("tranquility_presets", onGetting);
    }
}

    
function restoreOptions() {


    let onGetting = function(result) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {

            let tranquility_presets = JSON.parse(result.tranquility_presets);
            let presetSelect = document.getElementById("tranquility_preset_combination");
            let presets = Object.keys(tranquility_presets);
            for (let k = 0; k < presets.length; k++) {
                let opt = document.createElement('option');
                opt.value = presets[k];
                opt.text = presets[k];
                presetSelect.appendChild(opt);
            }

        }
    }
    let getting_presets = browser.storage.local.get("tranquility_presets", onGetting);

    let options_list = ["tranquility_background_color", "tranquility_font_color", 
                      "tranquility_link_color", "tranquility_annotation_highlight_color",
                      "tranquility_font_name", "tranquility_font_size", 
                      "tranquility_reading_width", "tranquility_line_height", 
                      "tranquility_text_align"];

    // Set forms with values from storage.local (should exist since these were set during installation)

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
                        document.getElementById(elem_name).value = result.tranquility_text_align;
                    }
                }
            }
        };
    
        let getting = browser.storage.local.get(opt_name, onGetOption);
  }
}

function loadPresetFormats() {
    
    
    let idx = document.getElementById("tranquility_preset_combination").selectedIndex;
    let selOpt = document.getElementById("tranquility_preset_combination").options[idx].value;
    
    let onGetting = function(result) {
        if (browser.runtime.lastError) {
            console.log(browser.runtime.lastError);
        }
        else {

            let tranquility_presets = JSON.parse(result.tranquility_presets);
            let selection = tranquility_presets[selOpt];
            let opts = Object.keys(selection);
            for (let k = 0; k < opts.length; k++) {
                let opt = opts[k];
                document.getElementById(opt).value = selection[opt];
            }

            if (selOpt !== "custom") {
                document.getElementById("tranquility_save_changes").click();
            }
        }
    }

    let getting = browser.storage.local.get("tranquility_presets", onGetting);

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
document.getElementById("tranquility_delete_preset").addEventListener("click", deletePreset);
document.getElementById("tranquility_export_offline_pages").addEventListener("click", callExportTranquilityOfflinePages);
document.getElementById("tranquility_import_offline_pages").addEventListener("click", callImportTranquilityOfflinePages);
document.getElementById("tranquility_preset_combination").addEventListener("change", loadPresetFormats);
