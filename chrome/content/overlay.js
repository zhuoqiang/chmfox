Components.utils.import("resource://chmfox/chm_protocol.js");

window.QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIWebNavigation)
      .QueryInterface(Ci.nsIDocShell)
      .QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIURIContentListener)
      .parentContentListener = Chmfox.uriContentListener;
