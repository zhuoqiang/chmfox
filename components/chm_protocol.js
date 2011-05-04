Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

const chmfoxComponents = (function() {

const Ci = Components.interfaces;
const Cc = Components.classes;
const Cr = Components.results;

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
      var urlParts = decodeURI(aURI.spec).split('!');
      var url = urlParts[0];
      url = url.substring(4); //Remove "chm:"
      url = unescape(url);
      url = url.replace('\\', '/');
      var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
      url = ioService.newURI(url, null, null);
      var localfile = url.QueryInterface(Ci.nsIFileURL).file;

      var chmfile = Cc["@zhuoqiang.me/chmfox/CHMFile;1"].createInstance(Ci.ICHMFile);
      if (chmfile.LoadCHM(localfile) != 0) {
          // @todo should use firefox default handle for file not found
          log("file not found: " + localfile.path + "\n");
          var uri = ioService.newURI("about:blank", null, null);
          return ioService.newChannelFromURI(uri);
      }

      var pagepath = ''
      if (urlParts.length > 1) {
          pagepath = urlParts[1];
      }

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
        /// @todo add "var" will cause firefox crash!
        pagepath_ui = chmfile.resolveObject(pagepath);
    } catch(e) {
        log("pagepath not found: " + pagepath);
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

return [Protocol];

})();

if (XPCOMUtils.generateNSGetFactory) {
    const NSGetFactory = XPCOMUtils.generateNSGetFactory(chmfoxComponents);
}
else {
    const NSGetModule = XPCOMUtils.generateNSGetModule(chmfoxComponents);
}
