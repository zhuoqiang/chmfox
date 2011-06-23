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
                 if (url.fileExtension.toLowerCase() == 'chm') {
                     uri.scheme = "chm";
                     log("redirect to [" + uri.spec + "]");
                     // gBrowser.addTab(uri.spec);
                     // gBrowser.loadURI(uri.spec);
                     // gBrowser.selectedTab.linkedBrowser.loadURI(uri.spec, null, null);
                     // openUILinkIn(uri.spec, "current");
                     // window.setTimeout('openUILinkIn("'+ uri.spec+ '", "current")', 10);
                     window.setTimeout('gBrowser.loadURI("'+ uri.spec+ '")', 10);

                     return true;
                 }
             }
         }
         catch(e) {
             log(e);
         }
         return false;
     },

    isPreferred: function(contentType, desiredContentType) {
        try {
            var webNavInfo = Cc["@mozilla.org/webnavigation-info;1"].getService(Ci.nsIWebNavigationInfo);
            return webNavInfo.isTypeSupported(contentType, null);
        }
        catch (e) {
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
