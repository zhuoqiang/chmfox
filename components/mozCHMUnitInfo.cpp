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


#include "mozCHMUnitInfo.h"
#include "nsStringAPI.h"

NS_IMPL_ISUPPORTS1(mozCHMUnitInfo, ICHMUnitInfo)

mozCHMUnitInfo::mozCHMUnitInfo()
{
  /* member initializers and constructor code */
}

mozCHMUnitInfo::~mozCHMUnitInfo()
{
  /* destructor code */
  //printf("mozCHMUnitInfo::~mozCHMUnitInfo()\n");
}

/* readonly attribute unsigned long long start; */
NS_IMETHODIMP mozCHMUnitInfo::GetStart(PRUint64 *aStart)
{
    *aStart = m_ui.start;
    return NS_OK;
}

/* readonly attribute unsigned long long length; */
NS_IMETHODIMP mozCHMUnitInfo::GetLength(PRUint64 *aLength)
{
    *aLength = m_ui.length;
    return NS_OK;
}

/* readonly attribute long space; */
NS_IMETHODIMP mozCHMUnitInfo::GetSpace(PRInt32 *aSpace)
{
    *aSpace = m_ui.space;
    return NS_OK;
}

/* readonly attribute long flags; */
NS_IMETHODIMP mozCHMUnitInfo::GetFlags(PRInt32 *aFlags)
{
    *aFlags = m_ui.flags;
    return NS_OK;
}

/* readonly attribute ACString path; */
NS_IMETHODIMP mozCHMUnitInfo::GetPath(nsACString & aPath)
{
    if (m_ui.path != NULL) aPath = m_ui.path;
    return NS_OK;
}

/* [noscript] npChmUnitInfo getNativeChmUnitInfo (); */
NS_IMETHODIMP mozCHMUnitInfo::GetNativeChmUnitInfo(
    struct chmUnitInfo * *_retval)
{
    *_retval = &m_ui;
    return NS_OK;
}
