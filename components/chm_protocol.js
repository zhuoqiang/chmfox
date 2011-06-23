Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

const chmfoxComponents = (function() {

const Ci = Components.interfaces;
const Cc = Components.classes;
const Cr = Components.results;

const kScheme = 'chm';

function log(message) {
  var console = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
  var msg = "[chmfox] " + message + "\n";
  console.logStringMessage(msg);
  dump(msg);
}

function normlizePath(path) {
    var parts = path.split('/');
    var norm = [];
    for (var i = 0; i < parts.length; ++i) {
        switch(parts[i]) {
        case '.':
        case '':
            break;
        case '..':
            if (norm.length != 0) norm.pop();
            break;
      default:
        norm.push(parts[i]);
      }
    }
    return '/' + norm.join('/');
}


function getChmFileAndModifyUri(uri) {
    var urlParts = decodeURI(uri.spec).split('!');
    var url = urlParts[0];
    url = url.substring(4); //Remove "chm:"
    url = "file:" + url;
    url = unescape(url);
    url = url.replace('\\', '/');
    var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    url = ioService.newURI(url, null, null);
    var localfile = url.QueryInterface(Ci.nsIFileURL).file;

    var chmfile = Cc["@zhuoqiang.me/chmfox/CHMFile;1"].createInstance(Ci.ICHMFile);
    if (chmfile.LoadCHM(localfile) != 0) {
        // @todo should use firefox default handle for file not found
        log("file not found: " + localfile.path + "\n");
        uri = ioService.newURI("about:blank", null, null);
        return ioService.newChannelFromURI(uri);
    }
    if (urlParts.length == 1) {
        urlParts.push(chmfile.home);
        uri = ioService.newURI(urlParts.join('!'), null, null);
    }
    var pagepath = urlParts[1];
    return {'file':chmfile, 'page':pagepath};
}

function Protocol() {
}

Protocol.prototype = {
  scheme: kScheme,
  classDescription: "CHM Protocol",
  classID: Components.ID("c152fc51-a5bf-4cc7-99f1-66ca8459d806"),
  contractID: "@mozilla.org/network/protocol;1?name=" + kScheme,
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIProtocolHandler, Ci.nsISupports]),

  defaultPort: -1,
  protocolFlags: Ci.nsIProtocolHandler.URI_NORELATIVE |
                 Ci.nsIProtocolHandler.URI_NOAUTH,

  allowPort: function(port, scheme) {
    return false;
  },

  newURI: function(spec, charset, baseURI) {
    var uri = Cc["@mozilla.org/network/simple-uri;1"].createInstance(Ci.nsIURI);
    if (spec.substring(0, 1) == "#") {
        var basespec = baseURI.spec;
        var pos = basespec.indexOf("#");
        if (pos > 0) {
            basespec = basespec.substring(0, pos);
        }
        uri.spec = basespec + spec;
    }

    else if (spec.indexOf(":") > 0) {
        uri.spec = spec;
    }

    else if (spec.substring(0, 1) != '/') {
        var basespec = baseURI.spec;
        var pos = basespec.lastIndexOf("!/");
        if (pos > 0) {
            var pagepath = basespec.substring(pos + 1, basespec.lastIndexOf('/') + 1) + spec;
            if (pagepath.lastIndexOf('/') >= 1)
                pagepath = normlizePath(pagepath);
            uri.spec = basespec.substring(0, pos + 1) + pagepath;
        } else
            uri.spec = basespec + "!/" + spec;
    }

    getChmFileAndModifyUri(uri);
    return uri;
  },

  newChannel: function(aURI) {
    var chm = getChmFileAndModifyUri(aURI);

    if (chm.page == "/#HHC") {
        return this.newRawTopicsChannel(aURI, chm.file);
    }

    if (chm.page == "/#HHK") {
        return this.newRawIndexChannel(aURI, chm.file);
    }

    var pos = chm.page.indexOf("#");
    if (pos > 0) {
        chm.page = chm.page.substring(0, pos);
    }

    // Create the channel
    var mime = "text/html";
    pos = chm.page.lastIndexOf(".");
    if (pos > 0) {
        var ext = chm.page.substring(pos + 1);
        switch (ext.toLowerCase()) {
        case "gif":
            mime = "image/gif";
            break;
        case "jpg":
        case "jpeg":
            mime = "image/jpeg";
            break;
        case "png":
            mime = "image/png";
            break;
        case "css":
            mime = "text/css";
            break;
        case "mht":
            mime = "message/rfc822";
        case "txt":
            mime = "text/plain";
            break;
        case "xml":
            mime = "text/xml";
            break;
        case "xhtml":
            mime = "text/xhtml";
            break;
        }
    }

    var page_ui = '';
    try {
        page_ui = chm.file.resolveObject(chm.page);
    } catch(e) {
        log("chm.page not found: " + chm.page);
    }

    var is = chm.file.getInputStream(page_ui);

    var isc = Cc["@mozilla.org/network/input-stream-channel;1"].createInstance(Ci.nsIInputStreamChannel);
    isc.contentStream = is;
    isc.setURI(aURI);

    var bc = isc.QueryInterface(Ci.nsIChannel);
    bc.contentType = mime;
    bc.contentLength = page_ui.length;
    bc.originalURI = aURI;
    bc.owner = this;

    return bc;
  },

  newRawIndexChannel: function(aURI, chmfile) {
    var content = chmfile.index;
    content = content.replace(/<OBJECT/ig, '<div');
    content = content.replace(/<\/OBJECT/ig, '</div');
    content = content.replace(/<PARAM/ig, '<span');
    content = content.replace(/<\/PARAM/ig, '</span');
    content = content.replace(/<head>/ig, '<head><meta http-equiv="ContentType" content="text/html; charset=UTF-8">');

    var sis = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
    sis.setData(content, content.length);

    var isc = Cc["@mozilla.org/network/input-stream-channel;1"].createInstance(Ci.nsIInputStreamChannel);
    isc.contentStream = sis;
    isc.setURI(aURI);

    var bc = isc.QueryInterface(Ci.nsIChannel);
    bc.contentType = "text/html";
    bc.contentLength = content.length;
    bc.originalURI = aURI;
    bc.owner = this;

    return bc;
  },

  newRawTopicsChannel: function(aURI, chmfile) {
    var content = chmfile.topics;
    content = content.replace(/<OBJECT/ig, '<div');
    content = content.replace(/<\/OBJECT/ig, '</div');
    content = content.replace(/<PARAM/ig, '<span');
    content = content.replace(/<\/PARAM/ig, '</span');
    content = content.replace(/<head>/ig, '<head><meta http-equiv="ContentType" content="text/html; charset=UTF-8">');

    var sis = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
    sis.setData(content, content.length);

    var isc = Cc["@mozilla.org/network/input-stream-channel;1"].createInstance(Ci.nsIInputStreamChannel);
    isc.contentStream = sis;
    isc.setURI(aURI);

    var bc = isc.QueryInterface(Ci.nsIChannel);
    bc.contentType = "text/html";
    bc.contentLength = content.length;
    bc.originalURI = aURI;
    bc.owner = this;

    return bc;
  }
};

return [Protocol];

})();

if (XPCOMUtils.generateNSGetFactory) {
    const NSGetFactory = XPCOMUtils.generateNSGetFactory(chmfoxComponents);
}
else {
    const NSGetModule = XPCOMUtils.generateNSGetModule(chmfoxComponents);
}
