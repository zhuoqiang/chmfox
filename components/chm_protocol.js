Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/ctypes.jsm");

var EXPORTED_SYMBOLS = [ "Chmfox" ];

if ("undefined" == typeof(Chmfox)) {

const Chmfox = (function() {

const Ci = Components.interfaces;
const Cc = Components.classes;
const Cr = Components.results;

const kScheme = 'chm';

var CHM_DATA = {};
var CHM_CACHE = {};

const ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

function utf8Encode(string) {
	var utftext = "";

	for (var n = 0; n < string.length; n++) {
		var c = string.charCodeAt(n);
		if (c < 128) {
			utftext += String.fromCharCode(c);
		}
		else if((c > 127) && (c < 2048)) {
			utftext += String.fromCharCode((c >> 6) | 192);
			utftext += String.fromCharCode((c & 63) | 128);
		}
		else {
			utftext += String.fromCharCode((c >> 12) | 224);
			utftext += String.fromCharCode(((c >> 6) & 63) | 128);
			utftext += String.fromCharCode((c & 63) | 128);
		}
	}
	return utftext;
};

function log(message) {
  var console = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
  var msg = "[chmfox] " + message + "\n";
  console.logStringMessage(msg);
  dump(msg);
}

var Lib = function(libPath) {
    if (! libPath) {
        libPath = ioService.newURI('resource://chmfox-lib', null, null)
            .QueryInterface(Ci.nsIFileURL).file.path;
    }

    this._libraryPath = libPath;
    this._library = ctypes.open(this._libraryPath);

    this.CHM_RESOLVE_SUCCESS = 0;
    this.CHM_RESOLVE_FAILURE = 1;

    this.CHM_UNCOMPRESSED = 0;
    this.CHM_COMPRESSED = 1;

    this.CHM_ENUMERATE_NORMAL = 1;
    this.CHM_ENUMERATE_META = 2;
    this.CHM_ENUMERATE_SPECIAL = 4;
    this.CHM_ENUMERATE_FILES = 8;
    this.CHM_ENUMERATE_DIRS = 16;
    this.CHM_ENUMERATE_ALL = 31;
    this.CHM_ENUMERATOR_FAILURE = 0;

    this.CHM_ENUMERATOR_CONTINUE = 1;
    this.CHM_ENUMERATOR_SUCCESS = 2;

    this.CHM_MAX_PATH_LENGTH = 512;

    this.chmFilePtr = ctypes.StructType("chmFile").ptr;
    this.chmUnitInfo = ctypes.StructType(
        'chmUnitInfo', [
            {'start': ctypes.uint64_t},
            {'length': ctypes.uint64_t},
            {'space': ctypes.int},
            {'flags': ctypes.int},
            {'path': ctypes.char.array(this.CHM_MAX_PATH_LENGTH+1)}
        ]);

    this.enumerator = ctypes.FunctionType(
        ctypes.default_abi,
        ctypes.int, [
            this.chmFilePtr,
            this.chmUnitInfo.ptr,
            ctypes.voidptr_t]);

    this.open = this._library.declare(
        'chmfox_open', ctypes.default_abi,
        this.chmFilePtr,
        ctypes.char.ptr);

    this.close = this._library.declare(
        'chmfox_close', ctypes.default_abi,
        ctypes.void_t,
        this.chmFilePtr);

    this.set_param = this._library.declare(
        'chmfox_set_param', ctypes.default_abi,
        ctypes.void_t,
        this.chmFilePtr, ctypes.int, ctypes.int);

    this.resolve_object = this._library.declare(
        'chmfox_resolve_object', ctypes.default_abi,
        ctypes.int,
        this.chmFilePtr, ctypes.char.ptr, this.chmUnitInfo.ptr);

    this.retrieve_object = this._library.declare(
        'chmfox_retrieve_object', ctypes.default_abi,
        ctypes.int64_t,
        this.chmFilePtr, this.chmUnitInfo.ptr, ctypes.unsigned_char.ptr,
        ctypes.uint64_t, ctypes.int64_t);

    this.enumerate = this._library.declare(
        'chmfox_enumerate', ctypes.default_abi,
        ctypes.int,
        this.chmFilePtr, ctypes.int, this.enumerator.ptr, ctypes.voidptr_t);

    this.enumerate_dir = this._library.declare(
        'chmfox_enumerate_dir', ctypes.default_abi,
        ctypes.int,
        this.chmFilePtr, ctypes.char.ptr, ctypes.int, this.enumerator.ptr, ctypes.voidptr_t);

    return this;
};

var lib = Lib();

function getString(array, index, len) {
    return ctypes.cast(array.addressOfElement(index), ctypes.char.ptr).readString();
}

function getUInt32(array, index) {
    return ctypes.cast(array.addressOfElement(index), ctypes.uint32_t.ptr).contents;
}

function getUInt64(array, index) {
    return ctypes.cast(array.addressOfElement(index), ctypes.uint64_t.ptr).contents;
}

function prependSlash(str) {
    if (str[0] != '/') {
        return '/' + str;
    }
    return str;
}

function HtmlizeObject(str) {
    return str
        .replace(/<OBJECT/ig, '<div')
        .replace(/<\/OBJECT/ig, '</div')
        .replace(/<PARAM/ig, '<span')
        .replace(/<\/PARAM/ig, '</span');
}

var ChmFile = function(path) {
    this.path = path;
    this.handle = lib.open(this.path);
    log(this.handle.toSource());

    this.isValid = function() {
        return !this.handle.isNull();
    };


    this.getSystemInfo = function () {
        var ui = lib.chmUnitInfo();
        if (lib.CHM_RESOLVE_FAILURE == lib.resolve_object(this.handle, '/#SYSTEM', ui.address())) {
            log('getSystemInfo error: #SYSTEM does not exists in ' + this.path);
            return ;
        }

        var buffer = ctypes.unsigned_char.array(ui.length)();
        var length = lib.retrieve_object(
            this.handle, ui.address(),
            buffer.addressOfElement(0),
            4, buffer.length);
        if (length == 0) {
            log('getSystemInfo error: #SYSTEM retrieved 0 bytes in ' + this.path);
            return;
        }
        var index = 0;
        while (index < length) {
            var type = buffer[index] + (buffer[index+1] * 256);
            index += 2;
            var len = buffer[index] + (buffer[index+1] * 256);
            index += 2;
            log("type:" + type + " " + len);
            switch(type) {
                case 0:
                    this.topics = "/" + getString(buffer, index, len);
                    break;
                case 1:
                    this.index = "/" + getString(buffer, index, len);
                    break;
                case 2:
                    this.home = "/" + getString(buffer, index, len);
                    log("home: " + this.home);
                    break;
                case 3:
                    this.title = getString(buffer, index, len);
                    log("title: " + this.title);
                    break;
                case 4:
                    this.lcid = getUInt32(buffer, index);
                    this.use_dbcs = getUInt32(buffer, index+0x4);
                    this.searchable = getUInt32(buffer, index+0x8);
                    this.has_klinks = getUInt32(buffer, index+0xc);
                    this.has_alinks = getUInt32(buffer, index+0x10);
                    this.timestamp = getUInt64(buffer, index+0x14);
                    log(this.lcid + ", " + this.use_dbcs + ", " + this.searchable);
                    break;
                case 5: // Always "main"?
                    this.default_window = getString(buffer, index, len);
                case 6: // Project name '.hhc' '.hhk'
                    this.project = getString(buffer, index, len);
                case 7:
                    this.has_binary_index = getUInt32(buffer, index);
                    break;
                case 9: // Encoder
                    this.compiled_by = getString(buffer, index, len);
                    break;
                case 10: // Unknown
                    break;
                case 11:
                    this.has_binary_toc = getUInt32(buffer, index);
                    break;
                case 12: // Unknown
                case 13: // Unknown
                case 15: // Unknown
                    break;
                case 16:
                    this.encoding = getString(buffer, index, len);
                    log('encoding: ' + this.encoding);
                    break;
            }
            index += len;
        }

        // Gets information from the #WINDOWS file.
        // Checks the #WINDOWS file to see if it has any info that was
        // not found in #SYSTEM (topics, index or default page.
        if (lib.CHM_RESOLVE_FAILURE == lib.resolve_object(this.handle, '/#WINDOWS', ui.address())) {
            log('getSystemInfo error: #WINDOWS does not exists in ' + this.path);
            return;
        }

        log("home: " + this.home);
        log("index: " + this.index);
        log("topics: " + this.topics);

        const WINDOWS_HEADER_LENGTH = 8;
        buffer = ctypes.unsigned_char.array(WINDOWS_HEADER_LENGTH)();
        length = lib.retrieve_object(
            this.handle, ui.address(),
            buffer.addressOfElement(0), 0, buffer.length);
        if (length < buffer.length) {
            log('getSystemInfo error: /#WINDOWS header retrive error in ' + this.path);
            return;
        }
        var entries = getUInt32(buffer, 0);
        var entry_size = getUInt32(buffer, 4);
        buffer = ctypes.unsigned_char.array(entries*entry_size)();
        length = lib.retrieve_object(
            this.handle, ui.address(),
            buffer.addressOfElement(0), WINDOWS_HEADER_LENGTH, buffer.length);

        if (length == 0) {
            log('getSystemInfo error: /#WINDOWS retrive error in ' + this.path);
            return;
        }

        if (lib.resolve_object(this.handle, "/#STRINGS", ui.address()) != lib.CHM_RESOLVE_SUCCESS) {
            log('getSystemInfo error: /#STRINGS resolve error in ' + this.path);
            return;
        }

        var size = 0;
        var factor_buffer = ctypes.unsigned_char.array(4096)();

        for (var i = 0; i < entries; ++i) {
            var offset = i * entry_size;
            var off_title = getUInt32(buffer, offset + 0x14);
            var off_home = getUInt32(buffer, offset + 0x68);
            var off_hhc = getUInt32(buffer, offset + 0x60);
            var off_hhk = getUInt32(buffer, offset + 0x64);
            var factor = Math.floor(off_title / 4096);
            if (size == 0) {
                size = lib.retrieve_object(
                    this.handle, ui.address(),
                    factor_buffer.addressOfElement(0),
                    factor*4096, factor_buffer.length);
            }
            if (size && off_title && this.title) {
                this.title = prependSlash(getString(factor_buffer, off_title % 4096));
            }

			if(factor != Math.floor(off_home / 4096)) {
				factor = Math.floor(off_home / 4096);
                size = lib.retrieve_object(
                    this.handle, ui.address(),
                    factor_buffer.addressOfElement(0),
                    factor*4096, factor_buffer.length);
			}

            if (size && off_home && !this.home) {
                this.home = prependSlash(getString(factor_buffer, off_home % 4096));
            }

            if (factor != Math.floor(off_hhc/4096)) {
				factor = Math.floor(off_hhc / 4096);
				size = lib.retrieve_object(
                    this.handle, ui.address(),
					factor_buffer.addressOfElement(0),
					factor * 4096,
					factor_buffer.length);
			}

			if (size && off_hhc && !this.topics) {
                this.topics = prependSlash(getString(factor_buffer, off_hhc % 4096));
            }

            if (factor != Math.floor(off_hhk / 4096)) {
				factor = Math.floor(off_hhk / 4096);
				size = lib.retrieve_object(
                    this.handle, ui.address(),
				    factor_buffer.addressOfElement(0),
				    factor * 4096,
				    factor_buffer.length);
			}

			if(size && off_hhk && !this.index) {
                this.index = prependSlash(getString(factor_buffer, off_hhk % 4096));
            }

            log("home: " + this.home);
            log("index: " + this.index);
            log("topics: " + this.topics);
        };

    };

    this.getSystemInfo();

    /// get topics content
    if (this.topics) {
        var ui = lib.chmUnitInfo();
        if (lib.CHM_RESOLVE_SUCCESS == lib.resolve_object(
                this.handle, this.topics, ui.address())) {
            var buf = ctypes.unsigned_char.array(Math.floor(ui.length+1))();
            var r = lib.retrieve_object(
                this.handle, ui.address(),
                buf.addressOfElement(0), 0, ui.length);
            if (r > 0) {
                this.topics_content = getString(buf, 0);
                this.html_topics = HtmlizeObject(this.topics_content);
            }
        }
    }

    /// get index content
    if (this.topics) {
        var ui = lib.chmUnitInfo();
        if (lib.CHM_RESOLVE_SUCCESS == lib.resolve_object(
                this.handle, this.index, ui.address())) {
            var buf = ctypes.unsigned_char.array(Math.floor(ui.length+1))();
            var r = lib.retrieve_object(
                this.handle, ui.address(),
                buf.addressOfElement(0), 0, ui.length);
            if (r > 0) {
                this.index_content = getString(buf, 0);
                this.html_index = HtmlizeObject(this.index_content);
            }
        }
    }

    return this;
};

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

function redirect(to, orig) {
    var html = '<html><head><meta http-equiv="refresh" content="0; url=' +
                   utf8Encode(to) + '" /></head></html>';
    var sis = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
    sis.setData(html, html.length);
    var isc = Cc["@mozilla.org/network/input-stream-channel;1"].createInstance(Ci.nsIInputStreamChannel);
    isc.contentStream = sis;
    isc.setURI(orig);

    var bc = isc.QueryInterface(Ci.nsIChannel);
    bc.contentCharset = 'utf-8';
    bc.contentType = "text/html";
    bc.contentLength = html.length;
    bc.originalURI = orig;
    bc.owner = this;
    return bc;
}

function getChmFileAndModifyUri(uri) {
    var urlParts = decodeURI(uri.spec).split('!');
    var url = urlParts[0];
    url = url.substring(4); //Remove "chm:"
    url = "file:" + url;
    url = unescape(url);
    url = url.replace('\\', '/');
    url = ioService.newURI(url, null, null);
    var chmfile = CHM_DATA[url.spec] && CHM_DATA[url.spec].file;
    if (! chmfile) {
        chmfile = Cc["@zhuoqiang.me/chmfox/CHMFile;1"].createInstance(Ci.ICHMFile);
        var localfile = url.QueryInterface(Ci.nsIFileURL).file;
        if (chmfile.LoadCHM(localfile) != 0) {
            // @todo should use firefox default handle for file not found
            log("file not found: " + localfile.path + "\n");
            uri = ioService.newURI("about:blank", null, null);
            return ioService.newChannelFromURI(uri);
        }
        CHM_DATA[url.spec] = {};
        CHM_DATA[url.spec].file = chmfile;
        CHM_DATA[url.spec].html_topics = chmfile.topics
            .replace(/<OBJECT/ig, '<div')
            .replace(/<\/OBJECT/ig, '</div')
            .replace(/<PARAM/ig, '<span')
            .replace(/<\/PARAM/ig, '</span');

        CHM_DATA[url.spec].html_index = chmfile.index
            .replace(/<OBJECT/ig, '<div')
            .replace(/<\/OBJECT/ig, '</div')
            .replace(/<PARAM/ig, '<span')
            .replace(/<\/PARAM/ig, '</span');
    }

    var chm = CHM_CACHE[url.spec] && CHM_DATA[url.spec].file;
    if (! chm) {
        chm = ChmFile(url.QueryInterface(Ci.nsIFileURL).file.path);
        if (! chm.isValid()) {
            // @todo should use firefox default handle for file not found
            log("file not found: " + localfile.path + "\n");
            uri = ioService.newURI("about:blank", null, null);
            return ioService.newChannelFromURI(uri);
        }

        log('chm file open: ' + chm.isValid());
        chm.getSystemInfo();
        CHM_CACHE[url.spec] = {};
        CHM_CACHE[url.spec].file = chm;
    }

    var pagepath = null;

    if (urlParts.length == 1) {
        urlParts.push(chmfile.home);
        uri = ioService.newURI(urlParts.join('!'), null, null);
    }
    else {
        pagepath = urlParts[1];
    }
    return {
        'file':chmfile,
        'page':pagepath,
        'uri':uri,
        'path':url.spec};
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

    if (! chm.page) {
        return redirect(chm.uri.spec, aURI);
    }

    if (chm.page == "/#HHC") {
        return this.newRawTopicsChannel(aURI, chm.path);
    }

    if (chm.page == "/#HHK") {
        return this.newRawIndexChannel(aURI, chm.path);
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
        page_ui = chm.file.resolveObject(utf8Encode(chm.page));
    } catch(e) {
        log("chm.page not found: " + chm.page);
    }

    var is = chm.file.getInputStream(page_ui);

    var isc = Cc["@mozilla.org/network/input-stream-channel;1"].createInstance(Ci.nsIInputStreamChannel);
    isc.contentStream = is;
    isc.setURI(aURI);

    var bc = isc.QueryInterface(Ci.nsIChannel);
    bc.contentType = mime;
    // The encoding is in the HTML header
    // bc.contentCharset = 'utf-8';
    bc.contentLength = page_ui.length;
    bc.originalURI = aURI;
    bc.owner = this;

    return bc;
  },

  newRawIndexChannel: function(aURI, chm_path) {
    var content = CHM_DATA[chm_path].html_index;
    var sis = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
    sis.setData(content, content.length);

    var isc = Cc["@mozilla.org/network/input-stream-channel;1"].createInstance(Ci.nsIInputStreamChannel);
    isc.contentStream = sis;
    isc.setURI(aURI);

    var bc = isc.QueryInterface(Ci.nsIChannel);
    bc.contentCharset = 'utf-8';
    bc.contentType = "text/html";
    bc.contentLength = content.length;
    bc.originalURI = aURI;
    bc.owner = this;

    return bc;
  },

  newRawTopicsChannel: function(aURI, chm_path) {
    var content = CHM_DATA[chm_path].html_topics;
    var sis = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
    sis.setData(content, content.length);

    var isc = Cc["@mozilla.org/network/input-stream-channel;1"].createInstance(Ci.nsIInputStreamChannel);
    isc.contentStream = sis;
    isc.setURI(aURI);

    var bc = isc.QueryInterface(Ci.nsIChannel);
    bc.contentCharset = 'utf-8';
    bc.contentType = "text/html";
    bc.contentLength = content.length;
    bc.originalURI = aURI;
    bc.owner = this;

    return bc;
  }
};


function openUri(uri) {
    const wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
    var browserEnumerator = wm.getEnumerator("navigator:browser");
    wm.getMostRecentWindow("navigator:browser").loadURI(uri);
}

const uriContentListener = {
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsIURIContentListener,
        Ci.nsISupportsWeakReference,
        Ci.nsISupports]),

     onStartURIOpen: function(uri) {
         try {
             if (uri.schemeIs("file")) {
                 var url = uri.QueryInterface(Ci.nsIURL);
                 if (url.fileExtension.toLowerCase() == 'chm') {
                     uri.scheme = kScheme;
                     log("redirect to [" + uri.spec + "]");
                     const timer = Cc["@mozilla.org/timer;1"]
                         .createInstance(Ci.nsITimer);
                     timer.initWithCallback(function() {
                         openUri(uri.spec);
                     }, 0, Ci.nsITimer.TYPE_ONE_SHOT);
                     return true;
                 }
             }
         }
         catch(e) {
             log(e);
         }
         return false;
     },

    isPreferred: function(contentType, desiredContentType) {
        try {
            var webNavInfo = Cc["@mozilla.org/webnavigation-info;1"].getService(Ci.nsIWebNavigationInfo);
            return webNavInfo.isTypeSupported(contentType, null);
        }
        catch (e) {
            log(e);
        }
        return false;
    }
};

return {log:log, protocols: [Protocol], uriContentListener: uriContentListener};

})();

};

if (XPCOMUtils.generateNSGetFactory) {
    const NSGetFactory = XPCOMUtils.generateNSGetFactory(Chmfox.protocols);
}
else {
    const NSGetModule = XPCOMUtils.generateNSGetModule(Chmfox.protocols);
}
