/**
 **********************************************************************
 * Tranquility Reader - A Firefox Webextension that cleans up
 * cluttered web pages
 **********************************************************************

   Copyright (c) 2012-2020 Arun Kunchithapatham

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

let tranquility_presets = 
{
  "Default (Light)": 
             { "tranquility_background_color"           : "#FFFFFF",
               "tranquility_font_color"                 : "#333333",
               "tranquility_link_color"                 : "#0000FF",
               "tranquility_annotation_highlight_color" : "#FFFF99",
               "tranquility_font_name"                  : "Georgia",
               "tranquility_font_size"                  : "22",
               "tranquility_reading_width"              : "55",
               "tranquility_line_height"                : "140",
               "tranquility_text_align"                 : "left"
             },

  "Android": 
             { "tranquility_background_color"           : "#FFFFFF",
               "tranquility_font_color"                 : "#333333",
               "tranquility_link_color"                 : "#0000FF",
               "tranquility_annotation_highlight_color" : "#FFFF99",
               "tranquility_font_name"                  : "Georgia",
               "tranquility_font_size"                  : "15",
               "tranquility_reading_width"              : "95",
               "tranquility_line_height"                : "140",
               "tranquility_text_align"                 : "left"
             },

  "Dark":   
             { "tranquility_background_color"           : "#333333",
               "tranquility_font_color"                 : "#EEEEEE",
               "tranquility_link_color"                 : "#DD4800",
               "tranquility_annotation_highlight_color" : "#FFFF99",
               "tranquility_font_name"                  : "Georgia",
               "tranquility_font_size"                  : "22",
               "tranquility_reading_width"              : "55",
               "tranquility_line_height"                : "140",
               "tranquility_text_align"                 : "left"
             },

  "Sepia":   
             { "tranquility_background_color"           : "#F4ECD8",
               "tranquility_font_color"                 : "#5B4636",
               "tranquility_link_color"                 : "#0000FF",
               "tranquility_annotation_highlight_color" : "#FFFF99",
               "tranquility_font_name"                  : "Georgia",
               "tranquility_font_size"                  : "22",
               "tranquility_reading_width"              : "55",
               "tranquility_line_height"                : "140",
               "tranquility_text_align"                 : "left"
             },

  "Matrix":   
             { "tranquility_background_color"           : "#000000",
               "tranquility_font_color"                 : "#006400",
               "tranquility_link_color"                 : "#0000FF",
               "tranquility_annotation_highlight_color" : "#FFFF99",
               "tranquility_font_name"                  : "Courier",
               "tranquility_font_size"                  : "22",
               "tranquility_reading_width"              : "55",
               "tranquility_line_height"                : "140",
               "tranquility_text_align"                 : "left"
             },

  "High Contrast Large Font":   
             { "tranquility_background_color"           : "#000000",
               "tranquility_font_color"                 : "#FFFFFF",
               "tranquility_link_color"                 : "#0000FF",
               "tranquility_annotation_highlight_color" : "#FFFF99",
               "tranquility_font_name"                  : "Verdana",
               "tranquility_font_size"                  : "54",
               "tranquility_reading_width"              : "75",
               "tranquility_line_height"                : "140",
               "tranquility_text_align"                 : "left"
             }
};
