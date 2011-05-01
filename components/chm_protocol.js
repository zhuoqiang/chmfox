/***** BEGIN LICENSE BLOCK *****
   - Version: MPL 1.1/GPL 2.0/LGPL 2.1
   -
   - The contents of this file are subject to the Mozilla Public License Version
   - 1.1 (the "License"); you may not use this file except in compliance with
   - the License. You may obtain a copy of the License at
   - http://www.mozilla.org/MPL/
   -
   - Software distributed under the License is distributed on an "AS IS" basis,
   - WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
   - for the specific language governing rights and limitations under the
   - License.
   -
   - The Original Code is "CHM Reader".
   -
   - The Initial Developer of the Original Code is Denis Remondini.
   - Portions created by the Initial Developer are Copyright (C) 2005-2006 Denis Remondini.  
   - All Rights Reserved.
   -
   - Contributor(s): Ling Li <lilingv AT gmail DOT com>
   -
   - Alternatively, the contents of this file may be used under the terms of
   - either the GNU General Public License Version 2 or later (the "GPL"), or
   - the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
   - in which case the provisions of the GPL or the LGPL are applicable instead
   - of those above. If you wish to allow use of your version of this file only
   - under the terms of either the GPL or the LGPL, and not to allow others to
   - use your version of this file under the terms of the MPL, indicate your
   - decision by deleting the provisions above and replace them with the notice
   - and other provisions required by the LGPL or the GPL. If you do not delete
   - the provisions above, a recipient may use your version of this file under
   - the terms of any one of the MPL, the GPL or the LGPL.
   -
   - 
***** END LICENSE BLOCK *****/

// Test protocol related
const kSCHEME = "chm";
const kPROTOCOL_NAME = "CHM Protocol";
const kPROTOCOL_CONTRACTID = "@mozilla.org/network/protocol;1?name=" + kSCHEME;
const kPROTOCOL_CID = Components.ID("44ec01d7-e036-41d5-baa6-1c4f6f55c7b5");

// Mozilla defined
const kSIMPLEURI_CONTRACTID = "@mozilla.org/network/simple-uri;1";
const kIOSERVICE_CONTRACTID = "@mozilla.org/network/io-service;1";
const kINPUTSTREAMPUMP_CONTRACTID = "@mozilla.org/network/input-stream-pump;1";
const kINPUTSTREAMCHANNEL_CONTRACTID = "@mozilla.org/network/input-stream-channel;1";
const kSTRINGINPUTSTREAM_CONTRACTID = "@mozilla.org/io/string-input-stream;1";
const kLOCALFILE_CONTRACTID = "@mozilla.org/file/local;1";
const kCONSOLESERVICE_CONTRACTID = "@mozilla.org/consoleservice;1";
const nsISupports = Components.interfaces.nsISupports;
const nsIIOService = Components.interfaces.nsIIOService;
const nsIProtocolHandler = Components.interfaces.nsIProtocolHandler;
const nsIURI = Components.interfaces.nsIURI;
const nsILocalFile = Components.interfaces.nsILocalFile;
const nsIInputStreamPump = Components.interfaces.nsIInputStreamPump;
const nsIChannel = Components.interfaces.nsIChannel;
const nsIInputStreamChannel = Components.interfaces.nsIInputStreamChannel;
const nsIStringInputStream = Components.interfaces.nsIStringInputStream;
const nsIConsoleService = Components.interfaces.nsIConsoleService;

const nsOK = 0;
const nsErrorUnexpected = 0x8000ffff;

// chm defined
const kCHMFILE_CONTRACTID = "@coralsoft.com/chmreader/CHMFile;1";
const ICHMFile = Components.interfaces.ICHMFile;

function Protocol()
{
}

Protocol.prototype =
{
  QueryInterface: function(iid)
  {
    if (!iid.equals(nsIProtocolHandler) &&
        !iid.equals(nsISupports))
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  },

  scheme: kSCHEME,
  defaultPort: -1,
  protocolFlags: nsIProtocolHandler.URI_NORELATIVE |
                 nsIProtocolHandler.URI_NOAUTH,
  
  allowPort: function(port, scheme)
  {
    return false;
  },

  newURI: function(spec, charset, baseURI)
  {
    //dump("spec: " + spec + "\n");
    //dump("charset: " + charset + "\n");
    //if (baseURI) dump("basespec: " + baseURI.spec + "\n");
    var uri = Components.classes[kSIMPLEURI_CONTRACTID].createInstance(nsIURI);
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
        var ios = Components.classes[kIOSERVICE_CONTRACTID].getService(nsIIOService);
        var uri = ios.newURI("about:blank", null, null);
        return ios.newChannelFromURI(uri);
    }

    var pos = thefile.indexOf("!");
    if (pos > 0) {
        pagepath = thefile.substring(thefile.indexOf("!") + 1);
        thefile = thefile.substring(0, thefile.indexOf("!"));
    }

    // Load CHM File
    var localfile = Components.classes[kLOCALFILE_CONTRACTID]
                              .createInstance(nsILocalFile);
    var path = thefile.substring(thefile.indexOf("://") + 3);
    localfile.initWithPath(path);
    var chmfile = Components.classes[kCHMFILE_CONTRACTID].createInstance(ICHMFile);
    if (chmfile.LoadCHM(localfile) != 0) {
        this.log("file not found: " + localfile.path + "\n");
        // File not found
        var ios = Components.classes[kIOSERVICE_CONTRACTID].getService(nsIIOService);
        var uri = ios.newURI("about:blank", null, null);
        return ios.newChannelFromURI(uri);
    }

    // Show the default page
    if (pagepath == '') {
        var html = "<html><head>";
        html += '<meta http-equiv="Refresh" content="0;chm:file://' + encodeURI(localfile.path) + '!' + encodeURI(chmfile.home) + '">';
        html += "</head><body/></html>";

        var sis = Components.classes[kSTRINGINPUTSTREAM_CONTRACTID].createInstance(nsIStringInputStream);
        sis.setData(html, html.length);

        var isc = Components.classes[kINPUTSTREAMCHANNEL_CONTRACTID].createInstance(nsIInputStreamChannel);
        isc.contentStream = sis;
        isc.setURI(aURI);

        var bc = isc.QueryInterface(Components.interfaces.nsIChannel);
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

    var isc = Components.classes[kINPUTSTREAMCHANNEL_CONTRACTID].createInstance(nsIInputStreamChannel);
    isc.contentStream = is;
    isc.setURI(aURI);

    var bc = isc.QueryInterface(Components.interfaces.nsIChannel);
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

    var sis = Components.classes[kSTRINGINPUTSTREAM_CONTRACTID].createInstance(nsIStringInputStream);
    sis.setData(content, content.length);

    var isc = Components.classes[kINPUTSTREAMCHANNEL_CONTRACTID].createInstance(nsIInputStreamChannel);
    isc.contentStream = sis;
    isc.setURI(aURI);

    var bc = isc.QueryInterface(Components.interfaces.nsIChannel);
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

    var sis = Components.classes[kSTRINGINPUTSTREAM_CONTRACTID].createInstance(nsIStringInputStream);
    sis.setData(content, content.length);

    var isc = Components.classes[kINPUTSTREAMCHANNEL_CONTRACTID].createInstance(nsIInputStreamChannel);
    isc.contentStream = sis;
    isc.setURI(aURI);

    var bc = isc.QueryInterface(Components.interfaces.nsIChannel);
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
  },

  log: function(msg) {
    var consoleService = Components.classes[kCONSOLESERVICE_CONTRACTID]
                                   .getService(nsIConsoleService);
    consoleService.logStringMessage("CHM Reader: " + msg);
  }
}

var ProtocolFactory = new Object();

ProtocolFactory.createInstance = function (outer, iid)
{
  if (outer != null)
    throw Components.results.NS_ERROR_NO_AGGREGATION;

  if (!iid.equals(nsIProtocolHandler) &&
      !iid.equals(nsISupports))
    throw Components.results.NS_ERROR_NO_INTERFACE;

  return new Protocol();
}

/**
 * JS XPCOM component registration goop:
 *
 * We set ourselves up to observe the xpcom-startup category.  This provides
 * us with a starting point.
 */

var TestModule = new Object();

TestModule.registerSelf = function (compMgr, fileSpec, location, type)
{
  compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
  compMgr.registerFactoryLocation(kPROTOCOL_CID,
                                  kPROTOCOL_NAME,
                                  kPROTOCOL_CONTRACTID,
                                  fileSpec, 
                                  location, 
                                  type);
}

TestModule.getClassObject = function (compMgr, cid, iid)
{
  if (!cid.equals(kPROTOCOL_CID))
    throw Components.results.NS_ERROR_NO_INTERFACE;

  if (!iid.equals(Components.interfaces.nsIFactory))
    throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
    
  return ProtocolFactory;
}

TestModule.canUnload = function (compMgr)
{
  return true;
}

function NSGetModule(compMgr, fileSpec)
{
  return TestModule;
}

