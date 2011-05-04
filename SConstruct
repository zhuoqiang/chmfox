import os, zipfile
from platform import system, machine
from xml.dom import minidom

version = '0.3'
mode = ARGUMENTS.get('MODE', '')

default_noxpidl = '0'
# There is no prebuild xulrunner sdk 1.9.x for systems other than Linux,
# Windows and MacOS, so we disable xpidl generation by default
if not system() in ('Linux', 'Windows', 'Darwin'):
    default_noxpidl = '1'
noxpidl = ARGUMENTS.get('NOXPIDL', default_noxpidl)

opts = Variables('custom.py')
opts.Add('MODE', """Set to ALL, build separate xpi for every platform.
      Set to ALLINONE, build one big xpi support all platform.""", None)
env = Environment(options = opts)
Help(opts.GenerateHelpText(env))
    
def get_platform_name(abi):
    if abi[0] == 'linux':
        platform_name = 'Linux_%s-%s' % (abi[1], abi[2])
    elif abi[0] == 'windows':
        platform_name = 'WINNT_%s-%s' % (abi[1], abi[2])
    elif abi[0] == 'darwin':
        platform_name = 'Darwin_%s-%s' % (abi[1], abi[2])
    elif abi[0] == 'freebsd':
        platform_name = 'FreeBSD_%s-%s' % (abi[1], abi[2])
    return platform_name

def get_package_name(abi):
    return 'chmfox-%s_%s-%s' % abi

def get_default_abi():
    ss = { 'Linux' : 'linux', 'Windows' : 'windows' , 'Darwin' : 'darwin' ,
           'FreeBSD' : 'freebsd' }
    s = ss[system()]
    ms = { 'i686' : 'x86', 'i586' : 'x86', 'i486' : 'x86', 'i386' : 'x86',
           'x86' : 'x86', 'x86_64' : 'x86_64', 'mips64' : 'mipsel' }
    m = ms[machine()]
    cs = { 'Linux' : 'gcc3', 'Windows' : 'msvc' , 'Darwin' : 'gcc3' ,
           'FreeBSD' : 'gcc3' }
    c = cs[system()]
    return (s, m, c)

def get_abis():
    global mode
    if mode == 'ALL' or mode == 'ALLINONE':
        abis = (('linux', 'x86', 'gcc3'), ('linux', 'x86_64', 'gcc3'),
                ('windows', 'x86', 'msvc'),
                ('darwin', 'x86', 'gcc3'),
                ('freebsd', 'x86', 'gcc3'))
    else:
        abis = (get_default_abi(),)
    return abis

def xpi_function(target, source, env):

    def visit(arg, dirname, names):
        for name in names:
            path = os.path.join(dirname, name)
            if os.path.isfile(path):
                arg.write(path)

    def install_rdf(platform, version):
        global mode

        doc = minidom.parse('install-template.rdf')
        version_node = doc.getElementsByTagName('em:version').item(0)
        version_node.appendChild(doc.createTextNode(version))
        
        if mode != 'NOABI':
            if isinstance(platform, list):
                desc = doc.getElementsByTagName('Description').item(0)
                target_node = doc.getElementsByTagName('em:targetPlatform').item(0)
                for p in platform:
                    newnode = doc.createElement('em:targetPlatform')
                    newnode.appendChild(doc.createTextNode(p))
                    desc.insertBefore(newnode, target_node)
                desc.removeChild(target_node)
            else:
                target_node = doc.getElementsByTagName('em:targetPlatform').item(0)
                target_node.appendChild(doc.createTextNode(platform))

        rdf = 'install.rdf'
        rdff = file(rdf, 'w')
        doc.writexml(rdff)
        rdff.close()
        return File(rdf)

    source.append(install_rdf(env['PLATFORM'], env['VERSION']))
        
    compression = env.get('ZIPCOMPRESSION', 0)
    zf = zipfile.ZipFile(str(target[0]), 'w', compression)
    for s in source:
        if s.isdir():
            os.path.walk(str(s), visit, zf)
        else:
            zf.write(str(s))
    zf.close()

    return

xpi = Builder(action = xpi_function)

env = Environment(BUILDERS = { 'Xpi' : xpi })
platform_name = get_platform_name(get_default_abi())
abis = get_abis()
objs = ['chrome.manifest']

for subdir in ['chrome', 'components']:
    objs.extend(SConscript(['%s/SConscript' % subdir],
                           exports = ['env', 'platform_name', 'noxpidl']))


if mode == 'ALLINONE':
    platform_name = []
    for abi in abis:
        platform_name.append(get_platform_name(abi))
    objs.extend(SConscript('platform/SConscript', exports = 'platform_name'))
    target = 'chmfox-%s.xpi' % version
    env.Xpi(target, objs, PLATFORM = platform_name, VERSION = version)
    Alias('xpi', target)
elif mode == 'ALL':
    for abi in abis:
        source = []

        source.extend(objs)
        platform_name = get_platform_name(abi)
        source.extend(SConscript('platform/SConscript', exports = 'platform_name'))

        package_name = get_package_name(abi)
        target = '%s-%s.xpi' % (package_name, version)
        env.Xpi(target, source, PLATFORM = platform_name, VERSION = version)
        Alias('xpi', target)
elif mode == 'NOABI':
    dll = SConscript('platform/SConscript', exports = 'platform_name')
    objs.append(env.Install('components', dll))
    package_name = get_package_name(get_default_abi())
    target = '%s-%s.xpi' % (package_name, version)
    env.Xpi(target, objs, PLATFORM = platform_name, VERSION = version)
    Alias('xpi', target)
else:
    objs.extend(SConscript('platform/SConscript', exports = 'platform_name'))
    package_name = get_package_name(get_default_abi())
    target = '%s-%s.xpi' % (package_name, version)
    env.Xpi(target, objs, PLATFORM = platform_name, VERSION = version)
    Alias('xpi', target)

Clean('xpi', 'install.rdf')
