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


#ifndef COMPONENTS_MOZCHMFILE_H
#define COMPONENTS_MOZCHMFILE_H

#include "mozilla-config.h"
#include "ICHMFile.h"
#include "chm_lib.h"
#include <nsEmbedString.h>

#define MOZ_CHMFILE_CONTRACTID "@zhuoqiang.me/chmfox/CHMFile;1"
#define MOZ_CHMFILE_CLASSNAME "A XPCOM component used to open chm files"
#define MOZ_CHMFILE_CID \
  {0x9990b02d, 0xbd1a, 0x4a13, \
    { 0x84, 0x7b, 0x1e, 0x81, 0x74, 0x83, 0x0c, 0x72 }}

class mozCHMFile : public ICHMFile
{
public:
    NS_DECL_ISUPPORTS
    NS_DECL_ICHMFILE

    mozCHMFile();
    virtual ~mozCHMFile();

protected:
    nsresult GetArchiveInfo();
    nsresult GetSystemInfo();
    nsresult FindTopics();
    nsresult FindIndex();
    nsresult GetWindowInfo();
    nsresult NativeToUTF8(nsACString & from, nsACString &to);
    const char * GetCharsetFromLCID(PRUint16 lcid);

    struct chmFile* m_chmfile;
    char* m_filename;
    nsEmbedCString m_topics;
    nsEmbedCString m_index;
    nsEmbedCString m_title;
    nsEmbedCString m_home;
    nsEmbedCString m_compiled_file;
    PRUint32 m_lcid;
    PRUint32 m_use_dbcs;
    PRUint32 m_searchable;
    PRUint32 m_has_klinks;
    PRUint32 m_has_alinks;
    PRUint64 m_timestamp;
    nsEmbedCString m_default_window;
    nsEmbedCString m_compiled_by;
    PRUint32 m_has_binary_toc;
    PRUint32 m_has_binary_index;

    nsEmbedCString m_encoding;

    bool m_got_archive_info;
    bool m_found_topics;
    bool m_found_index;
};

// Helper functions
int compare_ext(struct chmFile *, struct chmUnitInfo *, void *);
struct compare_ext_data {
    const char *extname;
    char *result;
};

#endif
