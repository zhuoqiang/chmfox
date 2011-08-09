Components.utils.import("resource://chmfox/chmfox.js");

window.QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIWebNavigation)
      .QueryInterface(Ci.nsIDocShell)
      .QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIURIContentListener)
      .parentContentListener = Chmfox.uriContentListener;
