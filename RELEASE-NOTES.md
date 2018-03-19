## Version 3.0.10:

* Fix to scale images better

* Remove hidden images (based on the computedStyle properties)

* Allow smaller length text content to show more information.
  This can have the side effect of unnecessary material getting
  into the tranquilized view.  So, this is currently experimental.

* Updated copyright message

--------------------------------

## Version 3.0.9:

* Add support to handle #links; Tranquility currently tries to
  reload the entire page and reprocess instead of moving to the
  #link.

* Experimental support to handle images better.  Most images were
  being removed.  Added support for images.  Currently, more images
  than necessary are retained (including some pesky icons) but
  the changes are ready for publishing to a wider audience to
  receive feedback.

--------------------------------

## Version 3.0.8:

* Default font size for Android preset was changed to 15 
  (a typo had set it to 25 instead). 

--------------------------------

## Version 3.0.7:

* Ability to run Tranquility Reader on a portion of a webpage 
  by selecting/highlighting only the text that you want to read.

* After highlighting text, right click on the highlighted text 
  and select "Tranquilize Selection!" from the context menu. 
  Please note that this feature is not supported on Android platform. 

--------------------------------

## Version 3.0.6:

* Ability to create user defined presets (for users who have 
  multiple configurations for Tranquility Reader)

* Changes made to Tranquility Reader preferences are instantly 
  reflected on all tabs in the Tranquil Reading Mode as soon 
  as the modified preferences are saved - this allows for 
  easier testing and tuning of the preferences. 

--------------------------------

## Version 3.0.5:

* Changes for limited support on Firefox for AndroidOS

* Only the browserAction (running Tranquility on a web page 
  by selecting the browser menu option) is available on AndroidOS

* No command shortcuts or right click context menus provided on AndroidOS

* Currently no ability to to import/export the offline pages on AndroidOS

* Changes to css/default options for AndroidOS/smaller screen devices. 

--------------------------------

## Version 3.0.4: 

* Removed popup menu for the browser action; now, clicking on 
  the Tranquility icon will make the page readable. For the 
  other actions provided through the popup menu, users will have 
  to go to the options page or use the Read Later button after 
  running tranquility.

* Added a few "preset" configurations (color schemes and font colors) 
  rather than having to customize each option manually. 
  This is experimental at this time; will explore the option of 
  allowing users to import a configuration file for this in the future.

* Changed the background page to "about:blank" (instead of mozilla.org) 
  when loading offline pages from the options window.

* Minor bug fix to remove the progress bar which was not being removed 
  in some corner cases.

* Bug fix to correctly load original page when toggling Tranquility mode 
  for an offline page.

* Bug fix to handle loading mixed security content pages correctly

* Bug fix to handle pre-formatted pages correctly 

--------------------------------

## Version 3.0.1:

* Tranquility Reader 3.0.1 has been rewritten using WebExtensions APIs

* Ability to export/import offline content (please be sure to export 
  offline content from version 2.0 and manually import into version 3.0.1)

* Reduced set of customization options; Display font name will have 
  to be typed in manually (limitation of WebExtensions APIs)

* Removed support for background image and wikipedia/wiktionary 
  search facility

* No keyboard shortcut (very limited options available through 
  WebExtensions APIs - waiting for more customization capabilities)

* Several minor bug fixes that were put off until this version

Please note that due to the extensive changes that were made, there 
may be regression in the code and past bugs that were fixed may reappear. 
Please leave your comments or send feedback to the support email 
address so that these bugs can be addressed. 
