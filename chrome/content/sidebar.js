Components.utils.import("resource://chmfox/chmfox.js");

if ("undefined" == typeof(ChmfoxChrome)) {
  var ChmfoxChrome = {
  };
};

ChmfoxChrome.currentChm = null;

ChmfoxChrome.chm_url = function(fragment, filePath) {
    if (fragment.match(/https?:\/\//i)) {
        return fragment;
    }
    if (!filePath) {
        filePath = ChmfoxChrome.currentChm.uri;
    }

    // Support external CHM
    // file.chm
    if (fragment.substr(-4).toLowerCase() == '.chm') {
        var paths = filePath.split('/');
        paths[paths.length-1] = fragment;
        filePath = paths.join('/');
        fragment = '';
    }
    // Support multiple-part CHM file
    // file.chm::/Related_Documentation.html
    else if (fragment.match(/\.chm::\//i)) {
        var parts = fragment.split('::\/');
        var paths = filePath.split('/');
        paths[paths.length-1] = parts[0];
        filePath = paths.join('/');
        fragment = parts[1];
    }

    var uri = filePath + "!/" + fragment;
    return uri;
};

ChmfoxChrome.change_to_url = function(url, chmFilePath) {
    if (url) {
        var doc = window.parent.content.document;
        var newLocation = ChmfoxChrome.chm_url(url, chmFilePath);
        if (doc.location != newLocation) {
            doc.location = newLocation;
        }
    }
};

ChmfoxChrome.on_bookmark_select = function() {
    var tree = document.getElementById('chmfoxBookmark');
    var url = tree.view.getCellText(tree.currentIndex, tree.columns[1]);
    ChmfoxChrome.change_to_url(url);
};

ChmfoxChrome.on_index_select = function() {
    var tree = document.getElementById('chmfoxIndex');
    var url = tree.view.getCellText(tree.currentIndex, tree.columns[1]);
    ChmfoxChrome.change_to_url(url);
};

ChmfoxChrome.on_find_index_keypress = function(e) {
    if (e.keyCode == e.DOM_VK_RETURN) {
        ChmfoxChrome.on_find_index(e);
        ChmfoxChrome.on_find_index_focus(e);
    }
};

ChmfoxChrome.on_find_index_focus = function(e) {
    document.getElementById('find_index').select();
};

ChmfoxChrome.on_find_index = function(e) {
    var text = document.getElementById('find_index').value.toLowerCase();
    var tree = document.getElementById('chmfoxIndex');
    var view = tree.view;
    for (var i = 1; i < view.rowCount; i++) {
        var name = view.getCellText(i, tree.columns[0]).toLowerCase();
        if (name.substring(0, text.length) == text) {
            view.selection.select(i);
            tree.treeBoxObject.scrollToRow(i);
            break;
        }
    }
};

ChmfoxChrome.on_chmfoxBookmark_iframe_load = function(event) {
    var tree = document.getElementById('chmfoxBookmark');
    if (! ChmfoxChrome.currentChm.contentTreeView) {
        var doc = event.originalTarget;
        // var doc = document.getElementById('chmfoxBookmark_iframe').contentDocument;
        ChmfoxChrome.currentChm.contentTreeView = ChmfoxChrome.iframe2tree(doc, tree);
        var iframe = document.getElementById('chmfoxBookmark_iframe');
        iframe.setAttribute('src', null);
    }
    tree.view = ChmfoxChrome.currentChm.contentTreeView;
};

ChmfoxChrome.on_chmfoxIndex_iframe_load = function(event) {
    var tree = document.getElementById('chmfoxIndex');
    if (! ChmfoxChrome.currentChm.indexTreeView) {
        // var doc = document.getElementById('chmfoxIndex_iframe').contentDocument;
        var doc = event.originalTarget;
        ChmfoxChrome.currentChm.indexTreeView = ChmfoxChrome.iframe2tree(doc, tree);
        var iframe = document.getElementById('chmfoxIndex_iframe');
        iframe.setAttribute('src', null);
    }
    tree.view = ChmfoxChrome.currentChm.indexTreeView;
};

ChmfoxChrome.iframe2tree = function(doc, tree) {

    function getCell(li) {
        var spans = [];
        try {
            spans = li.getElementsByTagName('span');
        }
        catch (e) {
        }

        var name = null;
        for (var i = 0; i < spans.length; i++) {
            var p = spans.item(i);
            if (p.getAttribute('name') == 'Name') {
                name = p.getAttribute('value');
                break;
            }
        }
        
        var link = null;
        for (var i = 0; i < spans.length; i++) {
            var p = spans.item(i);
            if (p.getAttribute('name') == 'Local') {
                link =  p.getAttribute('value').replace(/\.\//, '');
                break
            }
            // Support multiple CHM
            // <span name="Merge" value="crackme05.chm::\crackme5.hhc">
            else if (p.getAttribute('name') == 'Merge') {
                var uri = p.getAttribute('value').replace(/\.\//, '');
                link = uri.split('::')[0]; // uri.replace('::\\', '::/');
                break;
            }
        }
        return {'name':name, 'link':link};
    };

    function getList(node, level) {
        var children = [];
        try {
            children = node.getElementsByTagName('li');
        }
        catch (e) {
        }

        var list = [];
        for (var i = 0; i < children.length; ++i) {
            var li = children[i];
            var isdirect = true;
            var p = li.parentNode;
            while (p != node) {
                if (p.tagName.toLowerCase() == 'li')  {
                    isdirect = false;
                    break;
                }
                p = p.parentNode;
            }

            if (isdirect) {
                // name+link, children, open, level, parentId
                list.push([getCell(li), getList(li, level+1), false, level, -1]);
            }
        }
        return list;
    }

    var body = doc.getElementsByTagName('body')[0];
    var list = getList(body, 0);

    var view = {
      treeBox: null,
      selection: null,

      get rowCount()                     { return list.length; },
      setTree: function(treeBox)         { this.treeBox = treeBox; },
      getCellText: function(idx, column) {
          return list[idx][0][column.id];
      },
      isContainer: function(idx)         { return list[idx][1].length != 0; },
      isContainerOpen: function(idx)     { return list[idx][2]; },
      isContainerEmpty: function(idx)    { return false; },
      isSeparator: function(idx)         { return false; },
      isSorted: function()               { return false; },
      isEditable: function(idx, column)  { return false; },

      getParentIndex: function(idx) {
        return list[idx][4];
      },
      getLevel: function(idx) {
        return list[idx][3];
      },
      hasNextSibling: function(idx, after) {
        var thisLevel = this.getLevel(idx);
        for (var t = idx + 1; t < list.length; t++) {
          var nextLevel = this.getLevel(t);
          if (nextLevel == thisLevel) return true;
          else if (nextLevel < thisLevel) return false;
        }
        return false;
      },

      toggleOpenState: function(idx) {
          if (! this.isContainer(idx)) {
              return;
          }
        
          var item = list[idx];

          if (this.isContainerOpen(idx)) {
              item[2] = false;

              var thisLevel = this.getLevel(idx);
              var deletecount = 0;
              for (var t = idx + 1; t < list.length; t++) {
                  if (this.getLevel(t) > thisLevel) {
                      ++ deletecount;
                  }
                  else {
                      break;
                  }
              }
              if (deletecount != 0) {
                  list.splice(idx + 1, deletecount);
                  this.treeBox.rowCountChanged(idx + 1, -deletecount);
              }
          }
          else {
              item[2] = true;
              var toinsert = item[1];
              for (var i = 0; i < toinsert.length; i++) {
                  list.splice(idx + i + 1, 0, toinsert[i]);
              }
              this.treeBox.rowCountChanged(idx + 1, toinsert.length);
          }
      },

      getImageSrc: function(idx, column) {},
      getProgressMode : function(idx,column) {},
      getCellValue: function(idx, column) {},
      cycleHeader: function(col, elem) {},
      selectionChanged: function() {},
      cycleCell: function(idx, column) {},
      performAction: function(action) {},
      performActionOnCell: function(action, index, column) {},
      getRowProperties: function(idx, column, prop) {},
      getCellProperties: function(idx, column, prop) {},
      getColumnProperties: function(column, element, prop) {}
    };

    return view;
};


ChmfoxChrome.load_content_panel = function () {
    if (! ChmfoxChrome.currentChm.contentTreeView) {
        var topics_iframe = document.getElementById('chmfoxBookmark_iframe');
        var url = ChmfoxChrome.chm_url('#HHC');
        topics_iframe.setAttribute('src', url);
        topics_iframe.addEventListener(
            "DOMContentLoaded",
            ChmfoxChrome.on_chmfoxBookmark_iframe_load,
            false);
    }
    else {
        ChmfoxChrome.on_chmfoxBookmark_iframe_load();
    }
};

ChmfoxChrome.load_index_panel = function () {
    if (! ChmfoxChrome.currentChm.indexTreeView) {
        var index_iframe = document.getElementById('chmfoxIndex_iframe');
        var url = ChmfoxChrome.chm_url("#HHK");
        index_iframe.setAttribute('src', url);
        index_iframe.addEventListener(
            "DOMContentLoaded",
            ChmfoxChrome.on_chmfoxIndex_iframe_load,
            false);
    }
    else {
        ChmfoxChrome.on_chmfoxIndex_iframe_load();
    }
};

ChmfoxChrome.load_bookmark = function(uri) {
    var m = decodeURI(uri).match(/(chm:\/\/.+\.chm)(!(\/.*))?/i);
    if (m) {
        var chm_uri = m[1];
        var chm = Application.storage.get(chm_uri, null);
        if (ChmfoxChrome.currentChm != chm) {
            ChmfoxChrome.currentChm = chm;
            if (document.getElementById('chmfoxContentTab').selected) {
                ChmfoxChrome.load_content_panel();
            }
            else {
                ChmfoxChrome.load_index_panel();
            }
        }
    }
    else {
        var topicstree = document.getElementById('chmfoxBookmark');
        var indextree = document.getElementById('chmfoxIndex');
        ChmfoxChrome.currentChm = null;
        topicstree.view = null;
        indextree.view = null;
    }
};

ChmfoxChrome.on_browser_document_load = function(event) {
    if (window.parent) {
        var doc = window.parent.content.document;
        var url = doc.location.href;
        ChmfoxChrome.load_bookmark(url);
    }
};

ChmfoxChrome.on_tab_selected = function(event) {
    var gBrowser = window.parent.gBrowser;
    var browser = gBrowser.getBrowserAtIndex(gBrowser.mTabContainer.selectedIndex);
    var url = browser.contentDocument.location.href;
    if (url) {
        ChmfoxChrome.load_bookmark(url);
    }
};

ChmfoxChrome.on_tab_creation = function(event)
{
    var gBrowser = window.parent.gBrowser;
    // listening for new tabs
    if (event.relatedNode != gBrowser.mPanelContainer) {
        return; //Could be anywhere in the DOM (unless bubbling is caught at the interface?)
    }
    ChmfoxChrome.currentChm = null;
    document.getElementById('chmfoxBookmark').view = null;
    document.getElementById('chmfoxIndex').datasources = "rdf:null";
};

ChmfoxChrome.on_sidebar_close = function(e) {
    var doc = window.parent.content.document;
    var url = doc.location.href;
    url = decodeURI(url).split('!')[0];
    if (url.substr(0, 7) != 'chm:///') {
        return;
    }
    Chmfox.prefs.setBoolPref("autoOpenSidebar."+url, false);
};

ChmfoxChrome.on_tabbox_select = function(event) {
    var doc = window.parent.content.document;
    var url = doc.location.href;
    ChmfoxChrome.load_bookmark(url);
};

ChmfoxChrome.on_sidebar_load = function() {
    window.parent.gBrowser.mPanelContainer.addEventListener("select", ChmfoxChrome.on_tab_selected, false);
    var tabbox = document.getElementById('chmfoxTabbox');
    tabbox.addEventListener("select", ChmfoxChrome.on_tabbox_select, false);

    var sidebar_closebutton = top.document.querySelector('#sidebar-box toolbarbutton');
    if (sidebar_closebutton) {
        sidebar_closebutton.addEventListener('command', ChmfoxChrome.on_sidebar_close, false);
    }

    var doc = window.parent.content.document;
    var url = doc.location.href;
    ChmfoxChrome.load_bookmark(url);
};


window.addEventListener('load', ChmfoxChrome.on_sidebar_load, false);

var sidebarUriDetector = {
    init: function() {
        var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIWebNavigation)
            .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
            .rootTreeItem
            .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIDOMWindow);
        
        var appcontent = mainWindow.document.getElementById("appcontent");   // browser
        if(appcontent){
            appcontent.addEventListener("DOMContentLoaded", sidebarUriDetector.onPageLoad, true);
        }
    },

    onPageLoad: function(aEvent) {
        var doc = aEvent.originalTarget; // doc is document that triggered "onload" event
        var url = doc.location.href;
        ChmfoxChrome.load_bookmark(url);
    },

    onPageUnload: function(aEvent) {
        var doc = aEvent.originalTarget; // doc is document that triggered "onload" event
    }
};

window.addEventListener("load", function load(event) {
    window.removeEventListener("load", load, false); //remove listener, no longer needed
    sidebarUriDetector.init();  
},false);
