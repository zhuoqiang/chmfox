/**
   @author ZHUO Qiang
   
   @date Wed Jul 27 22:57:29 2011
   @file
*/

#ifndef _EXPORT_H_2287019_
#define _EXPORT_H_2287019_

#include "chm_lib.h"
#include "extra.h"

#if defined _WIN32 || defined __CYGWIN__

#ifdef __GNUC__
#define CHMFOX_EXPORT __attribute__ ((dllexport))
#else
#define CHMFOX_EXPORT __declspec(dllexport)
#endif

#else

#if __GNUC__ >= 4
#define CHMFOX_EXPORT __attribute__ ((visibility ("default")))
#else
#define CHMFOX_EXPORT
#endif

#endif

#ifdef __cplusplus
extern "C" {
#endif

    CHMFOX_EXPORT struct chmFile* chmfox_open(char const* filename)
    {
        return chm_open(filename);
    }

    CHMFOX_EXPORT void chmfox_close(struct chmFile* handle)
    {
        chm_close(handle);
    }
    
    CHMFOX_EXPORT void chmfox_set_param(
        struct chmFile *h,
        int paramType,
        int paramVal)
    {
        chm_set_param(h, paramType, paramVal);
    }

    CHMFOX_EXPORT int chmfox_resolve_object(
        struct chmFile *h,
        const char *objPath,
        struct chmUnitInfo *ui)
    {
        return chm_resolve_object(h, objPath, ui);
    }

    CHMFOX_EXPORT LONGINT64 chmfox_retrieve_object(
        struct chmFile *h,
        struct chmUnitInfo *ui,
        unsigned char *buf,
        LONGUINT64 addr,
        LONGINT64 len)
    {
        return chm_retrieve_object(h, ui, buf, addr, len);
    }

    
    CHMFOX_EXPORT int chmfox_enumerate(
        struct chmFile *h,
        int what,
        CHM_ENUMERATOR e,
        void *context)
    {
        return chm_enumerate(h, what, e, context);
    }

    CHMFOX_EXPORT int chmfox_enumerate_dir(
        struct chmFile *h,
        const char *prefix,
        int what,
        CHM_ENUMERATOR e,
        void *context)
    {
        return chm_enumerate_dir(h, prefix, what, e, context);
    }

    
    CHMFOX_EXPORT int chmfox_search(
        struct chmFile *h,
        const char *text, int whole_words, 
        int titles_only, pychm_search_enumerator enumerator)
    {
        return chm_search(h, text, whole_words, titles_only, enumerator);
    }


#ifdef __cplusplus
}
#endif

#endif /* _EXPORT_H_2287019_ */
