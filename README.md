# ChmFox: Firefox Extension for CHM files #

ChmFox is a Firefox extension which brings the best CHM file reading experience to all platform. 

CHM file could be viewed directly in Firefox using this extension under Windows, Mac and Linux.

## Usage ##

1. Download and install ChmFox [here](http://addons.mozilla.org/firefox/addon/chmfox/)
2. After installation, restart Firefox to make ChmFox work
3. Open CHM files through Menu -> File -> Open
4. You could make firefox the default program for opening CHM file, after doing that, just double click CHM files and enjoy ChmFox
5. There's a sidebar for the CHM file content/index, you could use hotkey Ctrl+Alt+m (or Command+Option+m under Mac) to turn it on/off
6. ChmFox remembers and jumps to the last reading position when re-open CHM file, however, you could bookmark as many CHM pages as you like using Firefox's build-in bookmark function
7. Zoom the page by Ctrl + / Ctrl -, just as normal web page. ChmFox remembers the page zoom level per CHM file

## Build It Yourself ##

ChmFox currently support following platforms

- Windows (x86, x64)
- Mac OS X (x86, x64)
- Linux (x86, x64)

If your platform is not supported, you could always build it yourself

1. [Download source code](https://bitbucket.org/zhuoqiang/chmfox) 
2. You need a C compiler and SCons build system installed on your system
3. Add new platform directive in ./chrome.manifest
4. Run the command "scons xpi", you could find the final xpi file under ./build directory
5. [Drop author an email](mailto:zhuo.qiang@gmail.com>) to help add that platform to the offical build

## License ##

ChmFox is open sourced under MPL 1.1/GPL 2.0/LGPL 2.1


## Help make it better ##

If you like ChmFox and want to help make it better, you could

- [Report bugs](https://bitbucket.org/zhuoqiang/chmfox/issues)
- [Contribute to source code](https://bitbucket.org/zhuoqiang/chmfox)
- [Make a donation](https://addons.mozilla.org/firefox/addon/chmfox)
