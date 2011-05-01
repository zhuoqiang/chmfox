Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

const Ci = Components.interfaces;
const Cc = Components.classes;
// const Cr = Components.results;

const kScheme = 'chm';

function log(message) {
  var console = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
  var msg = kScheme + ": " + message + "\n";
  console.logStringMessage(msg);
  dump(msg);
}

function Protocol() {
}

Protocol.prototype = {
  scheme: kScheme,
  classDescription: "CHM Protocol",
  classID: Components.ID("44ec01d7-e036-41d5-baa6-1c4f6f55c7b5"),
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
        uri.spec = basespec.substring(0, pos) + spec;
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
                pagepath = this.removeRelative(pagepath);
            uri.spec = basespec.substring(0, pos + 1) + pagepath;
        } else
            uri.spec = basespec + "!/" + spec;
    }

    return uri;
  },

  newChannel: function(aURI)
  {
    // aURI is a nsIUri, so get a string from it using .spec
    var thefile = decodeURI(aURI.spec);
    var pagepath = '';

    // strip away the kSCHEME: part
    thefile = thefile.substring(thefile.indexOf(":") + 1);
    if (thefile == 'null') {
        var ios = Cc["mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
        var uri = ios.newURI("about:blank", null, null);
        return ios.newChannelFromURI(uri);
    }

    var pos = thefile.indexOf("!");
    if (pos > 0) {
        pagepath = thefile.substring(thefile.indexOf("!") + 1);
        thefile = thefile.substring(0, thefile.indexOf("!"));
    }

    // Load CHM File
    var localfile = Cc["@mozilla.org/file/local;1"]
                              .createInstance(Ci.nsILocalFile);
    var path = thefile.substring(thefile.indexOf("://") + 3);
    localfile.initWithPath(path);
    var chmfile = Cc["@coralsoft.com/chmreader/CHMFile;1"].createInstance(Ci.ICHMFile);
    if (chmfile.LoadCHM(localfile) != 0) {
        this.log("file not found: " + localfile.path + "\n");
        // File not found
        var ios = Cc["mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
        var uri = ios.newURI("about:blank", null, null);
        return ios.newChannelFromURI(uri);
    }

    // Show the default page
    if (pagepath == '') {
        var html = "<html><head>";
        html += '<meta http-equiv="Refresh" content="0;chm:file://' + encodeURI(localfile.path) + '!' + encodeURI(chmfile.home) + '">';
        html += "</head><body/></html>";

        var sis = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
        sis.setData(html, html.length);

        var isc = Cc["@mozilla.org/network/input-stream-channel;1"].createInstance(Ci.nsIInputStreamChannel);
        isc.contentStream = sis;
        isc.setURI(aURI);

        var bc = isc.QueryInterface(Ci.nsIChannel);
        bc.contentType = "text/html";
        bc.contentLength = html.length;
        bc.originalURI = aURI;
        bc.owner = this;

        return bc;
    }

    if (pagepath == "/#HHC") {
        return this.newRawTopicsChannel(aURI, chmfile);
    }

    if (pagepath == "/#HHK") {
        return this.newRawIndexChannel(aURI, chmfile);
    }

    pos = pagepath.indexOf("#");
    if (pos > 0) {
        pagepath = pagepath.substring(0, pos);
    }

    // Create the channel
    pos = pagepath.lastIndexOf(".");
    var ext = pagepath.substring(pos + 1);
    var mime = "text/html";
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

    try {
        pagepath_ui = chmfile.resolveObject(pagepath);
    } catch(e) {
        // pagepath not found
        this.log("pagepath not found: " + pagepath);
    }

    var is = chmfile.getInputStream(pagepath_ui);

    var isc = Cc["@mozilla.org/network/input-stream-channel;1"].createInstance(Ci.nsIInputStreamChannel);
    isc.contentStream = is;
    isc.setURI(aURI);

    var bc = isc.QueryInterface(Ci.nsIChannel);
    bc.contentType = "text/html";
    bc.contentLength = pagepath_ui.length;
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
  },

  removeRelative: function(path) {
    var parts = path.split('/');
    var final = new Array();
    var final_length = 0;
    var i;
    for (i = 0; i < parts.length; i++) {
      switch(parts[i]) {
      case '.':
      case '':
        break;
      case '..':
        if (final_length > 0) final_length--;
        break;
      default:
        final[final_length++] = parts[i];
      }
    }
    return '/' + final.join('/');
  }
};

if (XPCOMUtils.generateNSGetFactory) {
    const NSGetFactory = XPCOMUtils.generateNSGetFactory([Protocol]);
}
else {
    const NSGetModule = XPCOMUtils.generateNSGetModule([Protocol]);
}
