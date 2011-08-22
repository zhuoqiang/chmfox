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
    Chmfox.prefs.setBoolPref("autoOpenSidebar." + url, !opened);
};

ChmfoxChrome.on_new_url = function(event) {
    var browser = gBrowser.getBrowserAtIndex(gBrowser.mTabContainer.selectedIndex);
    var url = browser.contentDocument.location.href;
    var m = decodeURI(url).match(/(chm:\/\/.+\.chm)(!(\/.*))?/i);
    if (! m) {
        if (ChmfoxChrome.IsSidebarOpen()) {
            toggleSidebar('viewChmfoxSidebar');
        }
        return;
    }

    url = m[1];
    if (! browser.contentDocument.title) {
        var chm = Application.storage.get(url, null);
        if (chm) {
            browser.contentDocument.title = chm.title;
        }
    }

    var logo = browser.contentDocument.title.substr(browser.contentDocument.title.length-8);
    if (logo != '[CHMFOX]') {
        browser.contentDocument.title = browser.contentDocument.title + ' ♥ [CHMFOX]';
    }

    var autoOpenSidebar = Chmfox.prefs.getBoolPref("autoOpenSidebar");
    try {
        autoOpenSidebar = Chmfox.prefs.getBoolPref("autoOpenSidebar." + url);
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


ChmfoxChrome.on_tab_close = function(event) {
    var browser = gBrowser.getBrowserForTab(event.target);
    var url = browser.contentDocument.location.href;
    var m = decodeURI(url).match(/(chm:\/\/.+\.chm)(!(\/.*))?/i);
    if (! m) {
        return;
    }

    url = m[1];
    var chm = Application.storage.get(url, null);
    if (chm) {
        var thisTabChecked = false;
        var num = gBrowser.browsers.length;
        for (var i = 0; i < num; i++) {
            var b = gBrowser.getBrowserAtIndex(i);
            var match = decodeURI(b.contentDocument.location.href).match(/(chm:\/\/.+\.chm)(!(\/.*))?/i);
            if (match && url == match[1]) {
                if (thisTabChecked) {
                    return;
                }
                else {
                    thisTabChecked = true;
                }
            }
        }
        chm.close();
        Application.storage.set(url, null);
    }
};

window.parent.gBrowser.addEventListener("load", ChmfoxChrome.on_new_url, true);
window.parent.gBrowser.mPanelContainer.addEventListener("select", ChmfoxChrome.on_new_url, false);
gBrowser.tabContainer.addEventListener("TabClose", ChmfoxChrome.on_tab_close, false);
