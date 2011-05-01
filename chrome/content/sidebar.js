var currentCHMFilePath;

function on_bookmark_select() {
    var tree = document.getElementById('chmbookmark');
    var url = tree.view.getCellText(tree.currentIndex, tree.columns[1]);
    if (!url) return;
    var chmmain = window.parent.content.document;
    chmmain.location = "chm:file://" + encodeURI(currentCHMFilePath) + "!/" + url;
}

function on_index_select() {
    var tree = document.getElementById('chmindex');
    var url = tree.view.getCellText(tree.currentIndex, tree.columns[1]);
    var chmmain = window.parent.content.document;
    chmmain.location = "chm:file://" + encodeURI(currentCHMFilePath) + "!/" + url;
}

function on_find_index_keypress(e) {
    if (e.keyCode == e.DOM_VK_RETURN) {
        on_find_index(e);
        on_find_index_focus(e);
    }
}

function on_find_index_focus(e) {
    document.getElementById('find_index').select();
}

function on_find_index(e) {
    var text = document.getElementById('find_index').value.toLowerCase();
    var tree = document.getElementById('chmindex');
    var view = tree.view;
    // somebody write a binary search?
    var i;
    for (i = 1; i < view.rowCount; i++) {
        var name = view.getCellText(i, tree.columns[0]).toLowerCase();
        if (name.substring(0, text.length) == text) {
            view.selection.select(i);
            tree.treeBoxObject.scrollToRow(i);
            break;
        }
    }
}

function on_chmbookmark_iframe_load(event) {
    var doc = document.getElementById('chmbookmark_iframe').contentDocument;
    var tree = document.getElementById('chmbookmark')
    iframe2tree(doc, tree);
}

function on_chmindex_iframe_load(event) {
    var doc = document.getElementById('chmindex_iframe').contentDocument;
    var tree = document.getElementById('chmindex')
    iframe2tree(doc, tree);
}

function iframe2tree(doc, tree) {
    window.dump('begin to generate content tree');

    var body = doc.getElementsByTagName('body').item(0);
    var list = new Array();
    var children = body.getElementsByTagName('LI');
    var j = 0;
    for (var i = 0; i < children.length; i++) {
        var li = children.item(i);
        var isdirect = true;
        var p = li.parentNode;
        while (p != body) {
            if (p.tagName == 'LI') isdirect = false;
            p = p.parentNode;
        }
        if (isdirect) {
            var isc = li.childNodes.length > 2;
            list[j++] = [ li, isc, false, 0 , -1];
        }
    }
    //window.dump(list);

    tree.view = {
      treeBox: null,
      selection: null,

      get rowCount()                     { return list.length; },
      setTree: function(treeBox)         { this.treeBox = treeBox; },
      getCellText: function(idx, column) {
        if (column.id == 'name') {
            var li = list[idx][0];
            var spans = li.getElementsByTagName('span');
            var i;
            for (i = 0; i < spans.length; i++) {
                var p = spans.item(i);
                if (p.getAttribute('name') == 'Name')
                    return p.getAttribute('value');
            }
            return 'missing ...';
        } else if (column.id == 'link') {
            var li = list[idx][0];
            var spans = li.getElementsByTagName('span');
            var i;
            for (i = 0; i < spans.length; i++) {
                var p = spans.item(i);
                if (p.getAttribute('name') == 'Local')
                    return p.getAttribute('value').replace(/\.\//, '');
            }
            return 'missing ...';
        }
      },
      isContainer: function(idx)         { return list[idx][1]; },
      isContainerOpen: function(idx)     { return list[idx][2]; },
      isContainerEmpty: function(idx)    { return false; },
      isSeparator: function(idx)         { return false; },
      isSorted: function()               { return false; },
      isEditable: function(idx, column)  { return false; },

      getParentIndex: function(idx) {
        return list[idx][4]
      },
      getLevel: function(idx) {
        return list[idx][3];
      },
      hasNextSibling: function(idx, after) {
        var thisLevel = this.getLevel(idx);
        for (var t = idx + 1; t < list.length; t++) {
          var nextLevel = this.getLevel(t)
          if (nextLevel == thisLevel) return true;
          else if (nextLevel < thisLevel) return false;
        }
      },
      toggleOpenState: function(idx) {
        var item = list[idx];
        if (!item[1]) return;

        if (item[2]) {
          item[2] = false;

          var thisLevel = this.getLevel(idx);
          var deletecount = 0;
          for (var t = idx + 1; t < list.length; t++) {
            if (this.getLevel(t) > thisLevel) deletecount++;
            else break;
          }
          if (deletecount) {
            list.splice(idx + 1, deletecount);
            this.treeBox.rowCountChanged(idx + 1, -deletecount);
          }
        }
        else {
          item[2] = true;

          var toinsert = new Array();
          var j = 0;
          var children = item[0].getElementsByTagName('LI');
          for (i = 0; i < children.length; i++) {
            var li = children.item(i);
            var isdirect = true;
            var p = li.parentNode;
            while (p != item[0]) {
                if (p.tagName == 'LI') isdirect = false;
                p = p.parentNode;
            }
            if (isdirect) {
                var isc = li.childNodes.length > 2;
                toinsert[j++] = [ li, isc, false, item[3] + 1, idx ];
            }
          }

          for (i = 0; i < toinsert.length; i++) {
            list.splice(idx + i + 1, 0, toinsert[i]);
          }
          //window.dump(list);
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
      getColumnProperties: function(column, element, prop) {},

    };
}

function load_bookmark(url)
{
    var m;
    if (m = decodeURI(url).match(/chm:file:\/\/(.*\.chm)(!(\/.*))?/i)) {
        if (currentCHMFilePath != m[1]) {
            currentCHMFilePath = m[1];

            var topics_iframe = document.getElementById('chmbookmark_iframe');
            var url = "chm:file://" + encodeURI(currentCHMFilePath) + "!/#HHC";
            topics_iframe.setAttribute('src', url);
            window.dump('set topics iframe src to ' + url + '\n');

            var index_iframe = document.getElementById('chmindex_iframe');
            var url = "chm:file://" + encodeURI(currentCHMFilePath) + "!/#HHK";
            index_iframe.setAttribute('src', url);
            window.dump('set index iframe src to ' + url + '\n');

            // load sidebar content after 0.5 second, this is much stable
            // than addEventListener.
            window.setTimeout('on_chmbookmark_iframe_load(null)', 500);
            window.setTimeout('on_chmindex_iframe_load(null)', 500);
        }
        document.getElementById('content_is_chm').hidden = false;
        document.getElementById('content_not_chm').hidden = true;
    } else {
        var topicstree = document.getElementById('chmbookmark');
        var indextree = document.getElementById('chmindex');
        currentCHMFilePath = null;
        topicstree.view = null;
        indextree.view = null;
        document.getElementById('content_is_chm').hidden = true;
        document.getElementById('content_not_chm').hidden = false;
    }
}

function on_browser_document_load(event)
{
    if (window.parent) {
        var url = window.parent.gURLBar.value;
        load_bookmark(url);
    }
}

function on_tab_selected(event)
{
    var gBrowser = window.parent.gBrowser;
    var browser = gBrowser.getBrowserAtIndex(gBrowser.mTabContainer.selectedIndex);
    // browser is the newly selected tab
    var url = browser.currentURI;
    if (url) load_bookmark(url.spec);
}

function on_tab_creation(event)
{
    var gBrowser = window.parent.gBrowser;
    // listening for new tabs
    if (event.relatedNode != gBrowser.mPanelContainer)
        return; //Could be anywhere in the DOM (unless bubbling is caught at the interface?)

    currentCHMFilePath = null;
    document.getElementById('chmbookmark').view = null;
    document.getElementById('chmindex').datasources = "rdf:null";
}

function on_sidebar_load()
{
    window.dump('sidebar loading\n');
    // Register for browser document load
    window.parent.gBrowser.addEventListener("load", on_browser_document_load, true);
    // Register for tab select
    window.parent.gBrowser.mPanelContainer.addEventListener("select", on_tab_selected, false);

    // Register for tab creation
    window.parent.gBrowser.mPanelContainer.addEventListener("DOMNodeInserted", on_tab_creation, false);
    load_bookmark(window.parent.gURLBar.value);

    // When no longer needed
    //gBrowser.removeEventListener("load", examplePageLoad, true);

    // When no longer needed
    //var container = gBrowser.mPanelContainer;
    //container.removeEventListener("select", exampleTabSelected, false);

    window.dump('sidebar loaded\n');
}

window.addEventListener('load', on_sidebar_load, true);
