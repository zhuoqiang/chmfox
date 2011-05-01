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


#include "mozCHMFile.h"
#include "mozCHMUnitInfo.h"
#include "mozCHMInputStream.h"

#include <memory>

#include "nsXPCOM.h"
#include "nsIComponentManager.h"
#include "nsComponentManagerUtils.h"
#include "nsStringAPI.h"
#include "nsMemory.h"
#include "nsCOMPtr.h"
#include "nsError.h"
#include "nsIUTF8ConverterService.h"
#include "nsIServiceManager.h"
#include "nsDebug.h"

#define FIXENDIAN32(args) // do nothing now
#define BUF_SIZE 4096
#define CURRENT_CHAR_STRING(s) reinterpret_cast<const char *>(s)

static NS_DEFINE_CID(kUTF8ConverterServiceIID, NS_IUTF8CONVERTERSERVICE_IID);

const char * index_ext = ".hhk";
const char * topics_ext = ".hhc";

NS_IMPL_ISUPPORTS1(mozCHMFile, ICHMFile)

mozCHMFile::mozCHMFile() :
    m_chmfile(NULL),
    m_filename(NULL),
    m_lcid(0),
    m_got_archive_info(false),
    m_found_topics(false),
    m_found_index(false)
{
    /* member initializers and constructor code */
}

mozCHMFile::~mozCHMFile()
{
    CloseCHM();
}

/* long LoadCHM (in nsIFile chmfile); */
NS_IMETHODIMP mozCHMFile::LoadCHM(nsIFile *chmfile, PRInt32 *_retval)
{
    if (!chmfile) {
        *_retval = -1;
        return NS_ERROR_NULL_POINTER;
    }

    // Get file native path form nsIFile interface
    nsEmbedCString path;
    chmfile->GetNativePath(path);

    // Get filename
    m_filename = NS_CStringCloneData(path);

    m_chmfile = chm_open(m_filename);
    if (!m_chmfile) {
        *_retval = -2;
        return NS_OK;
    }

    return NS_OK;
}

/* void CloseCHM (); */
NS_IMETHODIMP mozCHMFile::CloseCHM()
{
    if (m_chmfile) {
        chm_close(m_chmfile);
        m_chmfile = NULL;
    }
    if (m_filename) {
        nsMemory::Free(m_filename);
        m_filename = NULL;
    }
    m_home.Assign("/");
    m_topics = "";
    m_index = "";
    m_title = "";
    m_lcid = 0;
    m_got_archive_info = false;
    m_found_topics = false;
    m_found_index = false;

    return NS_OK;
}

/* readonly attribute ACString topics; */
NS_IMETHODIMP mozCHMFile::GetTopics(nsACString & aTopics)
{
    if (!m_chmfile) return NS_ERROR_NULL_POINTER;

    if (!m_found_topics) FindTopics();

    if (m_topics.Length() == 0)
        return NS_OK;
    
    nsEmbedCString topics_utf8;
    NativeToUTF8(m_topics, topics_utf8);

    int r;
    struct chmUnitInfo ui;
    r = chm_resolve_object(m_chmfile, topics_utf8.BeginReading(), &ui);
    if (r != CHM_RESOLVE_SUCCESS) {
        return NS_OK;
    }
    char* data = (char *) nsMemory::Alloc(ui.length + 1);
    r = chm_retrieve_object(m_chmfile, &ui,
                            (unsigned char *)data, 0l, ui.length);
    nsEmbedCString native;
    native.Assign(data, r);
    nsMemory::Free(data);

    nsresult rv;
    rv = NativeToUTF8(native, aTopics);
    NS_ENSURE_SUCCESS(rv, rv);

    return NS_OK;
}

/* readonly attribute ACString index; */
NS_IMETHODIMP mozCHMFile::GetIndex(nsACString & aIndex)
{
    if (!m_chmfile) return NS_ERROR_NULL_POINTER;

    if (!m_found_index) FindIndex();

    if (m_index.Length() == 0)
        return NS_OK;

    nsEmbedCString index_utf8;
    NativeToUTF8(m_index, index_utf8);
    
    int r;
    struct chmUnitInfo ui;
    r = chm_resolve_object(m_chmfile, index_utf8.BeginReading(), &ui);
    if (r != CHM_RESOLVE_SUCCESS) {
        return NS_OK;
    }
    char* data = (char *) nsMemory::Alloc(ui.length + 1);
    r = chm_retrieve_object(m_chmfile, &ui,
                            (unsigned char *)data, 0l, ui.length);
    nsEmbedCString native;
    native.Assign(data, r);
    nsMemory::Free(data);
    
    nsresult rv;
    rv = NativeToUTF8(native, aIndex);
    NS_ENSURE_SUCCESS(rv, rv);

    return NS_OK;
}

/* readonly attribute boolean isSearchable; */
NS_IMETHODIMP mozCHMFile::GetIsSearchable(PRBool *aIsSearchable)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute ACString encoding; */
NS_IMETHODIMP mozCHMFile::GetEncoding(nsACString & aEncoding)
{
    if (!m_chmfile) return NS_ERROR_NULL_POINTER;

    if (!m_got_archive_info) {
        nsresult rv = GetArchiveInfo();
        NS_ENSURE_SUCCESS(rv, rv);
    }

    aEncoding = m_encoding;
    return NS_OK;
}

/* readonly attribute long LCID; */
NS_IMETHODIMP mozCHMFile::GetLCID(PRInt32 *aLCID)
{
    if (!m_chmfile) return NS_ERROR_NULL_POINTER;

    if (!m_got_archive_info) {
        nsresult rv = GetArchiveInfo();
        NS_ENSURE_SUCCESS(rv, rv);
    }

    *aLCID = m_lcid;
    return NS_OK;
}

/* ICHMUnitInfo ResolveObject (in ACString path); */
NS_IMETHODIMP mozCHMFile::ResolveObject(const nsACString & path, ICHMUnitInfo **_retval)
{
    if (!m_chmfile) return NS_ERROR_NULL_POINTER;

    nsresult rv;

    mozCHMUnitInfo* chmui = new mozCHMUnitInfo();
    if (!chmui) return NS_ERROR_OUT_OF_MEMORY;

    NS_ADDREF(chmui);
    rv = chmui->QueryInterface(NS_GET_IID(ICHMUnitInfo), (void**) _retval);
    NS_RELEASE(chmui);
    NS_ENSURE_SUCCESS(rv, rv);

    struct chmUnitInfo *nui;
    (*_retval)->GetNativeChmUnitInfo(&nui);
    int r = chm_resolve_object(m_chmfile, path.BeginReading(), nui);
    if (r != CHM_RESOLVE_SUCCESS) {
        *_retval = nsnull;
        return NS_ERROR_FAILURE;
    }

    return NS_OK;
}

/* ACString RetrieveObject (in ICHMUnitInfo ui, in long start, in long length); */
NS_IMETHODIMP mozCHMFile::RetrieveObject(
    ICHMUnitInfo *iui, PRInt32 start, PRInt32 length,
    nsACString & _retval)
{
    if (!m_chmfile) return NS_ERROR_NULL_POINTER;

    struct chmUnitInfo *ui;
    iui->GetNativeChmUnitInfo(&ui); 

    char* buff = (char*) nsMemory::Alloc(ui->length);
    if (!buff) return NS_ERROR_OUT_OF_MEMORY;

    PRUint32 buff_len = chm_retrieve_object(
        m_chmfile, ui, (unsigned char *)buff, start, length);

    if (buff_len) _retval.Assign(buff, buff_len);
    nsMemory::Free(buff);

    return NS_OK;
}

/* [noscript] long retrieveObjectToBuffer (in ICHMUnitInfo ui, in long start, in long length, in charPtr buf); */
NS_IMETHODIMP mozCHMFile::RetrieveObjectToBuffer(ICHMUnitInfo *iui, PRInt32 start, PRInt32 length, char * buf, PRUint32 *_retval)
{
    if (!m_chmfile) return NS_ERROR_NULL_POINTER;

    struct chmUnitInfo *ui;
    iui->GetNativeChmUnitInfo(&ui); 

    *_retval = chm_retrieve_object(
        m_chmfile, ui, (unsigned char *)buf, start, length);

    return NS_OK;
}

/* nsIInputStream getInputStream (in ICHMUnitInfo ui); */
NS_IMETHODIMP mozCHMFile::GetInputStream(
    ICHMUnitInfo *ui, nsIInputStream **_retval)
{
    if (!m_chmfile) return NS_ERROR_NULL_POINTER;

    nsresult rv;
    mozCHMInputStream* cis = new mozCHMInputStream();
    if (!cis) return NS_ERROR_OUT_OF_MEMORY;

    rv = cis->Init(this, ui);
    NS_ENSURE_SUCCESS(rv, rv);

    NS_ADDREF(cis);
    rv = cis->QueryInterface(NS_GET_IID(nsIInputStream), (void **) _retval);
    NS_RELEASE(cis);

    return rv;
}

/* readonly attribute ACString home; */
NS_IMETHODIMP mozCHMFile::GetHome(nsACString & aHome)
{
    if (!m_chmfile) return NS_ERROR_NULL_POINTER;

    nsresult rv;
    if (!m_got_archive_info) {
        nsresult rv = GetArchiveInfo();
        NS_ENSURE_SUCCESS(rv, rv);
    }

    rv = NativeToUTF8(m_home, aHome);
    NS_ENSURE_SUCCESS(rv, rv);

    return NS_OK;
}

/* readonly attribute ACString title; */
NS_IMETHODIMP mozCHMFile::GetUTitle(nsAString & aTitle)
{
    nsresult rv;
    nsEmbedCString utf8;
    rv = GetTitle(utf8);
    NS_ENSURE_SUCCESS(rv, rv);

    return NS_CStringToUTF16(utf8, NS_CSTRING_ENCODING_UTF8, aTitle);
}

/* readonly attribute ACString title; */
NS_IMETHODIMP mozCHMFile::GetTitle(nsACString & aTitle)
{
    if (!m_chmfile) return NS_ERROR_NULL_POINTER;

    nsresult rv;
    if (!m_got_archive_info) {
        rv = GetArchiveInfo();
        NS_ENSURE_SUCCESS(rv, rv);
    }

    rv = NativeToUTF8(m_title, aTitle);
    NS_ENSURE_SUCCESS(rv, rv);

    return NS_OK;
}

// Protected and Private Methods

nsresult mozCHMFile::GetArchiveInfo()
{
    nsresult rv;

    rv = GetSystemInfo();
    NS_ENSURE_SUCCESS(rv, rv);

    rv = GetWindowInfo();
    NS_ENSURE_SUCCESS(rv, rv);

    m_got_archive_info = true;
    return NS_OK;
}

nsresult mozCHMFile::GetSystemInfo()
{
    struct chmUnitInfo system_ui;
    int r;
    r = chm_resolve_object(m_chmfile, "/#SYSTEM", &system_ui);
    if (r != CHM_RESOLVE_SUCCESS) {
        return NS_ERROR_FAILURE;
    }

	std::auto_ptr<char> realbuff(new char[system_ui.length]);
    char* buff = realbuff.get();
    PRUint32 buff_len = chm_retrieve_object(
        m_chmfile, &system_ui, (unsigned char *)buff, 4l, system_ui.length);
    if (buff_len == 0) {
        return NS_ERROR_FAILURE;
    }
    
    char* pbuff = buff;
    while (pbuff < buff + buff_len) {
        int rectype, reclen;
        
        rectype = *((PRUint16 *)pbuff);
        pbuff += 2;
        reclen =  *((PRUint16 *)pbuff);
        pbuff += 2;

        switch (rectype) {
        case 0: // topics
            m_topics = "/";
            m_topics.Append(pbuff, reclen - 1);
            break;
        case 1: // index
            m_index = "/";
            m_index.Append(pbuff, reclen - 1);
            break;
        case 2: // Default page
            m_home = "/";
            m_home.Append(pbuff, reclen - 1);
            break;
        case 3: // Title
            m_title.Assign(pbuff, reclen - 1);
            break;
        case 4:
            m_lcid = *((PRUint32 *)pbuff);
            m_use_dbcs = *((PRUint32 *)pbuff + 0x4);
            m_searchable = *((PRUint32 *)pbuff + 0x8);
            m_has_klinks = *((PRUint32 *)pbuff + 0xc);
            m_has_alinks = *((PRUint32 *)pbuff + 0x10);
            m_timestamp = *((PRUint64 *)pbuff + 0x14);
            break;
        case 5: // Always "main"?
            m_default_window.Assign(pbuff, reclen - 1);
            break;
        case 6: // Project name?
            m_compiled_file.Assign(pbuff, reclen - 1);
            break;
        case 7:
            m_has_binary_index = *((PRUint32 *)pbuff);
            break;
        case 9: // Encoder
            m_compiled_by.Assign(pbuff, reclen - 1);
            break;
        case 10: // Unknown
        case 11:
            m_has_binary_toc = *((PRUint32 *)pbuff);
            break;
        case 12: // Unknown
        case 13: // Unknown
        case 15: // Unknown
            break;
        case 16:
            m_encoding.Assign(pbuff, reclen - 1);
            break;
        }
        pbuff += reclen;
    }

    return NS_OK;
}

nsresult mozCHMFile::FindTopics()
{
    if (!m_got_archive_info) {
        nsresult rv = GetArchiveInfo();
        NS_ENSURE_SUCCESS(rv, rv);
    }

    if (m_topics.Length() == 0) {
        nsEmbedCString tmp;
        tmp.Assign("/");
        tmp.Append(m_compiled_file);
        tmp.Append(topics_ext);
        struct chmUnitInfo ui;
        int r = chm_resolve_object(m_chmfile, tmp.BeginReading(), &ui);
        if (r == CHM_RESOLVE_SUCCESS) {
            m_topics.Assign(tmp);
        }
    }
    
    if (m_topics.Length() == 0) {
        struct compare_ext_data data;
        data.extname = topics_ext;
        data.result = NULL;
        chm_enumerate_dir(m_chmfile, "/", CHM_ENUMERATE_NORMAL,
                          compare_ext, &data);
        if (data.result) {
            m_topics = data.result;
            nsMemory::Free(data.result);
        }
    }

    m_found_topics = true;

    return NS_OK;
}

nsresult mozCHMFile::FindIndex()
{
    if (!m_got_archive_info) {
        nsresult rv = GetArchiveInfo();
        NS_ENSURE_SUCCESS(rv, rv);
    }

    if (m_index.Length() == 0) {
        nsEmbedCString tmp;
        tmp.Assign("/");
        tmp.Append(m_compiled_file);
        tmp.Append(index_ext);
        struct chmUnitInfo ui;
        int r = chm_resolve_object(m_chmfile, tmp.BeginReading(), &ui);    
        if (r == CHM_RESOLVE_SUCCESS) {
            m_index.Assign(tmp);
        }
    }

    if (m_index.Length() == 0) {
        struct compare_ext_data data;
        data.extname = index_ext;
        data.result = NULL;
        chm_enumerate_dir(m_chmfile, "/", CHM_ENUMERATE_NORMAL,
                          compare_ext, &data);
        if (data.result) {
            m_index = data.result;
            nsMemory::Free(data.result);
        }
    }

    m_found_index = true;

    return 0;
}

int compare_ext(struct chmFile *h, struct chmUnitInfo *ui, void *context)
{
    struct compare_ext_data *data = (struct compare_ext_data *) context;

    // Find the last dot in path
    char *p;
    for (p = ui->path; *p; ++p);
    for (; *p != '.' && p > ui->path; --p);

    if (*p == '.') { // found
        if (strcmp(p, data->extname) == 0) {
            data->result = (char *) nsMemory::Alloc(strlen(ui->path) + 1);
            strcpy(data->result, ui->path);
            return CHM_ENUMERATOR_SUCCESS;
        }
    }

    return CHM_ENUMERATOR_CONTINUE;
}

nsresult mozCHMFile::GetWindowInfo()
{
#define WIN_HEADER_LEN 0x08
	unsigned char buffer[BUF_SIZE];
	unsigned int factor;
	chmUnitInfo ui;
	long size = 0;

	if(::chm_resolve_object(m_chmfile, "/#WINDOWS", &ui) == 
	   CHM_RESOLVE_SUCCESS) {
		if(!::chm_retrieve_object(m_chmfile, &ui, 
		  			  buffer, 0, WIN_HEADER_LEN))
			return false;

		PRUint32 entries = *(PRUint32 *)(buffer);
		FIXENDIAN32(entries);
		PRUint32 entry_size = *(PRUint32 *)(buffer + 0x04);
		FIXENDIAN32(entry_size);
		
		std::auto_ptr<unsigned char> uptr(
            new unsigned char[entries * entry_size]);
		unsigned char* raw = uptr.get();
		
		if(!::chm_retrieve_object(m_chmfile, &ui, raw, 8, 
					  entries * entry_size))
			return NS_OK;

		if(::chm_resolve_object(m_chmfile, "/#STRINGS", &ui) != 
		   CHM_RESOLVE_SUCCESS)
			return NS_OK;

		for(PRUint32 i = 0; i < entries; ++i) {

			PRUint32 offset = i * entry_size;

			PRUint32 off_title = 
				*(PRUint32 *)(raw + offset + 0x14);
			FIXENDIAN32(off_title);

			PRUint32 off_home = 
				*(PRUint32 *)(raw + offset + 0x68);
			FIXENDIAN32(off_home);

			PRUint32 off_hhc = 
				*(PRUint32 *)(raw + offset + 0x60);
			FIXENDIAN32(off_hhc);
			
			PRUint32 off_hhk = 
				*(PRUint32 *)(raw + offset + 0x64);
			FIXENDIAN32(off_hhk);

			factor = off_title / 4096;

			if(size == 0) 
				size = ::chm_retrieve_object(m_chmfile, &ui, 
							     buffer, 
							     factor * 4096, 
							     BUF_SIZE);

			if(size && off_title)
				m_title = CURRENT_CHAR_STRING(buffer + off_title % 4096);
			
			if(factor != off_home / 4096) {
				factor = off_home / 4096;		
				size = ::chm_retrieve_object(m_chmfile, &ui, 
							     buffer, 
							     factor * 4096, 
							     BUF_SIZE);
			}
			
			if(size && off_home)
				m_home = "/";
                m_home.Append(CURRENT_CHAR_STRING(buffer + off_home % 4096));
	       
			if(factor != off_hhc / 4096) {
				factor = off_hhc / 4096;
				size = ::chm_retrieve_object(m_chmfile, &ui, 
							     buffer, 
							     factor * 4096, 
							     BUF_SIZE);
			}
		
			if(size && off_hhc) {
				m_topics= "/";
                m_topics.Append(CURRENT_CHAR_STRING(buffer + off_hhc % 4096));
			}

			if(factor != off_hhk / 4096) {
				factor = off_hhk / 4096;		
				size = ::chm_retrieve_object(m_chmfile, &ui, 
							     buffer, 
							     factor * 4096, 
							     BUF_SIZE);
			}

			if(size && off_hhk)
				m_index = "/";
                m_index.Append(CURRENT_CHAR_STRING(buffer + off_hhk % 4096));
		}
	}

    return NS_OK;
}

nsresult mozCHMFile::NativeToUTF8(nsACString & from, nsACString &to)
{
    const char * charset = GetCharsetFromLCID(m_lcid);
    if (charset == NULL) {
        to = from;
        return NS_OK;
    }

    nsresult rv;
    nsCOMPtr<nsIServiceManager> sm;
    rv = NS_GetServiceManager(getter_AddRefs(sm));
    NS_ENSURE_SUCCESS(rv, rv);

    nsCOMPtr<nsIUTF8ConverterService> ucs;
    rv = sm->GetServiceByContractID("@mozilla.org/intl/utf8converterservice;1",
                                    NS_GET_IID(nsIUTF8ConverterService),
                                    getter_AddRefs(ucs));
    NS_ENSURE_SUCCESS(rv, rv);

    ucs->ConvertStringToUTF8(from, charset, 0, to);
    return NS_OK; 
}

const char * mozCHMFile::GetCharsetFromLCID(PRUint16 lcid) {
#define CASE(lcid, charset, country, language) case lcid: return charset;
    switch (lcid) {
    CASE(0x0436, "ISO-8859-1", "Afrikaans", "Western Europe & US");
    CASE(0x041c, "ISO-8859-2", "Albanian", "Central Europe");
    CASE(0x0401, "ISO-8859-6", "Arabic_Saudi_Arabia", "Arabic");
    CASE(0x0801, "ISO-8859-6", "Arabic_Iraq", "Arabic");
    CASE(0x0c01, "ISO-8859-6", "Arabic_Egypt", "Arabic");
    CASE(0x1001, "ISO-8859-6", "Arabic_Libya", "Arabic");
    CASE(0x1401, "ISO-8859-6", "Arabic_Algeria", "Arabic");
    CASE(0x1801, "ISO-8859-6", "Arabic_Morocco", "Arabic");
    CASE(0x1c01, "ISO-8859-6", "Arabic_Tunisia", "Arabic");
    CASE(0x2001, "ISO-8859-6", "Arabic_Oman", "Arabic");
    CASE(0x2401, "ISO-8859-6", "Arabic_Yemen", "Arabic");
    CASE(0x2801, "ISO-8859-6", "Arabic_Syria", "Arabic");
    CASE(0x2c01, "ISO-8859-6", "Arabic_Jordan", "Arabic");
    CASE(0x3001, "ISO-8859-6", "Arabic_Lebanon", "Arabic");
    CASE(0x3401, "ISO-8859-6", "Arabic_Kuwait", "Arabic");
    CASE(0x3801, "ISO-8859-6", "Arabic_UAE", "Arabic");
    CASE(0x3c01, "ISO-8859-6", "Arabic_Bahrain", "Arabic");
    CASE(0x4001, "ISO-8859-6", "Arabic_Qatar", "Arabic");
    CASE(0x042b, NULL,        "Armenian","Armenian");
    CASE(0x042c, "ISO-8859-9", "Azeri_Latin", "Turkish");
    CASE(0x082c, "cp1251",    "Azeri_Cyrillic", "Cyrillic");
    CASE(0x042d, "ISO-8859-1", "Basque", "Western Europe & US");
    CASE(0x0423, "cp1251",    "Belarusian", "Cyrillic");
    CASE(0x0402, "cp1251",    "Bulgarian", "Cyrillic");
    CASE(0x0403, "ISO-8859-1", "Catalan", "Western Europe & US");
    CASE(0x0404, "BIG5",      "Chinese_Taiwan", "Traditional Chinese");
    CASE(0x0804, "GBK",       "Chinese_PRC", "Simplified Chinese");
    CASE(0x0c04, "BIG5",      "Chinese_Hong_Kong", "Traditional Chinese");
    CASE(0x1004, "GBK",       "Chinese_Singapore", "Simplified Chinese");
    CASE(0x1404, "BIG5",      "Chinese_Macau", "Traditional Chinese");
    CASE(0x041a, "ISO-8859-2", "Croatian", "Central Europe");
    CASE(0x0405, "ISO-8859-2", "Czech", "Central Europe");
    CASE(0x0406, "ISO-8859-1", "Danish", "Western Europe & US");
    CASE(0x0413, "ISO-8859-1", "Dutch_Standard", "Western Europe & US");
    CASE(0x0813, "ISO-8859-1", "Dutch_Belgian", "Western Europe & US");
    CASE(0x0409, "ISO-8859-1", "English_United_States", "Western Europe & US");
    CASE(0x0809, "ISO-8859-1", "English_United_Kingdom", "Western Europe & US");
    CASE(0x0c09, "ISO-8859-1", "English_Australian", "Western Europe & US");
    CASE(0x1009, "ISO-8859-1", "English_Canadian", "Western Europe & US");
    CASE(0x1409, "ISO-8859-1", "English_New_Zealand", "Western Europe & US");
    CASE(0x1809, "ISO-8859-1", "English_Irish", "Western Europe & US");
    CASE(0x1c09, "ISO-8859-1", "English_South_Africa", "Western Europe & US");
    CASE(0x2009, "ISO-8859-1", "English_Jamaica", "Western Europe & US");
    CASE(0x2409, "ISO-8859-1", "English_Caribbean", "Western Europe & US");
    CASE(0x2809, "ISO-8859-1", "English_Belize", "Western Europe & US");
    CASE(0x2c09, "ISO-8859-1", "English_Trinidad", "Western Europe & US");
    CASE(0x3009, "ISO-8859-1", "English_Zimbabwe", "Western Europe & US");
    CASE(0x3409, "ISO-8859-1", "English_Philippines", "Western Europe & US");
    CASE(0x0425, "ISO-8859-13","Estonian", "Baltic");
    CASE(0x0438, "ISO-8859-1", "Faeroese", "Western Europe & US");
    CASE(0x0429, "ISO-8859-6", "Farsi", "Arabic");
    CASE(0x040b, "ISO-8859-1", "Finnish", "Western Europe & US");
    CASE(0x040c, "ISO-8859-1", "French_Standard", "Western Europe & US");
    CASE(0x080c, "ISO-8859-1", "French_Belgian", "Western Europe & US");
    CASE(0x0c0c, "ISO-8859-1", "French_Canadian", "Western Europe & US");
    CASE(0x100c, "ISO-8859-1", "French_Swiss", "Western Europe & US");
    CASE(0x140c, "ISO-8859-1", "French_Luxembourg", "Western Europe & US");
    CASE(0x180c, "ISO-8859-1", "French_Monaco", "Western Europe & US");
    CASE(0x0437, NULL,        "Georgian", "Georgian");
    CASE(0x0407, "ISO-8859-1", "German_Standard", "Western Europe & US");
    CASE(0x0807, "ISO-8859-1", "German_Swiss", "Western Europe & US");
    CASE(0x0c07, "ISO-8859-1", "German_Austrian", "Western Europe & US");
    CASE(0x1007, "ISO-8859-1", "German_Luxembourg", "Western Europe & US");
    CASE(0x1407, "ISO-8859-1", "German_Liechtenstein", "Western Europe & US");
    CASE(0x0408, "ISO-8859-7", "Greek", "Greek");
    CASE(0x040d, "ISO-8859-8", "Hebrew", "Hebrew");
    CASE(0x0439, NULL,        "Hindi", "Indic");
    CASE(0x040e, "ISO-8859-2", "Hungarian", "Central Europe");
    CASE(0x040f, "ISO-8859-1", "Icelandic", "Western Europe & US");
    CASE(0x0421, "ISO-8859-1", "Indonesian", "Western Europe & US");
    CASE(0x0410, "ISO-8859-1", "Italian_Standard", "Western Europe & US");
    CASE(0x0810, "ISO-8859-1", "Italian_Swiss", "Western Europe & US");
    CASE(0x0411, "cp932",     "Japanese", "Japanese");
    CASE(0x043f, "cp1251",    "Kazakh", "Cyrillic");
    CASE(0x0457, NULL,        "Konkani", "Indic");
    CASE(0x0412, "cp949",     "Korean", "Korean");
    CASE(0x0426, "ISO-8859-13","Latvian", "Baltic");
    CASE(0x0427, "ISO-8859-13","Lithuanian", "Baltic");
    CASE(0x042f, "cp1251",    "Macedonian", "Cyrillic");
    CASE(0x043e, "ISO-8859-1", "Malay_Malaysia", "Western Europe & US");
    CASE(0x083e, "ISO-8859-1", "Malay_Brunei_Darussalam", "Western Europe & US");
    CASE(0x044e, NULL,        "Marathi", "Indic");
    CASE(0x0414, "ISO-8859-1", "Norwegian_Bokmal", "Western Europe & US");
    CASE(0x0814, "ISO-8859-1", "Norwegian_Nynorsk", "Western Europe & US");
    CASE(0x0415, "ISO-8859-2", "Polish", "Central Europe");
    CASE(0x0416, "ISO-8859-1", "Portuguese_Brazilian", "Western Europe & US");
    CASE(0x0816, "ISO-8859-1", "Portuguese_Standard", "Western Europe & US");
    CASE(0x0418, "ISO-8859-2", "Romanian", "Central Europe");
    CASE(0x0419, "cp1251",    "Russian", "Cyrillic");
    CASE(0x044f, NULL,        "Sanskrit", "Indic");
    CASE(0x081a, "ISO-8859-2", "Serbian_Latin", "Central Europe");
    CASE(0x0c1a, "cp1251",    "Serbian_Cyrillic", "Cyrillic");
    CASE(0x041b, "ISO-8859-2", "Slovak", "Central Europe");
    CASE(0x0424, "ISO-8859-2", "Slovenian", "Central Europe");
    CASE(0x040a, "ISO-8859-1", "Spanish_Trad_Sort", "Western Europe & US");
    CASE(0x080a, "ISO-8859-1", "Spanish_Mexican", "Western Europe & US");
    CASE(0x0c0a, "ISO-8859-1", "Spanish_Modern_Sort", "Western Europe & US");
    CASE(0x100a, "ISO-8859-1", "Spanish_Guatemala", "Western Europe & US");
    CASE(0x140a, "ISO-8859-1", "Spanish_Costa_Rica", "Western Europe & US");
    CASE(0x180a, "ISO-8859-1", "Spanish_Panama", "Western Europe & US");
    CASE(0x1c0a, "ISO-8859-1", "Spanish_Dominican_Repub", "Western Europe & US");
    CASE(0x200a, "ISO-8859-1", "Spanish_Venezuela", "Western Europe & US");
    CASE(0x240a, "ISO-8859-1", "Spanish_Colombia", "Western Europe & US");
    CASE(0x280a, "ISO-8859-1", "Spanish_Peru", "Western Europe & US");
    CASE(0x2c0a, "ISO-8859-1", "Spanish_Argentina", "Western Europe & US");
    CASE(0x300a, "ISO-8859-1", "Spanish_Ecuador", "Western Europe & US");
    CASE(0x340a, "ISO-8859-1", "Spanish_Chile", "Western Europe & US");
    CASE(0x380a, "ISO-8859-1", "Spanish_Uruguay", "Western Europe & US");
    CASE(0x3c0a, "ISO-8859-1", "Spanish_Paraguay", "Western Europe & US");
    CASE(0x400a, "ISO-8859-1", "Spanish_Bolivia", "Western Europe & US");
    CASE(0x440a, "ISO-8859-1", "Spanish_El_Salvador", "Western Europe & US");
    CASE(0x480a, "ISO-8859-1", "Spanish_Honduras", "Western Europe & US");
    CASE(0x4c0a, "ISO-8859-1", "Spanish_Nicaragua", "Western Europe & US");
    CASE(0x500a, "ISO-8859-1", "Spanish_Puerto_Rico", "Western Europe & US");
    CASE(0x0441, "ISO-8859-1", "Swahili", "Western Europe & US");
    CASE(0x041d, "ISO-8859-1", "Swedish", "Western Europe & US");
    CASE(0x081d, "ISO-8859-1", "Swedish_Finland", "Western Europe & US");
    CASE(0x0449, NULL,        "Tamil", "Indic");
    CASE(0x0444, "cp1251",    "Tatar", "Cyrillic");
    CASE(0x041e, "ISO-8859-11","Thai", "Thai");
    CASE(0x041f, "ISO-8859-9", "Turkish", "Turkish");
    CASE(0x0422, "cp1251",    "Ukrainian", "Cyrillic");
    CASE(0x0420, "ISO-8859-6", "Urdu", "Arabic");
    CASE(0x0443, "ISO-8859-9", "Uzbek_Latin", "Turkish");
    CASE(0x0843, "cp1251",    "Uzbek_Cyrillic", "Cyrillic");
    CASE(0x042a, NULL,        "Vietnamese", "Vietnamese");
    }
#undef CASE
    return "UTF-8";
}
