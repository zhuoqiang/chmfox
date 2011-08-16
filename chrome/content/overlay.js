Components.utils.import("resource://chmfox/chmfox.js");

window.QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIWebNavigation)
      .QueryInterface(Ci.nsIDocShell)
      .QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIURIContentListener)
      .parentContentListener = Chmfox.uriContentListener;

if ("undefined" == typeof(ChmfoxChrome)) {
  var ChmfoxChrome = {
  };
};


ChmfoxChrome.IsSidebarOpen = function() {
    var sidebarWindow = document.getElementById('sidebar').contentWindow;;
    if (sidebarWindow.location.href == "chrome://chmfox/content/sidebar.xul") {
        return true;
    }
    return false;
};

ChmfoxChrome.toggleSidebar = function(event) {
    var url = gBrowser.contentDocument.location.href;
    url = decodeURI(url).split('!')[0];
    if (url.substr(0, 7) != 'chm:///') {
        if (ChmfoxChrome.IsSidebarOpen()) {
            // allowed it to close
            toggleSidebar('viewChmfoxSidebar');
        }
        return;
    }
    var opened = ChmfoxChrome.IsSidebarOpen();
    toggleSidebar('viewChmfoxSidebar');
    Chmfox.prefs.setBoolPref(url+".autoOpenSidebar", !opened);
};

ChmfoxChrome.on_new_url = function(event) {
    var browser = gBrowser.getBrowserAtIndex(gBrowser.mTabContainer.selectedIndex);
    var url = browser.contentDocument.location.href;
    url = decodeURI(url).split('!')[0];
    if (url.substr(0, 7) != 'chm:///') {
        if (ChmfoxChrome.IsSidebarOpen()) {
            toggleSidebar('viewChmfoxSidebar');
        }
        return;
    }

    var autoOpenSidebar = Chmfox.prefs.getBoolPref("autoOpenSidebar");
    try {
        autoOpenSidebar = Chmfox.prefs.getBoolPref(url+".autoOpenSidebar");
    }
    catch (e) {
    }

    if (autoOpenSidebar) {
        toggleSidebar('viewChmfoxSidebar', true);
    }
    else if (ChmfoxChrome.IsSidebarOpen()) {
        toggleSidebar('viewChmfoxSidebar');
    }
};

window.parent.gBrowser.addEventListener("load", ChmfoxChrome.on_new_url, true);
window.parent.gBrowser.mPanelContainer.addEventListener("select", ChmfoxChrome.on_new_url, false);
