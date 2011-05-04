/*
 * DO NOT EDIT.  THIS FILE IS GENERATED FROM components\ICHMUnitInfo.idl
 */

#ifndef __gen_ICHMUnitInfo_h__
#define __gen_ICHMUnitInfo_h__


#ifndef __gen_nsISupports_h__
#include "nsISupports.h"
#endif

/* For IDL files that don't want to include root IDL files. */
#ifndef NS_NO_VTABLE
#define NS_NO_VTABLE
#endif

/* starting interface:    ICHMUnitInfo */
#define ICHMUNITINFO_IID_STR "d360fd27-c486-4e60-844a-1075270f98ac"

#define ICHMUNITINFO_IID \
  {0xd360fd27, 0xc486, 0x4e60, \
    { 0x84, 0x4a, 0x10, 0x75, 0x27, 0x0f, 0x98, 0xac }}

class NS_NO_VTABLE NS_SCRIPTABLE ICHMUnitInfo : public nsISupports {
 public: 

  NS_DECLARE_STATIC_IID_ACCESSOR(ICHMUNITINFO_IID)

  /* readonly attribute unsigned long long start; */
  NS_SCRIPTABLE NS_IMETHOD GetStart(PRUint64 *aStart) = 0;

  /* readonly attribute unsigned long long length; */
  NS_SCRIPTABLE NS_IMETHOD GetLength(PRUint64 *aLength) = 0;

  /* readonly attribute long space; */
  NS_SCRIPTABLE NS_IMETHOD GetSpace(PRInt32 *aSpace) = 0;

  /* readonly attribute long flags; */
  NS_SCRIPTABLE NS_IMETHOD GetFlags(PRInt32 *aFlags) = 0;

  /* readonly attribute ACString path; */
  NS_SCRIPTABLE NS_IMETHOD GetPath(nsACString & aPath) = 0;

  /* [noscript] npChmUnitInfo getNativeChmUnitInfo (); */
  NS_IMETHOD GetNativeChmUnitInfo(struct chmUnitInfo **_retval NS_OUTPARAM) = 0;

};

  NS_DEFINE_STATIC_IID_ACCESSOR(ICHMUnitInfo, ICHMUNITINFO_IID)

/* Use this macro when declaring classes that implement this interface. */
#define NS_DECL_ICHMUNITINFO \
  NS_SCRIPTABLE NS_IMETHOD GetStart(PRUint64 *aStart); \
  NS_SCRIPTABLE NS_IMETHOD GetLength(PRUint64 *aLength); \
  NS_SCRIPTABLE NS_IMETHOD GetSpace(PRInt32 *aSpace); \
  NS_SCRIPTABLE NS_IMETHOD GetFlags(PRInt32 *aFlags); \
  NS_SCRIPTABLE NS_IMETHOD GetPath(nsACString & aPath); \
  NS_IMETHOD GetNativeChmUnitInfo(struct chmUnitInfo **_retval NS_OUTPARAM); 

/* Use this macro to declare functions that forward the behavior of this interface to another object. */
#define NS_FORWARD_ICHMUNITINFO(_to) \
  NS_SCRIPTABLE NS_IMETHOD GetStart(PRUint64 *aStart) { return _to GetStart(aStart); } \
  NS_SCRIPTABLE NS_IMETHOD GetLength(PRUint64 *aLength) { return _to GetLength(aLength); } \
  NS_SCRIPTABLE NS_IMETHOD GetSpace(PRInt32 *aSpace) { return _to GetSpace(aSpace); } \
  NS_SCRIPTABLE NS_IMETHOD GetFlags(PRInt32 *aFlags) { return _to GetFlags(aFlags); } \
  NS_SCRIPTABLE NS_IMETHOD GetPath(nsACString & aPath) { return _to GetPath(aPath); } \
  NS_IMETHOD GetNativeChmUnitInfo(struct chmUnitInfo **_retval NS_OUTPARAM) { return _to GetNativeChmUnitInfo(_retval); } 

/* Use this macro to declare functions that forward the behavior of this interface to another object in a safe way. */
#define NS_FORWARD_SAFE_ICHMUNITINFO(_to) \
  NS_SCRIPTABLE NS_IMETHOD GetStart(PRUint64 *aStart) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetStart(aStart); } \
  NS_SCRIPTABLE NS_IMETHOD GetLength(PRUint64 *aLength) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetLength(aLength); } \
  NS_SCRIPTABLE NS_IMETHOD GetSpace(PRInt32 *aSpace) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetSpace(aSpace); } \
  NS_SCRIPTABLE NS_IMETHOD GetFlags(PRInt32 *aFlags) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetFlags(aFlags); } \
  NS_SCRIPTABLE NS_IMETHOD GetPath(nsACString & aPath) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetPath(aPath); } \
  NS_IMETHOD GetNativeChmUnitInfo(struct chmUnitInfo **_retval NS_OUTPARAM) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetNativeChmUnitInfo(_retval); } 

#if 0
/* Use the code below as a template for the implementation class for this interface. */

/* Header file */
class _MYCLASS_ : public ICHMUnitInfo
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_ICHMUNITINFO

  _MYCLASS_();

private:
  ~_MYCLASS_();

protected:
  /* additional members */
};

/* Implementation file */
NS_IMPL_ISUPPORTS1(_MYCLASS_, ICHMUnitInfo)

_MYCLASS_::_MYCLASS_()
{
  /* member initializers and constructor code */
}

_MYCLASS_::~_MYCLASS_()
{
  /* destructor code */
}

/* readonly attribute unsigned long long start; */
NS_IMETHODIMP _MYCLASS_::GetStart(PRUint64 *aStart)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute unsigned long long length; */
NS_IMETHODIMP _MYCLASS_::GetLength(PRUint64 *aLength)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute long space; */
NS_IMETHODIMP _MYCLASS_::GetSpace(PRInt32 *aSpace)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute long flags; */
NS_IMETHODIMP _MYCLASS_::GetFlags(PRInt32 *aFlags)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute ACString path; */
NS_IMETHODIMP _MYCLASS_::GetPath(nsACString & aPath)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* [noscript] npChmUnitInfo getNativeChmUnitInfo (); */
NS_IMETHODIMP _MYCLASS_::GetNativeChmUnitInfo(struct chmUnitInfo **_retval NS_OUTPARAM)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* End of implementation class template. */
#endif


#endif /* __gen_ICHMUnitInfo_h__ */
