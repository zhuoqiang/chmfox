all: xpcom 

xpcom:
	scons

package:
	scons xpi

clean:
	scons -c xpi
.PHANY: package clean xpcom 
