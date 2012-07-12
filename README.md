# ChmFox: Firefox Extension for Viewing CHM files #

ChmFox is a Firefox extension which brings the best CHM file reading experience to all platforms. CHM file could be viewed directly in Firefox using this extension under Windows, Mac and Linux.

## Usage ##

1. Download and install ChmFox [here](http://addons.mozilla.org/firefox/addon/chmfox/)
2. After installation, restart Firefox to make ChmFox work
3. Open CHM files through Menu -> File -> Open
4. You could make firefox the default program for opening CHM file, after doing that, just double click CHM files and enjoy ChmFox
5. There's a sidebar for the CHM file content/index, you could use hotkey Ctrl+Alt+m (or Command+Option+m under Mac) to turn it on/off
6. ChmFox remembers and jumps to the last reading position when re-open CHM file and you could always bookmark as many CHM pages as you like using Firefox's build-in bookmark function
7. Zoom the page by Ctrl + / Ctrl -, just as normal web page. ChmFox remembers the page zoom level per CHM file

## Build It Yourself ##

ChmFox currently support following platforms

- Windows (x86, x64)
- Mac OS X (x86, x64)
- Linux (x86, x64)

If your platform is not supported, you could always build it yourself

1. [Download source code](https://bitbucket.org/zhuoqiang/chmfox) 
2. A C compiler and SCons build system are required on your system to build the source code
3. Add new platform directive in file ./chrome.manifest
4. Run the command "scons xpi" under the source tree, if everything is OK, you could find the final xpi file under ./build directory
5. [Drop author an email](mailto:zhuo.qiang@gmail.com>) to help add that platform to the offical build so that others could benifit as well

## License ##

ChmFox is open sourced under MPL 1.1/GPL 2.0/LGPL 2.1


## Help make it better ##

If you like ChmFox and want to help make it better, you could

- [Make a donation](https://addons.mozilla.org/firefox/addon/chmfox)
- [Comment to encourage](https://addons.mozilla.org/firefox/addon/chmfox/reviews/add)
- [Report bugs](https://bitbucket.org/zhuoqiang/chmfox/issues)
- [Contribute to source code](https://bitbucket.org/zhuoqiang/chmfox)


# ChmFox: 查看 CHM 文件的火狐扩展 #

ChmFox 是一款火狐浏览器扩展。它给所有平台带来最好的 CHM 文件阅读体验。使用这款扩展，你就可以在 Window, Mac，以及 Linux 上直接使用火狐浏览器阅读 CHM 文件

## 使用说明 ##

1. 先在[这里](http://addons.mozilla.org/firefox/addon/chmfox/)下载安装
2. 安装完成后，重启火狐浏览器让扩展生效
3. 通过菜单 -> 文件 -> 打开文件 直接打开 CHM 文件
4. 更方便的用法是：将 CHM 文件的系统默认打开程序设为 Firefox，之后双击 CHM 文件系统就自动以 Firefox 打开
5. 有一个专门显示当前 CHM 文件目录和索引的侧栏。可以使用热键 Ctrl+Alt+m (Mac 下为 Command+Option+m) 快速开关
6. 智能记忆上次阅读位置，下次打开文件时自动跳转，让您接着读。您也可以使用火狐本身的书签功能为 CHM 文件任意添加书签
7. 和普通网页一样，可以使用快捷键 Ctrl + / Ctrl - 缩放页面. ChmFox 能记住每个 CHM 文件的缩放等级

## 自己编译 ##

当前 ChmFox 支持以下平台：

- Windows (x86, x64)
- Mac OS X (x86, x64)
- Linux (x86, x64)

如果你的平台不在其中，你完全可以自己编译 ChmFox

1. [下载源代码](https://bitbucket.org/zhuoqiang/chmfox) 
2. 系统需要安装 C 编译器和 SCons 构建工具
3. 在 ./chrome.manifest 文件中加入新平台的指示语句
4. 执行命令 "scons xpi", 如果一切正常你会在 ./build 目录下找到最终的 XPI 文件
5. [别忘了给作者写封信](mailto:zhuo.qiang@gmail.com>)，把该平台的支持加入官方安装包中帮助更多的人


## 版权 ##

ChmFox 是开源项目，使用 MPL 1.1/GPL 2.0/LGPL 2.1 版权


## 求支持 ##

如果你喜欢 ChmFox，想帮助它更好的发展，你可以

- [捐点小钱](https://addons.mozilla.org/firefox/addon/chmfox)
- [留言鼓励](https://addons.mozilla.org/firefox/addon/chmfox/reviews/add)
- [报告问题](https://bitbucket.org/zhuoqiang/chmfox/issues)
- [贡献代码](https://bitbucket.org/zhuoqiang/chmfox)
