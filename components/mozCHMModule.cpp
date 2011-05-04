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

#include "mozilla-config.h"
#include "mozilla/ModuleUtils.h"
#include "mozCHMFile.h"
#include "mozCHMUnitInfo.h"
#include "mozCHMInputStream.h"

NS_GENERIC_FACTORY_CONSTRUCTOR(mozCHMFile)
NS_DEFINE_NAMED_CID(MOZ_CHMFILE_CID);

NS_GENERIC_FACTORY_CONSTRUCTOR(mozCHMUnitInfo)
NS_DEFINE_NAMED_CID(MOZ_CHMUNITINFO_CID);

NS_GENERIC_FACTORY_CONSTRUCTOR(mozCHMInputStream)
NS_DEFINE_NAMED_CID(MOZ_CHMINPUTSTREAM_CID);

static const mozilla::Module::CIDEntry kCIDs[] = {
    { &kMOZ_CHMFILE_CID, false, NULL, mozCHMFileConstructor},
    { &kMOZ_CHMUNITINFO_CID, false, NULL, mozCHMUnitInfoConstructor},
    { &kMOZ_CHMINPUTSTREAM_CID, false, NULL, mozCHMInputStreamConstructor},
    { NULL }
};

static const mozilla::Module::ContractIDEntry kContracts[] = {
    { MOZ_CHMFILE_CONTRACTID, &kMOZ_CHMFILE_CID },
    { MOZ_CHMUNITINFO_CONTRACTID, &kMOZ_CHMUNITINFO_CID },
    { MOZ_CHMINPUTSTREAM_CONTRACTID, &kMOZ_CHMINPUTSTREAM_CID },
    { NULL }
};

static const mozilla::Module::CategoryEntry kCategories[] = {
    // { "chmfox-category", "chmfox-key", CHMFOX_CONTRACTID },
    { NULL }
};

static const mozilla::Module kModule = {
    mozilla::Module::kVersion,
    kCIDs,
    kContracts,
    kCategories
};

NSMODULE_DEFN(mozCHMModule) = &kModule;

NS_IMPL_MOZILLA192_NSGETMODULE(&kModule)
