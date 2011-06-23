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


#include "mozCHMInputStream.h"

#include "nsStringAPI.h"

NS_IMPL_ISUPPORTS1(mozCHMInputStream, nsIInputStream)

mozCHMInputStream::mozCHMInputStream() :
    m_available(0)
{
}

mozCHMInputStream::~mozCHMInputStream()
{
    Close();
    //printf("mozCHMInputStream::~mozCHMInputStream()\n");
}

nsresult
mozCHMInputStream::Init(ICHMFile *chmfile, ICHMUnitInfo *ui)
{
    m_chmfile = chmfile;
    m_ui = ui;
    m_ui->GetLength(&m_available);

    return NS_OK;
}

/* void close (); */
NS_IMETHODIMP mozCHMInputStream::Close()
{
    return NS_OK;
}

/* unsigned long available (); */
NS_IMETHODIMP mozCHMInputStream::Available(PRUint32 *_retval)
{
    *_retval = m_available;
    //printf("available %d\n", *_retval);

    return NS_OK;
}

/* [noscript] unsigned long read (in charPtr aBuf, in unsigned long aCount); */
NS_IMETHODIMP mozCHMInputStream::Read(char * aBuf, PRUint32 aCount, PRUint32 *_retval)
{
    nsresult rv = NS_OK;

    if (m_available) {
        PRUint64 length;
        m_ui->GetLength(&length);
        rv = m_chmfile->RetrieveObjectToBuffer(m_ui, length - m_available, aCount, aBuf, _retval);
        m_available -= *_retval;
    } else {
        *_retval = 0;
    }

    return rv;
}

/* [noscript] unsigned long readSegments (in nsWriteSegmentFun aWriter, in voidPtr aClosure, in unsigned long aCount); */
NS_IMETHODIMP mozCHMInputStream::ReadSegments(nsWriteSegmentFun aWriter, void * aClosure, PRUint32 aCount, PRUint32 *_retval)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* boolean isNonBlocking (); */
NS_IMETHODIMP mozCHMInputStream::IsNonBlocking(PRBool *_retval)
{
    *_retval = false;
    return NS_OK;
}
