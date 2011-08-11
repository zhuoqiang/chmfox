/**
   @author ZHUO Qiang
   
   @date Thu Aug 11 10:11:37 2011
   @file
*/

#ifndef _EXTRA_H_2832506_
#define _EXTRA_H_2832506_

#include "chm_lib.h"

typedef int (*pychm_search_enumerator)(
    struct chmFile* h,
    const char* topic,
    const char* url);

int 
chm_search (struct chmFile *chmfile,
            const char *text, int whole_words, 
            int titles_only, pychm_search_enumerator enumerator);

#endif /* _EXTRA_H_2832506_ */
