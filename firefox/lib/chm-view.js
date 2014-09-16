/**
   @author ZHUO Qiang
   
   This component provides a stream converter that can translate CHM to HTML.
*/

const { Class } = require("sdk/core/heritage");
const { Unknown } = require("sdk/platform/xpcom");
const { Cc, Ci } = require("chrome");

// const { ChmFormatter } = require("./chm-formatter");

// converter implementation, and is set up to be XPCOM-ified by XPCOMUtils
const ChmView = Class({
  extends: Unknown,
  interfaces: [
    "nsIStreamConverter",
    "nsIStreamListener",
    "nsIRequestObserver"
  ],
  
  get wrappedJSObject() this,
  
  // constructor
  initialize: function() {
    // this.chmFormatter = new ChmFormatter();
  },
  
  /**
     This component works as following:
     
     1. asyncConvertData captures the listener
     2. onStartRequest fires, initializes stuff, modifies the listener to match our output type
     3. onDataAvailable transcodes the data into a UTF-8 string
     4. onStopRequest gets the collected data and converts it, spits it to the listener
     5. convert does nothing, it's just the synchronous version of asyncConvertData
  */
  
  // nsIStreamConverter::convert
  convert: function(aFromStream, aFromType, aToType, aCtxt) {
    return aFromStream;
  },
  
  // nsIStreamConverter::asyncConvertData
  asyncConvertData: function(aFromType, aToType, aListener, aCtxt) {
    // Store the listener passed to us
    this.listener = aListener;
  },
  
  // nsIStreamListener::onDataAvailable
  onDataAvailable: function(aRequest, aContext, aInputStream, aOffset, aCount) {
    // From https://developer.mozilla.org/en/Reading_textual_data
    var is = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
    is.init(aInputStream, this.charset, -1, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
    // This used to read in a loop until readString returned 0, but it caused it to crash Firefox on OSX/Win32 (but not Win64)
    // It seems just reading once with -1 (default buffer size) gets the file done.
    // However, *not* reading in a loop seems to cause problems with Firebug
    // So I read in a loop, but do whatever I can to avoid infinite-looping.
    var totalBytesRead = 0;
    var bytesRead = 1; // Seed it with something positive
    while (totalBytesRead < aCount && bytesRead > 0) {
      var str = {};
      bytesRead = is.readString(-1, str);
      totalBytesRead += bytesRead;
      this.data += str.value;
    }
  },
  
  // nsIRequestObserver::onStartRequest
  onStartRequest: function(aRequest, aContext) {
    this.data = '';
    this.uri = aRequest.QueryInterface(Ci.nsIChannel).URI.spec;
    // Sets the charset if it is available. (For documents loaded from the
    // filesystem, this is not set.)
    this.charset = aRequest.QueryInterface(Ci.nsIChannel).contentCharset || 'UTF-8';
    this.channel = aRequest;
    this.channel.contentType = "text/html";
    // All our data will be coerced to UTF-8
    this.channel.contentCharset = "UTF-8";
    this.listener.onStartRequest(this.channel, aContext);
  },
  
  // nsIRequestObserver::onStopRequest
  onStopRequest: function(aRequest, aContext, aStatusCode) {
    /**
       This should go something like this:
       
       1. Make sure we have a unicode string.
       4. Spit it back out at the listener
    */
    var outputDoc = '';
    
    try {
      outputDoc = '<html><body><h1>Hello ChmFox ' + this.data + '</h1></body></html>'
    } catch (e) {
      outputDoc = 'error!'
    }
    
    // I don't really understand this part, but basically it's a way to get our UTF-8 stuff
    // spit back out as a byte stream
    // See http://www.mail-archive.com/mozilla-xpcom@mozilla.org/msg04194.html
    const storage = Cc["@mozilla.org/storagestream;1"].createInstance(Ci.nsIStorageStream);
    
    // I have no idea what to pick for the first parameter (segments)
    storage.init(4, 0xffffffff, null);
    var out = storage.getOutputStream(0);
    const binout = Cc["@mozilla.org/binaryoutputstream;1"]
      .createInstance(Ci.nsIBinaryOutputStream);
    binout.setOutputStream(out);
    binout.writeUtf8Z(outputDoc);
    binout.close();
    
    // I can't explain it, but we need to trim 4 bytes off the front or else it includes random crap
    const TRUNC = 4;
    var instream = storage.newInputStream(TRUNC);
    
    // Pass the data to the main content listener
    this.listener.onDataAvailable(this.channel, aContext, instream, 0, storage.length - TRUNC);
    this.listener.onStopRequest(this.channel, aContext, aStatusCode);
  }
});

exports.ChmView = ChmView;
