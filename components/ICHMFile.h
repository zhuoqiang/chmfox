/*
 * DO NOT EDIT.  THIS FILE IS GENERATED FROM components/ICHMFile.idl
 */

#ifndef __gen_ICHMFile_h__
#define __gen_ICHMFile_h__


#ifndef __gen_nsISupports_h__
#include "nsISupports.h"
#endif

#ifndef __gen_nsIFile_h__
#include "nsIFile.h"
#endif

#ifndef __gen_nsIInputStream_h__
#include "nsIInputStream.h"
#endif

#ifndef __gen_ICHMUnitInfo_h__
#include "ICHMUnitInfo.h"
#endif

/* For IDL files that don't want to include root IDL files. */
#ifndef NS_NO_VTABLE
#define NS_NO_VTABLE
#endif

/* starting interface:    ICHMFile */
#define ICHMFILE_IID_STR "ca627f57-99b7-4ebc-9483-9a216eb99439"

#define ICHMFILE_IID \
  {0xca627f57, 0x99b7, 0x4ebc, \
    { 0x94, 0x83, 0x9a, 0x21, 0x6e, 0xb9, 0x94, 0x39 }}

class NS_NO_VTABLE NS_SCRIPTABLE ICHMFile : public nsISupports {
 public: 

  NS_DECLARE_STATIC_IID_ACCESSOR(ICHMFILE_IID)

  /* long LoadCHM (in nsIFile chmfile); */
  NS_SCRIPTABLE NS_IMETHOD LoadCHM(nsIFile *chmfile, PRInt32 *_retval) = 0;

  /* void CloseCHM (); */
  NS_SCRIPTABLE NS_IMETHOD CloseCHM(void) = 0;

  /* readonly attribute ACString topics; */
  NS_SCRIPTABLE NS_IMETHOD GetTopics(nsACString & aTopics) = 0;

  /* readonly attribute ACString index; */
  NS_SCRIPTABLE NS_IMETHOD GetIndex(nsACString & aIndex) = 0;

  /* readonly attribute ACString home; */
  NS_SCRIPTABLE NS_IMETHOD GetHome(nsACString & aHome) = 0;

  /* readonly attribute ACString title; */
  NS_SCRIPTABLE NS_IMETHOD GetTitle(nsACString & aTitle) = 0;

  /* readonly attribute AString uTitle; */
  NS_SCRIPTABLE NS_IMETHOD GetUTitle(nsAString & aUTitle) = 0;

  /* readonly attribute boolean isSearchable; */
  NS_SCRIPTABLE NS_IMETHOD GetIsSearchable(PRBool *aIsSearchable) = 0;

  /* readonly attribute ACString encoding; */
  NS_SCRIPTABLE NS_IMETHOD GetEncoding(nsACString & aEncoding) = 0;

  /* readonly attribute long LCID; */
  NS_SCRIPTABLE NS_IMETHOD GetLCID(PRInt32 *aLCID) = 0;

  /* ICHMUnitInfo resolveObject (in ACString path); */
  NS_SCRIPTABLE NS_IMETHOD ResolveObject(const nsACString & path, ICHMUnitInfo **_retval) = 0;

  /* ACString retrieveObject (in ICHMUnitInfo ui, in long start, in long length); */
  NS_SCRIPTABLE NS_IMETHOD RetrieveObject(ICHMUnitInfo *ui, PRInt32 start, PRInt32 length, nsACString & _retval) = 0;

  /* [noscript] unsigned long retrieveObjectToBuffer (in ICHMUnitInfo ui, in long start, in long length, in charPtr buf); */
  NS_IMETHOD RetrieveObjectToBuffer(ICHMUnitInfo *ui, PRInt32 start, PRInt32 length, char * buf, PRUint32 *_retval) = 0;

  /* nsIInputStream getInputStream (in ICHMUnitInfo ui); */
  NS_SCRIPTABLE NS_IMETHOD GetInputStream(ICHMUnitInfo *ui, nsIInputStream **_retval) = 0;

};

  NS_DEFINE_STATIC_IID_ACCESSOR(ICHMFile, ICHMFILE_IID)

/* Use this macro when declaring classes that implement this interface. */
#define NS_DECL_ICHMFILE \
  NS_SCRIPTABLE NS_IMETHOD LoadCHM(nsIFile *chmfile, PRInt32 *_retval); \
  NS_SCRIPTABLE NS_IMETHOD CloseCHM(void); \
  NS_SCRIPTABLE NS_IMETHOD GetTopics(nsACString & aTopics); \
  NS_SCRIPTABLE NS_IMETHOD GetIndex(nsACString & aIndex); \
  NS_SCRIPTABLE NS_IMETHOD GetHome(nsACString & aHome); \
  NS_SCRIPTABLE NS_IMETHOD GetTitle(nsACString & aTitle); \
  NS_SCRIPTABLE NS_IMETHOD GetUTitle(nsAString & aUTitle); \
  NS_SCRIPTABLE NS_IMETHOD GetIsSearchable(PRBool *aIsSearchable); \
  NS_SCRIPTABLE NS_IMETHOD GetEncoding(nsACString & aEncoding); \
  NS_SCRIPTABLE NS_IMETHOD GetLCID(PRInt32 *aLCID); \
  NS_SCRIPTABLE NS_IMETHOD ResolveObject(const nsACString & path, ICHMUnitInfo **_retval); \
  NS_SCRIPTABLE NS_IMETHOD RetrieveObject(ICHMUnitInfo *ui, PRInt32 start, PRInt32 length, nsACString & _retval); \
  NS_IMETHOD RetrieveObjectToBuffer(ICHMUnitInfo *ui, PRInt32 start, PRInt32 length, char * buf, PRUint32 *_retval); \
  NS_SCRIPTABLE NS_IMETHOD GetInputStream(ICHMUnitInfo *ui, nsIInputStream **_retval); 

/* Use this macro to declare functions that forward the behavior of this interface to another object. */
#define NS_FORWARD_ICHMFILE(_to) \
  NS_SCRIPTABLE NS_IMETHOD LoadCHM(nsIFile *chmfile, PRInt32 *_retval) { return _to LoadCHM(chmfile, _retval); } \
  NS_SCRIPTABLE NS_IMETHOD CloseCHM(void) { return _to CloseCHM(); } \
  NS_SCRIPTABLE NS_IMETHOD GetTopics(nsACString & aTopics) { return _to GetTopics(aTopics); } \
  NS_SCRIPTABLE NS_IMETHOD GetIndex(nsACString & aIndex) { return _to GetIndex(aIndex); } \
  NS_SCRIPTABLE NS_IMETHOD GetHome(nsACString & aHome) { return _to GetHome(aHome); } \
  NS_SCRIPTABLE NS_IMETHOD GetTitle(nsACString & aTitle) { return _to GetTitle(aTitle); } \
  NS_SCRIPTABLE NS_IMETHOD GetUTitle(nsAString & aUTitle) { return _to GetUTitle(aUTitle); } \
  NS_SCRIPTABLE NS_IMETHOD GetIsSearchable(PRBool *aIsSearchable) { return _to GetIsSearchable(aIsSearchable); } \
  NS_SCRIPTABLE NS_IMETHOD GetEncoding(nsACString & aEncoding) { return _to GetEncoding(aEncoding); } \
  NS_SCRIPTABLE NS_IMETHOD GetLCID(PRInt32 *aLCID) { return _to GetLCID(aLCID); } \
  NS_SCRIPTABLE NS_IMETHOD ResolveObject(const nsACString & path, ICHMUnitInfo **_retval) { return _to ResolveObject(path, _retval); } \
  NS_SCRIPTABLE NS_IMETHOD RetrieveObject(ICHMUnitInfo *ui, PRInt32 start, PRInt32 length, nsACString & _retval) { return _to RetrieveObject(ui, start, length, _retval); } \
  NS_IMETHOD RetrieveObjectToBuffer(ICHMUnitInfo *ui, PRInt32 start, PRInt32 length, char * buf, PRUint32 *_retval) { return _to RetrieveObjectToBuffer(ui, start, length, buf, _retval); } \
  NS_SCRIPTABLE NS_IMETHOD GetInputStream(ICHMUnitInfo *ui, nsIInputStream **_retval) { return _to GetInputStream(ui, _retval); } 

/* Use this macro to declare functions that forward the behavior of this interface to another object in a safe way. */
#define NS_FORWARD_SAFE_ICHMFILE(_to) \
  NS_SCRIPTABLE NS_IMETHOD LoadCHM(nsIFile *chmfile, PRInt32 *_retval) { return !_to ? NS_ERROR_NULL_POINTER : _to->LoadCHM(chmfile, _retval); } \
  NS_SCRIPTABLE NS_IMETHOD CloseCHM(void) { return !_to ? NS_ERROR_NULL_POINTER : _to->CloseCHM(); } \
  NS_SCRIPTABLE NS_IMETHOD GetTopics(nsACString & aTopics) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetTopics(aTopics); } \
  NS_SCRIPTABLE NS_IMETHOD GetIndex(nsACString & aIndex) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetIndex(aIndex); } \
  NS_SCRIPTABLE NS_IMETHOD GetHome(nsACString & aHome) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetHome(aHome); } \
  NS_SCRIPTABLE NS_IMETHOD GetTitle(nsACString & aTitle) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetTitle(aTitle); } \
  NS_SCRIPTABLE NS_IMETHOD GetUTitle(nsAString & aUTitle) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetUTitle(aUTitle); } \
  NS_SCRIPTABLE NS_IMETHOD GetIsSearchable(PRBool *aIsSearchable) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetIsSearchable(aIsSearchable); } \
  NS_SCRIPTABLE NS_IMETHOD GetEncoding(nsACString & aEncoding) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetEncoding(aEncoding); } \
  NS_SCRIPTABLE NS_IMETHOD GetLCID(PRInt32 *aLCID) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetLCID(aLCID); } \
  NS_SCRIPTABLE NS_IMETHOD ResolveObject(const nsACString & path, ICHMUnitInfo **_retval) { return !_to ? NS_ERROR_NULL_POINTER : _to->ResolveObject(path, _retval); } \
  NS_SCRIPTABLE NS_IMETHOD RetrieveObject(ICHMUnitInfo *ui, PRInt32 start, PRInt32 length, nsACString & _retval) { return !_to ? NS_ERROR_NULL_POINTER : _to->RetrieveObject(ui, start, length, _retval); } \
  NS_IMETHOD RetrieveObjectToBuffer(ICHMUnitInfo *ui, PRInt32 start, PRInt32 length, char * buf, PRUint32 *_retval) { return !_to ? NS_ERROR_NULL_POINTER : _to->RetrieveObjectToBuffer(ui, start, length, buf, _retval); } \
  NS_SCRIPTABLE NS_IMETHOD GetInputStream(ICHMUnitInfo *ui, nsIInputStream **_retval) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetInputStream(ui, _retval); } 

#if 0
/* Use the code below as a template for the implementation class for this interface. */

/* Header file */
class _MYCLASS_ : public ICHMFile
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_ICHMFILE

  _MYCLASS_();

private:
  ~_MYCLASS_();

protected:
  /* additional members */
};

/* Implementation file */
NS_IMPL_ISUPPORTS1(_MYCLASS_, ICHMFile)

_MYCLASS_::_MYCLASS_()
{
  /* member initializers and constructor code */
}

_MYCLASS_::~_MYCLASS_()
{
  /* destructor code */
}

/* long LoadCHM (in nsIFile chmfile); */
NS_IMETHODIMP _MYCLASS_::LoadCHM(nsIFile *chmfile, PRInt32 *_retval)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* void CloseCHM (); */
NS_IMETHODIMP _MYCLASS_::CloseCHM()
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute ACString topics; */
NS_IMETHODIMP _MYCLASS_::GetTopics(nsACString & aTopics)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute ACString index; */
NS_IMETHODIMP _MYCLASS_::GetIndex(nsACString & aIndex)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute ACString home; */
NS_IMETHODIMP _MYCLASS_::GetHome(nsACString & aHome)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute ACString title; */
NS_IMETHODIMP _MYCLASS_::GetTitle(nsACString & aTitle)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute AString uTitle; */
NS_IMETHODIMP _MYCLASS_::GetUTitle(nsAString & aUTitle)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute boolean isSearchable; */
NS_IMETHODIMP _MYCLASS_::GetIsSearchable(PRBool *aIsSearchable)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute ACString encoding; */
NS_IMETHODIMP _MYCLASS_::GetEncoding(nsACString & aEncoding)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute long LCID; */
NS_IMETHODIMP _MYCLASS_::GetLCID(PRInt32 *aLCID)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* ICHMUnitInfo resolveObject (in ACString path); */
NS_IMETHODIMP _MYCLASS_::ResolveObject(const nsACString & path, ICHMUnitInfo **_retval)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* ACString retrieveObject (in ICHMUnitInfo ui, in long start, in long length); */
NS_IMETHODIMP _MYCLASS_::RetrieveObject(ICHMUnitInfo *ui, PRInt32 start, PRInt32 length, nsACString & _retval)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* [noscript] unsigned long retrieveObjectToBuffer (in ICHMUnitInfo ui, in long start, in long length, in charPtr buf); */
NS_IMETHODIMP _MYCLASS_::RetrieveObjectToBuffer(ICHMUnitInfo *ui, PRInt32 start, PRInt32 length, char * buf, PRUint32 *_retval)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* nsIInputStream getInputStream (in ICHMUnitInfo ui); */
NS_IMETHODIMP _MYCLASS_::GetInputStream(ICHMUnitInfo *ui, nsIInputStream **_retval)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* End of implementation class template. */
#endif


#endif /* __gen_ICHMFile_h__ */
