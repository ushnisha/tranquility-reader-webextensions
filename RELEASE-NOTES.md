## Version 3.0.24:

* Do not show the ui controls when the user selects any text in the
  transformed view.  When text is selected, that registers a click event
  which shows the ui controls and that can be distracting.

* Add a new option for multi-column text support.  The reading width
  will be split into the specified number of columns.  This is useful
  for people with wide screens.  However, printing to PDF will always
  print with a single column.  With multiple columns, if you need to
  scroll down to finish reading the first column, use HOME key to
  move to the top of the page to start reading the next column.

* Minor code cleanup and changes to support above enhancements.

* Updated copyright information to year 2022

--------------------------------

## Version 3.0.23:

* Provide option to hide images when transforming/printing a document.
  - "never": never hide images/always display images when possible
  - "always": always hide images
  - "hide_only_for_print": show images when possible, but hide when printing

* Modification to pattern match to display more links to previous/next articles

* Minor code simplification/cleanup

* Updated copyright information

--------------------------------

## Version 3.0.22:

* Provide option to include/exclude header/footer when printing
  the page as PDF document

* Increase the margins of printed PDF to 1.0" (default 0.5")
  At this time, margin is not user customizable

* Remove font size hardcoding of certain custom elements and
  make sure they also use the user specified font settings
  (certain element dimensions are now scaled based on user
   specified font size)

* Attempt to fix issue with scrolling to top of page after
  processing the page

* Fix regression where some of the related/supporting links were
  not showing up (for easy navigation in continuous browsing mode)
  See github issue #27 for more details

* Attempt to remove menu like elements on some pages

--------------------------------

## Version 3.0.21:

* Preserve the original zoom setting (scale the font size instead)

* Clone the document instead of the body (attempt to remove more
  event listeners)

* Auto-hide the UI controls (toggle display on clicking on the 
  body of the page)

* Reorganize code to separate out UI related functionality 
  into a separate file

--------------------------------

## Version 3.0.20:

* Update PRIVACY.md to reflect removal of "tabs" permission

* Handle corner case where pages with content in the "main" tag
  have content flowing outside the reading width

* Fix bug where the page up/down scroll buttons do not work
  in offline/saved pages

* Refine regexp to remove additional ad related elements

* Ignore CDATA nodes when measuring amount of text in an element

--------------------------------

## Version 3.0.19:

* Adding missing heading/title if it has been removed during processing

* Move logic to hide/remove spurious elements from css to javascript code
  for better control; added additional filtering logic

* Add scroll buttons (for page-up/page-down) for people who prefer mouse
  to keyboard (and for mobile users)

* Always scroll back to the top of the page/article after transforming
  a page

* Try to retain images within an article/main tag

* Minor bug fixes and code restructuring/simplification

* Removed unnecessary "tabs" permission request since we are not using it

--------------------------------

## Version 3.0.18:

* Bug fix for regression on some pages.  The computed height and width
  property were used to identify hidden elements, but the logic used
  was incorrect.  Undoing this change.

* Minor change to try and remove more unnecessary images that get
  restored even though their parent elements were removed

--------------------------------

## Version 3.0.17:

* Allow users to configure A4/Letter paper size in extension preferences
  when saving the transformed page as a PDF

* Add the original/source link to the top of the transformed page.  This
  is useful when the page is saved as a PDF or offline reading and the
  users have forgotten and need to refer to the original source.

* Bug fix so that we identify computed CSS style properties correctly

--------------------------------

## Version 3.0.16:

* Enable keyboard shortcut available with legacy version (Ctrl+Alt+T)

* New keyboard option to launch preferences page (Ctrl+Alt+J)

* New keyboard option to launch saved/offline pages (Ctrl+Alt+K)

* Keyboard shortcuts are user customizable.  Refer to the webpage:
  https://support.mozilla.org/en-US/kb/manage-extension-shortcuts-firefox

* Fix progress bar visibility bug when saving transformed page as PDF

* Fix bug in not reverting to original page when clicking on browser action
  icon (when the URL has a "#" reference

* Ability to view offline pages from the preferences page.  This avoids the
  need to first run the extension on some page before a user can access the
  saved/offline pages

* Removed "Save as PDF" functionality from Android version.  Android already
  has such an option on the Firefox-Page menu which works just fine.  The icon
  only clutters up the usually smaller screen in Android phones/devices

* Added user friendly privacy policy statement and explanation of permissions
  used by the extension

--------------------------------

## Version 3.0.15:

* Ability to save a PDF document of the Tranquility Reader view
  for offline reading or sharing with others (not supported on MacOS)

* Improve handling of images (fix cases where image width was larger
  than the reading width setting)

* Use CSS settings to identify some extraneous elements so that they
  can be removed from the page during processing

* Updated copyright message

--------------------------------

## Version 3.0.14:

* Added an option to change browser action icon to a grayscale version

--------------------------------

## Version 3.0.13:

* Fixed problem with TITLE/HEAD elements being removed because their
  default css property of display is "none".  This causes a problem
  when saving a link for offline reading -- saved article shows up
  with a blank name

* Fixed logic for replacing using the contents of the ARTICLE tag as
  proxy for the entire content of the page.  The original solution of
  replacing just the parent was not sufficient to remove a lot of other
  crud.  Now, we replace the entire body of the page with the article
  tag contents

--------------------------------

## Version 3.0.12:

* Attempt to remove all event handlers in the original page to prevent
  them from modifying the processed page

* Fix to handle pages that have windows-1252 encoding

* Ignore links like "mail:" that need not be processed by the addon
  and which caused the addon to freeze while processing pages with such links

* More aggressive removal of hidden elements
  this can cause more images to be removed in the processed view

* Removal of links with onclick events/javascript since they are often
  associated with social media forwarding links/images and clutter the
  processed page

* Minor changes to make code consistent (tag names are now all in uppercase)

--------------------------------

## Version 3.0.11:

* When a reader click on a link in the tranquility mode, the page
  updates to show the clicked URL contents in the tranquility mode.
  However, the address bar is not updated.

  An icon is provided on the top right corner of the page with a
  link to the URL of the page that is currently processed/displayed.

* Updated copyright message

--------------------------------

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
