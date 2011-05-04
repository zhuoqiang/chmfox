Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

var Ci = Components.interfaces;
var Cc = Components.classes;
var Cr = Components.results;

var chmfox = (function() {

function log(msg) {
    var console = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
    var message = '[chmfox] ' + msg + '\n';
    console.logStringMessage(message);
    dump(message);
}

var uriContentListener = {
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsIURIContentListener,
        Ci.nsISupportsWeakReference,
        Ci.nsISupports]),

     onStartURIOpen: function(uri) {
         try {
             if (uri.schemeIs("file")) {
                 var url = uri.QueryInterface(Ci.nsIURL);
                 if (url.fileExtension == 'chm') {
                     var newUri = "chm:"+uri.spec;
                     log("Redirect to "+newUri);
                     // @todo using below to change scheme
                     // uri.scheme = "chm";
                     gBrowser.loadURI(newUri);
                     return true;
                 }
             }
         }
         catch(e) {
             log(e);
         }
         return false;
     }
};

return {log:log, uriContentListener: uriContentListener};

})();

var wnd = window.QueryInterface(Ci.nsIInterfaceRequestor)
                      .getInterface(Ci.nsIWebNavigation)
                      .QueryInterface(Ci.nsIDocShell)
                      .QueryInterface(Ci.nsIInterfaceRequestor)
                      .getInterface(Ci.nsIURIContentListener);

wnd.parentContentListener = chmfox.uriContentListener;
