/**
   @author ZHUO Qiang
*/

const { Cc, Ci, components } = require("chrome");
const xpcom = require("sdk/platform/xpcom");
const { ChmView } = require("./chm-view");
// const prefs = require("./prefs");

// nsIStreamConverter component which converts application/x-chm;application/vnd.ms-htmlhelp to html
// TODO MIME-TYPE: application/vnd.ms-htmlhelp ?
const CONTRACT_ID = "@mozilla.org/streamconv;1?from=application/x-chm&to=*/*";
const CLASS_ID = "{74890660-53c4-11dd-ae16-0800200c9a67}";
const GECKO_VIEWER = "Gecko-Content-Viewers";

// Create and register the service
const service = xpcom.Service({
  id: components.ID(CLASS_ID),
  contract: CONTRACT_ID,
  Component: ChmView,
  register: false,
  unregister: false
});


const categoryManager = Cc["@mozilla.org/categorymanager;1"].getService(Ci.nsICategoryManager);

function onLoad(options, callbacks) {
  if (!xpcom.isRegistered(service)) {
    xpcom.register(service);
  }
  
  // Tell Firefox that .chm files are of application/x-chm;application/vnd.ms-htmlhelp MIME type
  categoryManager.addCategoryEntry(
    'ext-to-type-mapping', 'chm',
    'application/x-chm;application/vnd.ms-htmlhelp',
    false, // not persist
    true); // replace
  
  // prefs.register();
};

function onUnload(reason) {
  if (xpcom.isRegistered(service)) {
    xpcom.unregister(service);
  }
  
  // prefs.unregister();
};

exports.main = onLoad;
exports.onUnload = onUnload;
