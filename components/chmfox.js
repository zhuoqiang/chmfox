Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/ctypes.jsm");


var EXPORTED_SYMBOLS = [ "Chmfox"];

if ("undefined" == typeof(Chmfox)) {

var Chmfox = (function() {

const Ci = Components.interfaces;
const Cc = Components.classes;
const Cr = Components.results;

var Application = Cc["@mozilla.org/fuel/application;1"].getService(Ci.fuelIApplication);
var xulRuntime = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime);

const prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("extensions.chmfox.");

const kScheme = 'chm';

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
    if (false) // Disable log for release
    {
        var console = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
        var msg = "[chmfox] " + message + "\n";
        console.logStringMessage(msg);
        dump(msg);
    }
}

function getCharsetFromLcid(lcid) {
    switch (lcid) {
    case 0x0436: return "ISO-8859-1"; // "Afrikaans", "Western Europe & US"
    case 0x041c: return "ISO-8859-2"; // "Albanian", "Central Europe"
    case 0x0401: return "ISO-8859-6"; // "Arabic_Saudi_Arabia", "Arabic"
    case 0x0801: return "ISO-8859-6"; // "Arabic_Iraq", "Arabic"
    case 0x0c01: return "ISO-8859-6"; // "Arabic_Egypt", "Arabic"
    case 0x1001: return "ISO-8859-6"; // "Arabic_Libya", "Arabic"
    case 0x1401: return "ISO-8859-6"; // "Arabic_Algeria", "Arabic"
    case 0x1801: return "ISO-8859-6"; // "Arabic_Morocco", "Arabic"
    case 0x1c01: return "ISO-8859-6"; // "Arabic_Tunisia", "Arabic"
    case 0x2001: return "ISO-8859-6"; // "Arabic_Oman", "Arabic"
    case 0x2401: return "ISO-8859-6"; // "Arabic_Yemen", "Arabic"
    case 0x2801: return "ISO-8859-6"; // "Arabic_Syria", "Arabic"
    case 0x2c01: return "ISO-8859-6"; // "Arabic_Jordan", "Arabic"
    case 0x3001: return "ISO-8859-6"; // "Arabic_Lebanon", "Arabic"
    case 0x3401: return "ISO-8859-6"; // "Arabic_Kuwait", "Arabic"
    case 0x3801: return "ISO-8859-6"; // "Arabic_UAE", "Arabic"
    case 0x3c01: return "ISO-8859-6"; // "Arabic_Bahrain", "Arabic"
    case 0x4001: return "ISO-8859-6"; // "Arabic_Qatar", "Arabic"
    case 0x042b: return null; //        "Armenian","Armenian"
    case 0x042c: return "ISO-8859-9"; // "Azeri_Latin", "Turkish"
    case 0x082c: return "cp1251"; //    "Azeri_Cyrillic", "Cyrillic"
    case 0x042d: return "ISO-8859-1"; // "Basque", "Western Europe & US"
    case 0x0423: return "cp1251"; //    "Belarusian", "Cyrillic"
    case 0x0402: return "cp1251"; //    "Bulgarian", "Cyrillic"
    case 0x0403: return "ISO-8859-1"; // "Catalan", "Western Europe & US"
    case 0x0404: return "BIG5"; //      "Chinese_Taiwan", "Traditional Chinese"
    case 0x0804: return "GBK"; //       "Chinese_PRC", "Simplified Chinese"
    case 0x0c04: return "BIG5"; //      "Chinese_Hong_Kong", "Traditional Chinese"
    case 0x1004: return "GBK"; //       "Chinese_Singapore", "Simplified Chinese"
    case 0x1404: return "BIG5"; //      "Chinese_Macau", "Traditional Chinese"
    case 0x041a: return "ISO-8859-2"; // "Croatian", "Central Europe"
    case 0x0405: return "ISO-8859-2"; // "Czech", "Central Europe"
    case 0x0406: return "ISO-8859-1"; // "Danish", "Western Europe & US"
    case 0x0413: return "ISO-8859-1"; // "Dutch_Standard", "Western Europe & US"
    case 0x0813: return "ISO-8859-1"; // "Dutch_Belgian", "Western Europe & US"
    case 0x0409: return "ISO-8859-1"; // "English_United_States", "Western Europe & US"
    case 0x0809: return "ISO-8859-1"; // "English_United_Kingdom", "Western Europe & US"
    case 0x0c09: return "ISO-8859-1"; // "English_Australian", "Western Europe & US"
    case 0x1009: return "ISO-8859-1"; // "English_Canadian", "Western Europe & US"
    case 0x1409: return "ISO-8859-1"; // "English_New_Zealand", "Western Europe & US"
    case 0x1809: return "ISO-8859-1"; // "English_Irish", "Western Europe & US"
    case 0x1c09: return "ISO-8859-1"; // "English_South_Africa", "Western Europe & US"
    case 0x2009: return "ISO-8859-1"; // "English_Jamaica", "Western Europe & US"
    case 0x2409: return "ISO-8859-1"; // "English_Caribbean", "Western Europe & US"
    case 0x2809: return "ISO-8859-1"; // "English_Belize", "Western Europe & US"
    case 0x2c09: return "ISO-8859-1"; // "English_Trinidad", "Western Europe & US"
    case 0x3009: return "ISO-8859-1"; // "English_Zimbabwe", "Western Europe & US"
    case 0x3409: return "ISO-8859-1"; // "English_Philippines", "Western Europe & US"
    case 0x0425: return "ISO-8859-13"; //"Estonian", "Baltic"
    case 0x0438: return "ISO-8859-1"; // "Faeroese", "Western Europe & US"
    case 0x0429: return "ISO-8859-6"; // "Farsi", "Arabic"
    case 0x040b: return "ISO-8859-1"; // "Finnish", "Western Europe & US"
    case 0x040c: return "ISO-8859-1"; // "French_Standard", "Western Europe & US"
    case 0x080c: return "ISO-8859-1"; // "French_Belgian", "Western Europe & US"
    case 0x0c0c: return "ISO-8859-1"; // "French_Canadian", "Western Europe & US"
    case 0x100c: return "ISO-8859-1"; // "French_Swiss", "Western Europe & US"
    case 0x140c: return "ISO-8859-1"; // "French_Luxembourg", "Western Europe & US"
    case 0x180c: return "ISO-8859-1"; // "French_Monaco", "Western Europe & US"
    case 0x0437: return null; //        "Georgian", "Georgian"
    case 0x0407: return "ISO-8859-1"; // "German_Standard", "Western Europe & US"
    case 0x0807: return "ISO-8859-1"; // "German_Swiss", "Western Europe & US"
    case 0x0c07: return "ISO-8859-1"; // "German_Austrian", "Western Europe & US"
    case 0x1007: return "ISO-8859-1"; // "German_Luxembourg", "Western Europe & US"
    case 0x1407: return "ISO-8859-1"; // "German_Liechtenstein", "Western Europe & US"
    case 0x0408: return "ISO-8859-7"; // "Greek", "Greek"
    case 0x040d: return "ISO-8859-8"; // "Hebrew", "Hebrew"
    case 0x0439: return null; //        "Hindi", "Indic"
    case 0x040e: return "ISO-8859-2"; // "Hungarian", "Central Europe"
    case 0x040f: return "ISO-8859-1"; // "Icelandic", "Western Europe & US"
    case 0x0421: return "ISO-8859-1"; // "Indonesian", "Western Europe & US"
    case 0x0410: return "ISO-8859-1"; // "Italian_Standard", "Western Europe & US"
    case 0x0810: return "ISO-8859-1"; // "Italian_Swiss", "Western Europe & US"
    case 0x0411: return "cp932"; //     "Japanese", "Japanese"
    case 0x043f: return "cp1251"; //    "Kazakh", "Cyrillic"
    case 0x0457: return null; //        "Konkani", "Indic"
    case 0x0412: return "cp949"; //     "Korean", "Korean"
    case 0x0426: return "ISO-8859-13"; //"Latvian", "Baltic"
    case 0x0427: return "ISO-8859-13"; //"Lithuanian", "Baltic"
    case 0x042f: return "cp1251"; //    "Macedonian", "Cyrillic"
    case 0x043e: return "ISO-8859-1"; // "Malay_Malaysia", "Western Europe & US"
    case 0x083e: return "ISO-8859-1"; // "Malay_Brunei_Darussalam", "Western Europe & US"
    case 0x044e: return null; //        "Marathi", "Indic"
    case 0x0414: return "ISO-8859-1"; // "Norwegian_Bokmal", "Western Europe & US"
    case 0x0814: return "ISO-8859-1"; // "Norwegian_Nynorsk", "Western Europe & US"
    case 0x0415: return "ISO-8859-2"; // "Polish", "Central Europe"
    case 0x0416: return "ISO-8859-1"; // "Portuguese_Brazilian", "Western Europe & US"
    case 0x0816: return "ISO-8859-1"; // "Portuguese_Standard", "Western Europe & US"
    case 0x0418: return "ISO-8859-2"; // "Romanian", "Central Europe"
    case 0x0419: return "cp1251"; //    "Russian", "Cyrillic"
    case 0x044f: return null; //        "Sanskrit", "Indic"
    case 0x081a: return "ISO-8859-2"; // "Serbian_Latin", "Central Europe"
    case 0x0c1a: return "cp1251"; //    "Serbian_Cyrillic", "Cyrillic"
    case 0x041b: return "ISO-8859-2"; // "Slovak", "Central Europe"
    case 0x0424: return "ISO-8859-2"; // "Slovenian", "Central Europe"
    case 0x040a: return "ISO-8859-1"; // "Spanish_Trad_Sort", "Western Europe & US"
    case 0x080a: return "ISO-8859-1"; // "Spanish_Mexican", "Western Europe & US"
    case 0x0c0a: return "ISO-8859-1"; // "Spanish_Modern_Sort", "Western Europe & US"
    case 0x100a: return "ISO-8859-1"; // "Spanish_Guatemala", "Western Europe & US"
    case 0x140a: return "ISO-8859-1"; // "Spanish_Costa_Rica", "Western Europe & US"
    case 0x180a: return "ISO-8859-1"; // "Spanish_Panama", "Western Europe & US"
    case 0x1c0a: return "ISO-8859-1"; // "Spanish_Dominican_Repub", "Western Europe & US"
    case 0x200a: return "ISO-8859-1"; // "Spanish_Venezuela", "Western Europe & US"
    case 0x240a: return "ISO-8859-1"; // "Spanish_Colombia", "Western Europe & US"
    case 0x280a: return "ISO-8859-1"; // "Spanish_Peru", "Western Europe & US"
    case 0x2c0a: return "ISO-8859-1"; // "Spanish_Argentina", "Western Europe & US"
    case 0x300a: return "ISO-8859-1"; // "Spanish_Ecuador", "Western Europe & US"
    case 0x340a: return "ISO-8859-1"; // "Spanish_Chile", "Western Europe & US"
    case 0x380a: return "ISO-8859-1"; // "Spanish_Uruguay", "Western Europe & US"
    case 0x3c0a: return "ISO-8859-1"; // "Spanish_Paraguay", "Western Europe & US"
    case 0x400a: return "ISO-8859-1"; // "Spanish_Bolivia", "Western Europe & US"
    case 0x440a: return "ISO-8859-1"; // "Spanish_El_Salvador", "Western Europe & US"
    case 0x480a: return "ISO-8859-1"; // "Spanish_Honduras", "Western Europe & US"
    case 0x4c0a: return "ISO-8859-1"; // "Spanish_Nicaragua", "Western Europe & US"
    case 0x500a: return "ISO-8859-1"; // "Spanish_Puerto_Rico", "Western Europe & US"
    case 0x0441: return "ISO-8859-1"; // "Swahili", "Western Europe & US"
    case 0x041d: return "ISO-8859-1"; // "Swedish", "Western Europe & US"
    case 0x081d: return "ISO-8859-1"; // "Swedish_Finland", "Western Europe & US"
    case 0x0449: return null; //        "Tamil", "Indic"
    case 0x0444: return "cp1251"; //    "Tatar", "Cyrillic"
    case 0x041e: return "ISO-8859-11"; //"Thai", "Thai"
    case 0x041f: return "ISO-8859-9"; // "Turkish", "Turkish"
    case 0x0422: return "cp1251"; //    "Ukrainian", "Cyrillic"
    case 0x0420: return "ISO-8859-6"; // "Urdu", "Arabic"
    case 0x0443: return "ISO-8859-9"; // "Uzbek_Latin", "Turkish"
    case 0x0843: return "cp1251"; //    "Uzbek_Cyrillic", "Cyrillic"
    case 0x042a: return null; //        "Vietnamese", "Vietnamese"
    }
    return 'UTF-8';
}

var utf8Converter = Cc["@mozilla.org/intl/utf8converterservice;1"].getService(Ci.nsIUTF8ConverterService);

function nativeToUtf8(nativeString, lcid) {
    var charset = getCharsetFromLcid(lcid);
    if (! charset) {
        return nativeString;
    }
    return utf8Converter.convertStringToUTF8(nativeString, charset, 0);
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
            ctypes.voidptr_t]).ptr;

    this.search_enumerator = ctypes.FunctionType(
        ctypes.default_abi,
        ctypes.int, [
            this.chmFilePtr,
            ctypes.char.ptr,
            ctypes.char.ptr]).ptr;

    var openCharType = ctypes.char.ptr;
    if ('WINNT' == xulRuntime.OS) {
        openCharType = ctypes.jschar.ptr;
    }

    this.open = this._library.declare(
        'chmfox_open', ctypes.default_abi,
        this.chmFilePtr,
        openCharType);

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
        this.chmFilePtr, ctypes.int, this.enumerator, ctypes.voidptr_t);

    this.enumerate_dir = this._library.declare(
        'chmfox_enumerate_dir', ctypes.default_abi,
        ctypes.int,
        this.chmFilePtr, ctypes.char.ptr, ctypes.int, this.enumerator, ctypes.voidptr_t);

    this.search = this._library.declare(
        'chmfox_search', ctypes.default_abi,
        ctypes.int,
        this.chmFilePtr, ctypes.char.ptr, ctypes.int, ctypes.int, this.search_enumerator);

    // extensions
    this.find_ext = function(handle, ext, where) {
        if (! where) {
            where = '/';
        }

        var result = null;
        let compare = function(handle, ui, context) {
            var path = ui.contents.path.readString();
            if (path.substr(path.length - ext.length) == ext) {
                result = path;
                return this.CHM_ENUMERATOR_SUCCESS;
            }
            return this.CHM_ENUMERATOR_CONTINUE;
        };

        let callback = this.enumerator(compare);
        var n = ctypes.voidptr_t();
        this.enumerate_dir(handle, where, this.CHM_ENUMERATE_NORMAL,
                          callback, null);
        return result;
    };

    this.search_all = function(handle, keywords, whole_words, titles_only) {
        var result = [];
        let store = function(handle, topic, url) {
            result.push([topic.readString(), url.readString()]);
            return this.CHM_ENUMERATOR_CONTINUE;
        };

        let callback = this.search_enumerator(store);
        this.search(handle, keywords, whole_words, titles_only, callback);
        return result;
    };

    return this;
};

var lib = new Lib();

function getString(array, index) {
    var out = '';
    while (true) {
        var i = array[index++];
        if (i == 0) {
            break;
        }
        out += String.fromCharCode(i);
    }
    return out;
    // return ctypes.cast(array.addressOfElement(index), ctypes.char.ptr).readString();
}

function getBuffer(array, index, len) {
    var out = '';
    var end = index + len;
    for (var i = index; i < end; ++ i) {
        out += String.fromCharCode(array[i]);
    }
    return out;
}

function getUInt32(array, index) {
    return ctypes.cast(array.addressOfElement(index), ctypes.uint32_t.ptr).contents;
}

function getUInt64(array, index) {
    return ctypes.cast(array.addressOfElement(index), ctypes.uint64_t.ptr).contents;
}

function prependSlash(str) {
    if (str && str[0] != '/') {
        return '/' + str;
    }
    return str;
}


function HtmlizeObject(str) {
    var r = str.replace(/<OBJECT/ig, '<div')
        .replace(/<\/OBJECT/ig, '</div')
        .replace(/<PARAM/ig, '<span')
        .replace(/<\/PARAM/ig, '</span');
    return r;
    // var i = r.indexOf('<UL>');
    // var j = r.lastIndexOf('</BODY>');
    // log(i + ' ' + j);
    // r = r.substring(i, j-1);
    // return r;
}

var ChmFile = function(path, uri) {
    this.path = path;
    this.uri = uri;
    log('open chm file:'+ this.path);
    this.handle = lib.open(this.path);

    this.close = function() {
        lib.close(this.handle);
        log('closed chm file:' + this.path);
    };

    this.isValid = function() {
        return !this.handle.isNull();
    };

    if (! this.isValid()) {
        log('open chm file failed: ' + this.path);
        return this;
    }

    this.getSystemInfo = function () {
        var ui = lib.chmUnitInfo();
        if (lib.CHM_RESOLVE_FAILURE == lib.resolve_object(this.handle, '/#SYSTEM', ui.address())) {
            return ;
        }

        var buffer = ctypes.unsigned_char.array(ui.length)();
        var length = lib.retrieve_object(
            this.handle, ui.address(),
            buffer.addressOfElement(0),
            4, buffer.length);
        if (length == 0) {
            return;
        }

        this.index = '';
        this.topics = '';
        this.home = '';
        this.lcid = null;
        this.title = '';

        var index = 0;
        while (index < length) {
            var type = buffer[index] + (buffer[index+1] * 256);
            index += 2;
            var len = buffer[index] + (buffer[index+1] * 256);
            index += 2;
            switch(type) {
                case 0:
                    this.topics = prependSlash(getString(buffer, index, len));
                    break;
                case 1:
                    this.index = prependSlash(getString(buffer, index, len));
                    break;
                case 2:
                    this.home = prependSlash(getString(buffer, index, len));
                    break;
                case 3:
                    this.title = prependSlash(getString(buffer, index, len));
                    break;
                case 4:
                    this.lcid = getUInt32(buffer, index);
                    this.use_dbcs = getUInt32(buffer, index+0x4);
                    this.searchable = getUInt32(buffer, index+0x8);
                    this.has_klinks = getUInt32(buffer, index+0xc);
                    this.has_alinks = getUInt32(buffer, index+0x10);
                    this.timestamp = getUInt64(buffer, index+0x14);
                    break;
                case 5: // Always "main"?
                    this.default_window = getString(buffer, index, len);
                case 6: // Project name
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
                    this.encoding = getBuffer(buffer, index, len);
                    break;
            }
            index += len;
        }

        this.topics = nativeToUtf8(this.topics, this.lcid);
        this.index = nativeToUtf8(this.index, this.lcid);
        this.home = nativeToUtf8(this.home, this.lcid);
        this.title = nativeToUtf8(this.title, this.lcid);
        this.project = nativeToUtf8(this.project, this.lcid);
        this.compiled_by = nativeToUtf8(this.compiled_by, this.lcid);

        // Gets information from the #WINDOWS file.
        // Checks the #WINDOWS file to see if it has any info that was
        // not found in #SYSTEM (topics, index or default page.
        if (lib.CHM_RESOLVE_FAILURE == lib.resolve_object(this.handle, '/#WINDOWS', ui.address())) {
            return;
        }

        const WINDOWS_HEADER_LENGTH = 8;
        buffer = ctypes.unsigned_char.array(WINDOWS_HEADER_LENGTH)();
        length = lib.retrieve_object(
            this.handle, ui.address(),
            buffer.addressOfElement(0), 0, buffer.length);
        if (length < buffer.length) {
            return;
        }
        var entries = getUInt32(buffer, 0);
        var entry_size = getUInt32(buffer, 4);
        buffer = ctypes.unsigned_char.array(entries*entry_size)();
        length = lib.retrieve_object(
            this.handle, ui.address(),
            buffer.addressOfElement(0), WINDOWS_HEADER_LENGTH, buffer.length);

        if (length == 0) {
            return;
        }

        if (lib.resolve_object(this.handle, "/#STRINGS", ui.address()) != lib.CHM_RESOLVE_SUCCESS) {
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

            if (size > 0 && off_title && this.title) {
                this.title = getString(factor_buffer, off_title % 4096, ui.length);
            }

			if (factor != Math.floor(off_home / 4096)) {
                factor = Math.floor(off_home / 4096);
                size = lib.retrieve_object(
                    this.handle, ui.address(),
                    factor_buffer.addressOfElement(0),
                    factor*4096, factor_buffer.length);
			}

            if (size > 0 && off_home && !this.home) {
                this.home = prependSlash(getString(factor_buffer, off_home % 4096, ui.length));
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
                this.topics = prependSlash(getString(factor_buffer, off_hhc % 4096, ui.length));
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
                this.index = prependSlash(getString(factor_buffer, off_hhk % 4096, ui.length));
            }

            log("lcid: " + this.lcid);
            log("use dbcs: " + this.use_dbcs);
        };

    };

    this.getSystemInfo();

    this.getTopics = function() {
        if (this.html_topics) {
            return this.html_topics;
        }
        if (! this.isValid()) {
            return;
        }
        var ui = lib.chmUnitInfo();
        if (! this.topics) {
            if (this.project) {
                var try_topics_page = '/' + this.project + '.hhc';
                if (lib.CHM_RESOLVE_SUCCESS == lib.resolve_object(
                        this.handle, try_topics_page, ui.address())) {
                    this.topics = try_topics_page;
                }
            }
            if (! this.topics) {
                this.topics = prependSlash(lib.find_ext(this.handle, '.hhc'));
            }
            if (! this.topics) {
                return;
            }
        }

        if (lib.CHM_RESOLVE_SUCCESS == lib.resolve_object(
            this.handle, this.topics, ui.address())) {
            var buf = ctypes.unsigned_char.array(Math.floor(ui.length+1))();
            var r = lib.retrieve_object(
                this.handle, ui.address(),
                buf.addressOfElement(0), 0, ui.length);
            if (r > 0) {
                this.topics_content = utf8Encode(nativeToUtf8(getString(buf, 0), this.lcid));
                this.html_topics = HtmlizeObject(this.topics_content);
            }
        }
        return this.html_topics;
    };

    this.getIndex = function() {
        if (this.html_index) {
            return this.html_index;
        }
        var ui = lib.chmUnitInfo();
        if (! this.index) {
            if (this.project) {
                var try_index_page = '/' + this.project + '.hhk';
                if (lib.CHM_RESOLVE_SUCCESS == lib.resolve_object(
                        this.handle, try_index_page, ui.address())) {
                    this.topics = try_index_page;
                }
            }
            if (! this.index) {
                this.index = prependSlash(lib.find_ext(this.handle, '.hhk'));
            }
            if (! this.index) {
                return;
            }
        }
        if (lib.CHM_RESOLVE_SUCCESS == lib.resolve_object(
                this.handle, this.index, ui.address())) {
            var buf = ctypes.unsigned_char.array(Math.floor(ui.length+1))();
            var r = lib.retrieve_object(
                this.handle, ui.address(),
                buf.addressOfElement(0), 0, ui.length);
            if (r > 0) {
                this.index_content = utf8Encode(nativeToUtf8(getBuffer(buf, 0, r), this.lcid));
                this.html_index = HtmlizeObject(this.index_content);
            }
        }
        return this.html_index;
    };

    this.getContent = function(page) {
        var ui = lib.chmUnitInfo();
        if (lib.CHM_RESOLVE_SUCCESS != lib.resolve_object(this.handle, page, ui.address())) {
            log('page not found: ' + this.path + ' ' + page);
            return;
        }
        var buffer = ctypes.unsigned_char.array(Math.floor(ui.length+1))();
        var length = lib.retrieve_object(
                this.handle, ui.address(),
                buffer.addressOfElement(0), 0, ui.length);
        if (length > 0) {
            return getBuffer(buffer, 0, length);
        }
        else {
            log('page retrieve failed: ' + this.path + ' ' + page);
        }
        return;
    };

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
    // bc.owner = this;
    return bc;
}

function getChmFileAndModifyUri(uri) {
    var urlParts = decodeURI(uri.spec).split('!');
    var chm_uri = urlParts[0];
    var url = chm_uri.substring(4); //Remove "chm:"
    url = "file:" + url;
    url = unescape(url);
    url = url.replace('\\', '/');
    url = ioService.newURI(url, null, null);
    var chm = Application.storage.get(chm_uri, null);
    if (! chm) {
        var local_file = url.QueryInterface(Ci.nsIFileURL).file.path;
        chm = new ChmFile(local_file, chm_uri);
        if (! chm.isValid()) {
            // @todo should use firefox default handle for file not found
            uri = ioService.newURI("about:blank", null, null);
            return ioService.newChannelFromURI(uri);
        }
        Application.storage.set(chm_uri, chm);
    }

    var pagepath = null;

    if (urlParts.length == 1) {
        urlParts.push(chm.home);
        uri = ioService.newURI(urlParts.join('!'), null, null);
    }
    else if (urlParts[1] == '/' || urlParts[1] == '') {
        urlParts[1] = chm.home;
        uri = ioService.newURI(urlParts.join('!'), null, null);        
    }
    else {
        pagepath = urlParts[1];
    }

    return {
        'file':chm,
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
        Ci.nsIProtocolHandler.URI_DANGEROUS_TO_LOAD |
        Ci.nsIProtocolHandler.URI_IS_LOCAL_FILE | 
        Ci.nsIProtocolHandler.URI_NOAUTH,

  allowPort: function(port, scheme) {
    return false;
  },

  newURI: function(spec, charset, baseURI) {
      // FIXME: why there is 'chm:' uri
      if (spec == 'chm:') {
          return undefined;
      }

      // Remote websites are not allowed to load or link to local files
      if (baseURI) {
          var baseUriProtocol = baseURI.spec.substr(0, baseURI.spec.indexOf(':')).toLowerCase(); 
          if (baseUriProtocol != 'chm' && baseUriProtocol != 'chrome') {
              return undefined;
          }
      }

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
    if (chm.file) {
        if (! chm.page) {
            return redirect(chm.uri.spec, aURI);
        }

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
    }

    // Create the channel
    var mime = "text/html";
    if (chm.page) {
        var pos = chm.page.lastIndexOf(".");
        if (pos > 0) {
            var ext = chm.page.substring(pos + 1);
            switch (ext.toLowerCase()) {
            case "svg":
                mime = "image/svg+xml";
                break;
            case "gif":
                mime = "image/gif";
                break;
            case "jpg":
            case "jpeg":
            case "jpe":
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
            case 'html':
            case 'htm':
                mime = 'text/html';
                break;
            case 'bmp':
                mime = 'image/bitmap';
                break;
            default:
                mime = "application/octet-stream";
            }
        }
    }

    var content = undefined;
    if (chm.file) {
        content = chm.file.getContent(chm.page);
        if (! content) {
            content = chm.file.path + '! ' + chm.path + '  Not Found!';
        }
    }
    else {
        var filePath = decodeURI(aURI.spec).substr(6);
        filePath = filePath.split('!')[0];
        content = "CHM file [" + filePath + "] open failed!";
    }
      
    var is = Cc["@mozilla.org/io/string-input-stream;1"].createInstance(Ci.nsIStringInputStream);
    is.setData(content, content.length);
    var isc = Cc["@mozilla.org/network/input-stream-channel;1"].createInstance(Ci.nsIInputStreamChannel);
    isc.contentStream = is;
    isc.setURI(aURI);

    var bc = isc.QueryInterface(Ci.nsIChannel);
    bc.contentType = mime;
    // The encoding is in the HTML header
    // bc.contentCharset = 'utf-8';
    bc.contentLength = content.length;
    bc.originalURI = aURI;
    // bc.owner = this;

    return bc;
  },

  newRawIndexChannel: function(aURI, chm) {
    var content = chm.getIndex();
    if (! content) {
        content = '';
    }
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
    // bc.owner = this;

    return bc;
  },

  newRawTopicsChannel: function(aURI, chm) {
    var content = chm.getTopics();
    if (! content) {
        content = '';
    }

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
    // bc.owner = this;

    return bc;
  }
};


function chmXURIContentListener() {
    this.loadCookie = null;
    this.parentContentListener = null;
    this.wrappedJSObject = this;
}

chmXURIContentListener.prototype = {
    classDescription: "chmXURIContentListener",
    classID: Components.ID("{1c811fec-ec47-45ea-a395-c70fb1fc8f9d}"),
    contractID: "@zhuoqiang.me/chmXURIContentListener;1",
    _xpcom_categories: [{ category: "app-startup" }],
    QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsISupports,
                                           Components.interfaces.nsIURIContentListener,
                                           Components.interfaces.nsIClassInfo,
                                           Components.interfaces.nsISupportsWeakReference,
                                           Components.interfaces.nsIObserver]),

    canHandleContent: function(aContentType, aIsContentPreferred) {
        // it is chemical/x-chemdraw on Ubuntu
        // if (aContentType == "application/octet-stream") {
        //     return true;
        // }
        return true;
    },

    doContent: function(aContentType, aIsContentPreferred, aRequest, aContentHandler) {

        // it is chemical/x-chemdraw on Ubuntu
        if (true || aContentType == "application/octet-stream") {
            if (aRequest.name.substr(0,5).toLowerCase() == 'file:' && aRequest.name.substr(-4).toLowerCase() == '.chm') {
                var urispec = "chm" + aRequest.name.substr(4);
                urispec = decodeURI(urispec);
                try {
                    var lastPosition = prefs.getCharPref("lastPosition."+urispec);
                    if (lastPosition) {
                        urispec = urispec + '!/' + lastPosition;
                    }
                }
                catch (err) {
                }
                let window = aRequest.loadGroup.notificationCallbacks.
                    getInterface(Components.interfaces.nsIDOMWindow);
                let webnav = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIWebNavigation);
                webnav.loadURI(urispec, 0, null, null, null);
                return true;
            }
        }

        // return false;
        throw Components.results.NS_ERROR_NOT_IMPLEMENTED;    // FIXME
    },

    isPreferred: function(aContentType) {
        if (aContentType == "application/octet-stream") {
            return true;
        }
        return false;
    },

    onStartURIOpen: function(aURI) {
        return false;
    },

    observe: function(subject, topic, data) {
        if (topic == "profile-after-change" || topic == "app-startup") {
            let uriLoader = Components.classes["@mozilla.org/uriloader;1"].
                    getService(Components.interfaces.nsIURILoader);
            uriLoader.registerContentListener(contentListener);
        }
    }
};

var contentListener = new chmXURIContentListener();

var components = [chmXURIContentListener];

return {log:log, components: [Protocol, chmXURIContentListener], prefs:prefs};

})();

};

const NSGetFactory = XPCOMUtils.generateNSGetFactory(Chmfox.components);
