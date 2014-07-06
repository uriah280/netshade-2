/*

+----------------------------------------------------------------------------+
!                                                                            !
!   yDec.c 1.0.1a 2002/01/16                                                 !
!                                                                            !
!   This sourcecode is released to the public domain - no rights reserved    !
!   More info - also about the yEncoding - at:  www.yenc.org                 !
!                                                                            !
!   If you make a portation to another OS then please notify me (TIA)        !
!          archiver@i3w.com    (Questions welcome)                           !
!                                                                            !
!   Juergen Helbing - infstar@infostar.de                                    !
!   Harald Roelle - hr_yenc@nm.informatik.uni-muenchen.de                    !
!                                                                            !
+----------------------------------------------------------------------------+

*/


#include <stdlib.h>
#include <stdio.h>
#include <stdarg.h>
#include <errno.h>
#include <string.h>
#include <ctype.h>

#ifdef __unix__
  #include <sys/stat.h>
#endif // __unix__


#ifdef __WHATEVER_FOR_WINDOWS__

  #include <windows.h>
  #include <winsock.h>
  #include <io.h>
  #include <math.h>
  #include <signal.h>
  // For SOPEN
  #include <share.h>
  #include <fcntl.h>
  #include <sys\stat.h>

  #include <dir.h>
  #include <dos.h>

  #pragma warn -pro
#endif /*__WHATEVER_FOR_WINDOWS__*/


#include "ydec.h"


//--------------------------------------------------------------------------------------------------
//
// global variables
//

bool                 g_keepCorrupted = false;
bool                 g_beVerbose     = false;

unsigned int         g_errCnt        = 0;

unsigned int         g_debugLevel    = 0;

char                 *g_outputDir    = NULL;

struct yencFileEntry *g_yencFileList = NULL;  // chained list of destination files


//--------------------------------------------------------------------------------------------------
//
// output functions
//

void printfError( const char *inFormat, ...)
{
  va_list inParamList;

  g_errCnt++;

  va_start( inParamList, inFormat);
  vfprintf( stderr, inFormat, inParamList);
  va_end( inParamList);
}

void printfPerror( const int inErrno, const char *inFormat, ...)
{
  va_list inParamList;
  char    newMsg[ERRMSG_LENGTH];

  va_start( inParamList, inFormat);
  vsnprintf( newMsg, ERRMSG_LENGTH, inFormat, inParamList);
  va_end( inParamList);
  if ( inErrno < sys_nerr-1 ) {
    if ( newMsg[strlen( newMsg)-1] == '\n' ) newMsg[strlen( newMsg)-1] = 0;
    strncat( newMsg, ": ", ERRMSG_LENGTH-strlen( newMsg)-1);
    strncat( newMsg, sys_errlist[inErrno], ERRMSG_LENGTH-strlen( newMsg)-1);
  }
  printfError( "%s\n", newMsg);
}

void printfMessage( const char *inFormat, ...)
{
  va_list inParamList;

  va_start( inParamList, inFormat);
  vfprintf( stdout, inFormat, inParamList);
  va_end( inParamList);
}

int printfDebug( const int inLevel, const char *inFormat, ...)
{
  va_list inParamList;
  int     retVal = 0;

  if ( g_debugLevel & inLevel ) {
    va_start( inParamList, inFormat);
    retVal = vfprintf( stderr, inFormat, inParamList);
    va_end( inParamList);
  }

  return retVal;
}

char *getPosDescr( const unsigned long inLineNum, 
                   const struct yencPartEntry *inPartEntry, 
                   const struct yencFileEntry *inFileEntry)
{
  static char theMsg[ERRMSG_LENGTH];  // a really dirty way for permanently allocating mem

  if ( inPartEntry==NULL ) {
    printfError( "Unexpected internal error in getPosDescr(): NULL parameter given\n");
    exit( EXIT_INTERNAL_ERR);
  }

  if ( inFileEntry == NULL ) {
    snprintf( theMsg, ERRMSG_LENGTH, "infile: '%s', line: %ld",
              inPartEntry->fileName, inLineNum);
  }
  else if ( inFileEntry->isMultipart == false ) {  // check for false explicitely, it is triBool!
    snprintf( theMsg, ERRMSG_LENGTH, "infile: '%s', line: %ld, outfile: '%s'",
              inPartEntry->fileName, inLineNum, inFileEntry->destFile);
  }
  else {
    snprintf( theMsg, ERRMSG_LENGTH, "infile: '%s', line: %ld, outfile: '%s', part: %d", 
              inPartEntry->fileName, inLineNum, inFileEntry->destFile, inPartEntry->partNum);
  }

  return theMsg;
}


//--------------------------------------------------------------------------------------------------
//
// memory handling helper
//

void *calloc_check( const unsigned long inNmemb, const unsigned long inSize)
{
  void *mem = calloc( inNmemb, inSize);
  if ( mem == NULL ) {
    printfError( "Out of memory\n");
    exit( EXIT_NO_MEM);
  }
  return mem;
}


//--------------------------------------------------------------------------------------------------
//
// string handling helper
//

char *strcpy_malloc( char **inDest, const char *inSrc)
{
  if ( inDest==NULL || inSrc==NULL ) {
    printfError( "Unexpected internal error in strcpy_malloc(): NULL parameter given\n");
    exit( EXIT_INTERNAL_ERR);
  }

  *inDest = calloc_check( 1, strlen( inSrc)+1L);
  return strcpy( *inDest, inSrc);
}

void strtrim( char *inStr)
{
  while( isspace( inStr[0]) ) memmove( inStr, inStr+1, strlen( inStr+1));
  while( isspace( inStr[strlen( inStr)-1]) ) inStr[strlen( inStr)-1] = 0;
}


//--------------------------------------------------------------------------------------------------
//
// file io helper
//

// ad_fgetscr  is a functions which simulates 'fgets' but removes CRLF at the line end
char* fgets_cr( unsigned char* inBuffer, const long inMaxlen, FILE* inFp)
{
  char *cp, *dp;

  if ( inFp==NULL || inBuffer==NULL ) {
    printfError( "Unexpected internal error in fgets_cr(): NULL parameter given\n");
    exit( EXIT_INTERNAL_ERR);
  }

  if ( (cp=fgets( (char*)inBuffer, inMaxlen, inFp)) == NULL ) return(NULL);
  if ( (dp=strrchr( (char*)inBuffer, '\n')) ) *dp=0;
  if ( (dp=strrchr( (char*)inBuffer, '\r')) ) *dp=0;

  printfDebug( DEBUG_FILEIO, "fgets_cr(): input line: '%s'\n", cp);

  return( cp);
}


//--------------------------------------------------------------------------------------------------
//
// chained list helper
//

struct yencFileEntry *getDestFileEntry( const char* inDestFile)
{
  struct yencFileEntry **yFilePtr;
  struct stat          statInfo;
  char                 *destPath = NULL;

  if ( inDestFile==NULL ) {
    printfError( "Unexpected internal error in getDestFileEntry(): NULL parameter given\n");
    exit( EXIT_INTERNAL_ERR);
  }

  if ( g_outputDir ) {
    destPath = calloc_check( 1, strlen( g_outputDir)+strlen( inDestFile)+1);
    strcpy( destPath, g_outputDir);
    strcat( destPath, inDestFile);
  }
  else {
    strcpy_malloc( &destPath, inDestFile);
  }

  yFilePtr = &g_yencFileList;
  while ( *yFilePtr != NULL ) {
    if ( strcmp( (*yFilePtr)->destFile, destPath) == 0 ) {
      free( destPath);
      return( *yFilePtr);  // found in list
    }
    yFilePtr = &((*yFilePtr)->nextFile);
  }

  // dest file does not exist yet in list
  *yFilePtr = calloc_check( 1, sizeof( struct yencFileEntry));

  strcpy_malloc( &((*yFilePtr)->destFile), destPath);

  (*yFilePtr)->isMultipart = uninitialized;
  (*yFilePtr)->size        = UNINITIALIZED;

  // check if dest file exists
  (*yFilePtr)->wasIgnored = true;
  if ( stat( destPath, &statInfo) == 0 ) {
    (*yFilePtr)->fileStream     = NULL;
    (*yFilePtr)->isCorrupted    = true;
    printfError( "Output file '%s' already exists, will skip all related parts\n", destPath);
  }
  else { // if not exists => open for writing
    if ( ((*yFilePtr)->fileStream=fopen( destPath, "w+b")) == NULL ) {
      (*yFilePtr)->isCorrupted    = true;
      printfPerror( errno, "Unable to open destination file '%s' for writing, will skip all related parts\n", destPath);
    }
    (*yFilePtr)->wasIgnored = false;
  }

  free( destPath);
  return( *yFilePtr);
}

void setFileCorrupted( struct yencFileEntry *inFileEntry)
{
  char *newName;

  if ( inFileEntry==NULL ) {
    printfError( "Unexpected internal error in setFileCorrupted(): NULL parameter given\n");
    exit( EXIT_INTERNAL_ERR);
  }

  // inFileEntry->isCorrupted    = true;

  if ( inFileEntry->fileStream ) {
    fclose( inFileEntry->fileStream);
  }

  if ( g_keepCorrupted ) {
    newName = calloc_check( 1, strlen( inFileEntry->destFile)+strlen( BOGUS_FILE_SUFFIX)+1);
    strcpy( newName, inFileEntry->destFile);
    strcat( newName, BOGUS_FILE_SUFFIX);
    rename( inFileEntry->destFile, newName);
    printfError( "Output file '%s' is corrupted, saved as '%s'\n", inFileEntry->destFile, newName);
    free( newName);
  }
  else {
    remove( inFileEntry->destFile);
    printfError( "Output file '%s' is corrupted, will be deleted\n", inFileEntry->destFile);
  }
}

struct yencPartEntry *newPartEntry( const char* inSourceFile, const unsigned long inLineNum)
{
  struct yencPartEntry *yPart;

  if ( inSourceFile==NULL ) {
    printfError( "Unexpected internal error in newPartEntry(): NULL parameter given\n");
    exit( EXIT_INTERNAL_ERR);
  }

  yPart = calloc_check( 1, sizeof( struct yencPartEntry));
  yPart->crcCalculated = -1L;
  strcpy_malloc( &(yPart->fileName), inSourceFile);
  yPart->startLine = inLineNum;

  return yPart;
}

void addPartEntryToFileEntry( struct yencFileEntry *inFileEntry, struct yencPartEntry *inPartEntry)
{
  struct yencPartEntry **partEntryPtr;

  if ( inFileEntry==NULL || inPartEntry==NULL) {
    printfError( "Unexpected internal error in addPartEntryToFileEntry(): NULL parameter given\n");
    exit( EXIT_INTERNAL_ERR);
  }

  // append at the end of the list
  // this is REALLY vital for later correct corruption  checking
  partEntryPtr = &(inFileEntry->partList);
  while ( *partEntryPtr != NULL ) {
    partEntryPtr = &((*partEntryPtr)->nextPart);
  }
  *partEntryPtr = inPartEntry;
}


//--------------------------------------------------------------------------------------------------
//
// crc related functions
//

void crcAdd( int *inVal, const int inC)
{
  unsigned long ch1, ch2, cc;

  /* X^32+X^26+X^23+X^22+X^16+X^12+X^11+X^10+X^8+X^7+X^5+X^4+X^2+X^1+X^0 */
  /* for (i = 0; i < size; i++) */
  /*      crccode = crc32Tab[(int) ((crccode) ^ (buf[i])) & 0xff] ^  */
  /*                (((crccode) >> 8) & 0x00FFFFFFL); */
  /*   return(crccode); */

  cc     = inC & 0x000000ffL;
  ch1    = (*inVal ^ cc) & 0xffL;
  ch1    = crc_tab[ch1];
  ch2    = (*inVal>>8L) & 0xffffffL;  // Correct version
  *inVal = ch1 ^ ch2;
}

//  hex_to_ulong makes a conversion of an 8 character CRC to an unsigned long value
//  strtol fails for CRCs which start with 89ABCDEF  !
unsigned long hexToUlong( const char *inText)
{
  unsigned long res = 0;
  unsigned char c;

  if ( inText==NULL ) {
    printfError( "Unexpected internal error in hexToUlong(): NULL parameter given\n");
    exit( EXIT_INTERNAL_ERR);
  }

  while( (c=tolower( *inText++)) ) {
    if ((c>='0') && (c<='9')) {
      res=(res<<4)+((unsigned long)(c-48) & 0x0F);
      continue;
    }
    if ((c>='a') && (c<='f')) {
      res=(res<<4)+((unsigned long)(c-87) & 0x0F);
      continue;
    }
    break;
  }
  return(res);
}


//--------------------------------------------------------------------------------------------------
//
// yenc parsing functions
//

struct yencFileEntry *parseYencBegin( const unsigned char *inLineBuffer, 
                                      const unsigned long inLineNum, 
                                      struct yencPartEntry *inPartEntry)
{
  char                   *cp;
  char                   *destFile;
  struct yencFileEntry   *fileEntry;
  unsigned long          size;

  if ( inLineBuffer==NULL || inPartEntry==NULL ) {
    printfError( "Unexpected internal error in parseYencBegin(): NULL parameter given\n");
    exit( EXIT_INTERNAL_ERR);
  }

  //
  // parse "name=" parameter
  //
  if ( (cp=strstr( (char*)inLineBuffer, YENC_BEGIN_PARM_NAME)) == NULL ) {
    printfError( "'%s' not found in begin line (%s)\n",
                 YENC_BEGIN_PARM_NAME, getPosDescr( inLineNum, inPartEntry, NULL));
    return NULL;
  }
  strcpy_malloc( &destFile, cp+strlen( YENC_BEGIN_PARM_NAME));  // destination file name
  strtrim( destFile);
  *cp = 0; // throw away the filename

  //
  // now that we have a name look for file entry in our list
  //
  fileEntry = getDestFileEntry( destFile);
  if ( fileEntry->isCorrupted ) return NULL;

  addPartEntryToFileEntry( fileEntry, inPartEntry);

  //
  // check if this is a multipart message
  // parse this one first for better error messages
  //
  if ( (cp=strstr( (char*)inLineBuffer, YENC_BEGIN_PARM_PART)) ) // this is a part of a multipart message
  {
    if ( fileEntry->isMultipart == false ) {
      printfError( "Inconsistecy in beeing single/multi part file (%s)\n",
                   getPosDescr( inLineNum, inPartEntry, fileEntry));
      // this one is really fatal, so give up this ouput file
     // setFileCorrupted( fileEntry);
     // inPartEntry->isCorrupted = true;
      // return NULL;
    }
    else {
      fileEntry->isMultipart = true;
    }

    inPartEntry->partNum = atol( cp+strlen( YENC_BEGIN_PARM_PART));
  }
  else {
    if ( fileEntry->isMultipart == true ) {
      printfError( "Inconsistecy in beeing single/multi part file (%s)\n",
                   getPosDescr( inLineNum, inPartEntry, fileEntry));
      // this one is really fatal, so give up this ouput file
     // setFileCorrupted( fileEntry);
     // inPartEntry->isCorrupted = true;
     // return NULL;
    }
    else {
      fileEntry->isMultipart = false;
    }
  }

  //
  // parse "size=" parameter
  //
  if ( (cp=strstr( (char*)inLineBuffer, YENC_BEGIN_PARM_SIZE)) == NULL ) {
    printfError( "'%s' not found in begin line (%s)\n",
                 YENC_BEGIN_PARM_SIZE, getPosDescr( inLineNum, inPartEntry, fileEntry));
    // we have not written anything yet, so only set 
    // the part to corrupted and not the whole file
   // inPartEntry->isCorrupted = true;
   // return NULL;
  }
  size = atol( cp+strlen( YENC_BEGIN_PARM_SIZE));
  if ( fileEntry->size == UNINITIALIZED ) {
    fileEntry->size = size;
  }
  else if ( size != fileEntry->size ) {
    printfError( "Inconsistent size to previous part (%s)\n",
                 getPosDescr( inLineNum, inPartEntry, fileEntry));
    // we have not written anything yet, so only set 
    // the part to corrupted and not the whole file
   // inPartEntry->isCorrupted = true;
    //return NULL;
  }

  //
  // parse "line=" parameter
  //
  if ( (cp=strstr( (char*)inLineBuffer, YENC_BEGIN_PARM_LINE)) == NULL ) {
    printfError( "'%s' not found in begin line (%s)\n",
                 YENC_BEGIN_PARM_LINE, getPosDescr( inLineNum, inPartEntry, fileEntry));
    // we have not written anything yet, so only set 
    // the part to corrupted and not the whole file
   // inPartEntry->isCorrupted = true;
    // return NULL;
  }
  inPartEntry->yLine = atol( cp+strlen( YENC_BEGIN_PARM_LINE));

  return fileEntry;
}

bool parseYencPart( const unsigned char *inLineBuffer, const unsigned long inLineNum, 
                    struct yencPartEntry *inPartEntry,
                    struct yencFileEntry *inFileEntry)
{
  char *cp;

  if ( inLineBuffer==NULL || inPartEntry==NULL || inFileEntry==NULL ) {
    printfError( "Unexpected internal error in parseYencPart(): NULL parameter given\n");
    exit( EXIT_INTERNAL_ERR);
  }

  if ( strncmp( (char*)inLineBuffer, YENC_KEY_PART, strlen( YENC_KEY_PART)) ) {
    printfError( "'%s' not found, but part line was expected (%s)\n",
                 YENC_KEY_PART, getPosDescr( inLineNum, inPartEntry, inFileEntry));
    // we have not written anything yet, so only set 
    // the part to corrupted and not the whole file
    //inPartEntry->isCorrupted = true;
    //return false;
  }

  if ( (cp=strstr( (char*)inLineBuffer, YENC_PART_PARM_END)) == NULL ) {
    printfError( "'%s' not found in part line (%s)\n",
                 YENC_PART_PARM_END, getPosDescr( inLineNum, inPartEntry, inFileEntry));
    // we have not written anything yet, so only set 
    // the part to corrupted and not the whole file
    //inPartEntry->isCorrupted = true;
    //return false;
  }
  inPartEntry->posEnd = atol( cp+strlen( YENC_PART_PARM_END)) - 1; // storing postion 1 based is sooo ....

  if ( (cp=strstr( (char*)inLineBuffer, YENC_PART_PARM_BEGIN)) == NULL ) {
    printfError( "'%s' not found in part line (%s)\n",
                 YENC_PART_PARM_BEGIN, getPosDescr( inLineNum, inPartEntry, inFileEntry));
    // we have not written anything yet, so only set 
    // the part to corrupted and not the whole file
    //inPartEntry->isCorrupted = true;
    //return false;
  }
  inPartEntry->posBegin = atol( cp+strlen( YENC_PART_PARM_BEGIN)) - 1; // storing postion 1 based is sooo ....

  return true;
}

bool parseYencEnd( const unsigned char *inLineBuffer, const unsigned long inLineNum,
                   struct yencPartEntry *inPartEntry,
                   struct yencFileEntry *inFileEntry)
{
  char           *cp, *crcParamName;
  int            crc32;

  if ( inLineBuffer==NULL || inPartEntry==NULL || inFileEntry==NULL ) {
    printfError( "Unexpected internal error in parseYencEnd(): NULL parameter given\n");
    exit( EXIT_INTERNAL_ERR);
  }

  // parse size parameter
  if ( (cp=strstr( (char*)inLineBuffer, YENC_END_PARM_SIZE)) == NULL ) {
    printfError( "'%s' not found in end line (%s)\n",
                 YENC_END_PARM_SIZE, getPosDescr( inLineNum, inPartEntry, inFileEntry));
    // we have not written anything yet, so only set 
    // the part to corrupted and not the whole file
    //inPartEntry->isCorrupted = true;
    //return false;
  }
  inPartEntry->sizeExpected = atol( cp+strlen( YENC_END_PARM_SIZE));
  // size of part must always match
  if ( inPartEntry->sizeExpected != inPartEntry->sizeWritten ) {
    printfError( "Part size mismatch (%s)\n",
                 getPosDescr( inLineNum, inPartEntry, inFileEntry));
    // we have not written anything yet, so only set 
    // the part to corrupted and not the whole file
    //inPartEntry->isCorrupted = true;
    //return false;
  }
  // with single part while file size must match
  if ( ! inFileEntry->isMultipart && inPartEntry->sizeExpected != inFileEntry->size ) {
    printfError( "Output file size mismatch (%s)\n",
                 getPosDescr( inLineNum, inPartEntry, inFileEntry));
    // we have not written anything yet, so only set 
    // the part to corrupted and not the whole file
    //inPartEntry->isCorrupted = true;
    // return false;
  }

  // do crc checks
  if ( inFileEntry->isMultipart )
    crcParamName = YENC_END_PARM_PCRC;
  else
    crcParamName = YENC_END_PARM_CRC;
  if ( (cp=strstr( (char*)inLineBuffer, crcParamName)) == NULL ) {
    printfError( "'%s' not found in end line (%s)\n",
                 crcParamName, getPosDescr( inLineNum, inPartEntry, inFileEntry));
    // we have not written anything yet, so only set 
    // the part to corrupted and not the whole file
    // inPartEntry->isCorrupted = true;
    // return false;
  }
  crc32=hexToUlong( cp+strlen( crcParamName));
  if ( crc32 != (inPartEntry->crcCalculated ^ 0xFFFFFFFFl) ) {
    printfError( "CRC mismatch (%s)\n",
                 getPosDescr( inLineNum, inPartEntry, inFileEntry));
    // we have not written anything yet, so only set 
    // the part to corrupted and not the whole file
    //inPartEntry->isCorrupted = true;
    //return false;
  }

  return true;
}

void ydecodeFile( const char* inPartFile)
{
  unsigned char          *lineBuffer, *writeBuffer, *copyBuffer;
  unsigned char          c, *srcPtr, *dstPtr;
  struct yencPartEntry   *partEntry;
  struct yencFileEntry   *fileEntry;
  unsigned long          writeSize;
  unsigned long          lineNum;
  FILE                   *fIn, *tmpFile;

  if ( inPartFile==NULL ) {
    printfError( "Unexpected internal error in ydecodeFile(): NULL parameter given\n");
    exit( EXIT_INTERNAL_ERR);
  }

  // open input file
  if ( strcmp( inPartFile, "-") == 0 ) {
    fIn = stdin;
  }
  else if ( (fIn=fopen( inPartFile, "rb")) == NULL ) {
    printfPerror( errno, "Unable to open input file '%s'\n", inPartFile);
    return;
  }

  lineBuffer  = calloc_check( 1, LINE_BUFFER_LENGTH);
  writeBuffer = calloc_check( 1, LINE_BUFFER_LENGTH);

  lineNum = 0;
  while ( true ) {  // iterate over every line in input file

    if ( fgets_cr( lineBuffer, LINE_BUFFER_LENGTH, fIn) == NULL )  goto cleanup;  // read next line until eof
    lineNum++;
  
    // search until beginning found
    if ( strncmp( (char*)lineBuffer, YENC_KEY_BEGIN, strlen( YENC_KEY_BEGIN)) ) continue;
  
    // start of a section found => new part begins
    partEntry = newPartEntry( inPartFile, lineNum);
  
    if ( (fileEntry=parseYencBegin( lineBuffer, lineNum, partEntry)) == NULL ) continue;

    // when its multipart, lets parse the corresponding ypart line
    if ( fileEntry->isMultipart ) {
      if ( fgets_cr( lineBuffer, LINE_BUFFER_LENGTH, fIn) == NULL ) {
        printfError( "Unexpected end of file (%s)\n", 
                     getPosDescr( lineNum, partEntry, fileEntry));
        // we have not written anything yet, so only set 
        // the part to corrupted and not the whole file
       // partEntry->isCorrupted = true;
       // goto cleanup;
      }
      lineNum++;

      if ( parseYencPart( lineBuffer, lineNum, partEntry, fileEntry) == false ) continue;
    }
    else {
      // the parts end must be set manually with single part!
      partEntry->posEnd = fileEntry->size;
    }

    if ( partEntry->isCorrupted || fileEntry->isCorrupted ) continue;

    // first decode the part to a tmp file
    // if it is sane we will write it to the output file later
    if ( (tmpFile=tmpfile()) == NULL ) {
      printfPerror( errno, "Cannot open temporary file (%s)\n",
                    getPosDescr( lineNum, partEntry, fileEntry));
      // we have not written anything yet, so only set 
      // the part to corrupted and not the whole file
      //partEntry->isCorrupted = true;
      // continue; // search for new beginning
    }

    while ( true ) { // iterate over lines containing encoded data

      if ( fgets_cr( lineBuffer, LINE_BUFFER_LENGTH, fIn) == NULL ) {
        printfError( "Unexpected end of file (%s)\n", 
                     getPosDescr( lineNum, partEntry, fileEntry));
        //partEntry->isCorrupted = true;
        //goto cleanup;
      }
      lineNum++;
      
      if ( ! strncmp( (char*)lineBuffer, YENC_KEY_END, strlen( YENC_KEY_END)) ) break;

      srcPtr    = lineBuffer;
      dstPtr    = writeBuffer;
      writeSize = 0;
      while( (c=*srcPtr++) ) {  // iterate over chars in a line
        if (c == '=') c = *srcPtr++ - 64;  // The escape character comes in
        c -= 42; // Subtract the secret number
        crcAdd( &(partEntry->crcCalculated), c);
        *dstPtr++ = c;
        writeSize++;
      } // end iterating over chars in a line

      if ( fwrite( writeBuffer, writeSize, 1, tmpFile) != 1 ) {
        printfPerror( errno, "Error writing to temporary file (%s)\n", 
                      getPosDescr( lineNum, partEntry, fileEntry));
        break;
      }
      partEntry->sizeWritten += writeSize;

    } // end iterating over lines containing encoded data

    if ( parseYencEnd( lineBuffer, lineNum, partEntry, fileEntry) == false ) {
      fclose( tmpFile); // automatically also removes file in case of tmpfile
      // we have not written anything yet, so only set 
      // the part to corrupted and not the whole file
      //partEntry->isCorrupted = true;
     // continue; // search for new beginning
    }

    // seek to destination pos in output file
    if ( fileEntry->fileStream != NULL ) {
      if ( fseek( fileEntry->fileStream, partEntry->posBegin, SEEK_SET) ) {
        printfPerror( errno, "File %s: Cannot seek to destination position\n", inPartFile);
        fclose( tmpFile); // automatically also removes file in case of tmpfile
        setFileCorrupted( fileEntry);
        continue; // search for new beginning
      }
    }

    // now that we have a correctly decoded part, try to copy it to output file
    rewind( tmpFile);
    copyBuffer = calloc_check( 1, COPY_BUFFER_SIZE);
    while( (writeSize=fread( copyBuffer, 1, COPY_BUFFER_SIZE, tmpFile)) ) {
      if ( fwrite( copyBuffer, 1, writeSize, fileEntry->fileStream) != writeSize ) {
        break;
      }
    }
    free( copyBuffer);

    // what was the reason for exiting the copy loop? Did we read all the tmp file?
    if      ( ! feof( tmpFile) ) {
      printfPerror( ferror( tmpFile), "Error reading from temp file (%s)\n", 
                    getPosDescr( lineNum, partEntry, fileEntry));
      // now that we have writen junk, we have to give up this output file
      setFileCorrupted( fileEntry);
    }
    // what was the reason for exiting the copy loop? was it a read error?
    else if ( ferror( fileEntry->fileStream) ) {
      printfPerror( ferror( fileEntry->fileStream), "Error writing to outfile (%s)\n", 
                    getPosDescr( lineNum, partEntry, fileEntry));
      // now that we have writen junk, we have to give up this output file
      setFileCorrupted( fileEntry);
    }
    
    fclose( tmpFile); // automatically also removes file in case of tmpfile

  } // end iterate over every line in input file

cleanup:
  fclose( fIn);
  free( lineBuffer);
  free( writeBuffer);

}


//--------------------------------------------------------------------------------------------------
//
// part range checking functions
//

struct rangeEntry *rangeListFindEntry( struct rangeEntry *inRangeList, const unsigned long inPos)
{
  struct rangeEntry *tmpEntry;

  if ( inRangeList==NULL ) {
    printfError( "Unexpected internal error in rangeListFindEntry(): NULL parameter given\n");
    exit( EXIT_INTERNAL_ERR);
  }

  tmpEntry = inRangeList;
  while( tmpEntry != NULL ) {
    if ( tmpEntry->start<=inPos && tmpEntry->end>=inPos )
      return tmpEntry;
    tmpEntry = tmpEntry->nextEntry;
  }
  printfError( "Internal error in rangeListFindEntry(): value out of range\n");
  exit( EXIT_INTERNAL_ERR);
  return NULL; // just to satisfy compiler
}

void rangeListJoinRange( struct rangeEntry *inRangeList, 
                         const unsigned long inLeftPos,
                         const unsigned long inRightPos)
{
  struct rangeEntry *tmpEntry, *leftEntry, *rightEntry;

  if ( inRangeList==NULL ) {
    printfError( "Unexpected internal error in rangeListJoinRange(): NULL parameter given\n");
    exit( EXIT_INTERNAL_ERR);
  }

  leftEntry  = rangeListFindEntry( inRangeList, inLeftPos);
  rightEntry = rangeListFindEntry( inRangeList, inRightPos);

  if ( leftEntry->isCorrupted != rightEntry->isCorrupted ) {
    printfError( "Internal error in rangeListJoinRange(): differing values in join\n");
    exit( EXIT_INTERNAL_ERR);
  }

  if ( leftEntry == rightEntry ) return;

  tmpEntry = leftEntry;
  while( (tmpEntry=tmpEntry->nextEntry) != rightEntry ) { free( tmpEntry); }
  
  leftEntry->end       = rightEntry->end;
  leftEntry->nextEntry = rightEntry->nextEntry;
  free( rightEntry);
}

void rangeListSplitLeft( struct rangeEntry *inRangeList, const unsigned long inPos)
{
  struct rangeEntry *newEntry, *theEntry;
  
  if ( inRangeList==NULL ) {
    printfError( "Unexpected internal error in rangeListSplitLeft(): NULL parameter given\n");
    exit( EXIT_INTERNAL_ERR);
  }

  theEntry  = rangeListFindEntry( inRangeList, inPos);

  if ( theEntry->start != inPos ) {
    newEntry = calloc_check( 1, sizeof( struct rangeEntry));
    newEntry->start       = inPos;
    newEntry->end         = theEntry->end;
    newEntry->nextEntry   = theEntry->nextEntry;
    newEntry->isCorrupted = theEntry->isCorrupted;
    theEntry->end         = inPos-1;
    theEntry->nextEntry   = newEntry;
  }

}

void rangeListSplitRight( struct rangeEntry *inRangeList, const unsigned long inPos)
{
  struct rangeEntry *newEntry, *theEntry;
  
  if ( inRangeList==NULL ) {
    printfError( "Unexpected internal error in rangeListSplitRight(): NULL parameter given\n");
    exit( EXIT_INTERNAL_ERR);
  }

  theEntry  = rangeListFindEntry( inRangeList, inPos);

  if ( theEntry->end != inPos ) {
    newEntry = calloc_check( 1, sizeof( struct rangeEntry));
    newEntry->start       = inPos+1;
    newEntry->end         = theEntry->end;
    newEntry->isCorrupted = theEntry->isCorrupted;
    newEntry->nextEntry   = theEntry->nextEntry;
    theEntry->end         = inPos;
    theEntry->nextEntry   = newEntry;
  }

}

void checkFiles( struct yencFileEntry *inFileList)
{
  struct stat            statInfo;
  struct yencFileEntry   *theFile;
  struct yencPartEntry   *thePart;
  struct rangeEntry      *rangeList, *tmpEntry;
  bool                   isCorrupted, needLeftSplit, needRightSplit;

  // a null parameter is not an error this case, we might have processed no files

  theFile = inFileList;
  while( theFile != NULL ) {

    printfDebug( DEBUG_RANGE_CHECKS, "checkFiles(): checking file '%s'\n", theFile->destFile);

    if ( theFile->isCorrupted ) {
      theFile = theFile->nextFile;
      continue;
    }

    fclose( theFile->fileStream);
    theFile->fileStream = NULL;

    // check if dest file exists
    if ( stat( theFile->destFile, &statInfo) != 0 ) {
      printfPerror( errno, "Output file '%s' disappeared\n", theFile->destFile);
    }

    rangeList              = calloc_check( 1, sizeof( struct rangeEntry));
    rangeList->start       = 0L;
    rangeList->end         = 0xffffffffL;
    rangeList->isCorrupted = true;

    thePart                = theFile->partList;
    while( thePart != NULL ) {

      // remember: if the part is corrupted, it was not written to output file
      //           therefore we do not have to take it into account
      if ( thePart->isCorrupted ) {
        thePart = thePart->nextPart;
        continue;
      }

      // Always seperate checks from actual splitting !!!!
      // Otherwise the whole algorithm fails!
      needLeftSplit  =  rangeListFindEntry( rangeList, thePart->posBegin)->isCorrupted != thePart->isCorrupted;
      needRightSplit =  rangeListFindEntry( rangeList, thePart->posEnd)->isCorrupted != thePart->isCorrupted;

      if ( needLeftSplit )   rangeListSplitLeft( rangeList, thePart->posBegin);
      if ( needRightSplit )  rangeListSplitRight( rangeList, thePart->posEnd);

      rangeListFindEntry( rangeList, thePart->posBegin)->isCorrupted = thePart->isCorrupted;
      rangeListFindEntry( rangeList, thePart->posEnd)->isCorrupted   = thePart->isCorrupted;

      rangeListJoinRange( rangeList, thePart->posBegin, thePart->posEnd);

      thePart = thePart->nextPart;
    }

    // print summary of bogus parts
    tmpEntry    = rangeList;
    isCorrupted = false;
    while( tmpEntry != NULL ) {
      if ( tmpEntry->isCorrupted == true ) {
       // isCorrupted = true;
        printfError( "Corrupted byte range in file '%s': %d - %d\n", 
                     theFile->destFile, tmpEntry->start, tmpEntry->end);
      }
      if ( tmpEntry->start<=theFile->size-1 && tmpEntry->end>=theFile->size-1 )
        break;
      tmpEntry = tmpEntry->nextEntry;
    }

    free( rangeList);

    // if file does not  match in size theres no rescue any more
    // remember: we only have copied valid parts to it so the size must be correct
    if ( statInfo.st_size != theFile->size ) {
      printfError( "Output file '%s' too short, is %ld Bytes (%ld Bytes expected)\n", 
                   theFile->destFile, statInfo.st_size, theFile->size);
     // isCorrupted = true;
    }

    if ( isCorrupted ) {
      setFileCorrupted( theFile);
    }

    theFile = theFile->nextFile;
  }
}


//--------------------------------------------------------------------------------------------------
//
// infromal output stuff
//

void printSummary( struct yencFileEntry *inFileList)
{
  struct yencFileEntry   *theFile;
  struct yencPartEntry   *thePart;
  unsigned long          partsCnt, partsCorruptedCnt;
  unsigned long          totPartsCnt=0, totPartsCorruptedCnt=0;
  unsigned long          outfileCnt=0, outfileCorruptedCnt=0;

  // a null parameter is not an error this case, we might have processed no files

  theFile = inFileList;
  while( theFile != NULL ) {

    outfileCnt++;
    if ( theFile->isCorrupted ) outfileCorruptedCnt++;

    printfMessage( "----\n");
    printfMessage( "Output file:     '%s'\n", theFile->destFile);
    printfMessage( "  status:        %s\n", 
                   theFile->wasIgnored ? "Ignored" : theFile->isCorrupted ? "Corrupted" : "OK");

    if ( theFile->wasIgnored ) {
      theFile = theFile->nextFile;
      continue;
    }

    printfMessage( "  expected size: %ld\n", theFile->size);
    printfMessage( "  message type:  %s\n", theFile->isMultipart ? "Multi part" : "Single part");
    printfMessage( "  processed parts:\n");

    partsCnt          = 0;
    partsCorruptedCnt = 0;
    thePart           = theFile->partList;
    while( thePart != NULL ) {

      partsCnt++;
      if ( thePart->isCorrupted ) partsCorruptedCnt++;

      printfMessage( "    From input file '%s':,\n", thePart->fileName);
      printfMessage( "      part number: %d, status: %s,\n", 
                     thePart->partNum, thePart->isCorrupted ? "Corrupted" : "OK");
      printfMessage( "      start line: %ld, start: %ld, end: %ld,\n", 
                     thePart->startLine, thePart->posBegin, thePart->posEnd);
      printfMessage( "      size expected: %ld, size written: %ld\n", 
                     thePart->sizeExpected, thePart->sizeWritten);

      thePart = thePart->nextPart;
    }

    totPartsCnt          += partsCnt;
    totPartsCorruptedCnt += partsCorruptedCnt;

    printfMessage( "  parts:           %ld\n", partsCnt);
    printfMessage( "  parts ok:        %ld\n", partsCnt-partsCorruptedCnt);
    printfMessage( "  parts corrupted: %ld\n", partsCorruptedCnt);

    theFile = theFile->nextFile;
  }

  printfMessage( "====\n");
  printfMessage( "Total parts:                  %ld\n", totPartsCnt);
  printfMessage( "Total parts ok:               %ld\n", totPartsCnt-totPartsCorruptedCnt);
  printfMessage( "Total parts corrupted:        %ld\n", totPartsCorruptedCnt);
  printfMessage( "Total output files:           %ld\n", outfileCnt);
  printfMessage( "Total output files ok:        %ld\n", outfileCnt-outfileCorruptedCnt);
  printfMessage( "Total output files corrupted: %ld\n", outfileCorruptedCnt);
}

void printHelp()
{
  printfMessage( "%s [options] [files]\n", PROGRAM_NAME);
  printfMessage( "\n");
  printfMessage( "  Version: %s\n", PROGRAM_VERSION);
  printfMessage( "\n");
  printfMessage( "  Decode yenc encoded files\n");
  printfMessage( "\n");
  printfMessage( "  Options: %cD path   Set output directory to path.\n", CMDLINE_OPTION_ESCAPE);
  printfMessage( "           %ck        Keep output files even when corrupted.\n", CMDLINE_OPTION_ESCAPE);
  printfMessage( "           %cv        Give a verbose summary of what has happened.\n", CMDLINE_OPTION_ESCAPE);
  printfMessage( "           %cd level  Enable debugging output.\n", CMDLINE_OPTION_ESCAPE);
  printfMessage( "\n");
  printfMessage( "  Files: List of files to decode.\n");
  printfMessage( "         File name '-' means stdin.\n");
  printfMessage( "         When no filename is given, stdin is assumed.\n");
  printfMessage( "\n");
  printfMessage( "  Written by Juergen Helbing and Harald Roelle\n");
  printfMessage( "  For further information please look at http://www.yenc.org\n");
  exit( EXIT_CMDLINE_PARAM_ERR);
}


//--------------------------------------------------------------------------------------------------
//
// main
//

int main( int argc, char *argv[])
{
  struct inFileEntry   *inFileList = NULL;  // chained list of input files
  struct inFileEntry   *tmpInFile;
  struct inFileEntry   **lastFilePtr = &inFileList;
   

  g_outputDir = "/home/ubuntu/webroot/shadow.net/client/ydec/";

  // parse command line arguments
  while ( --argc > 0 ) {
    ++argv;

    // check for options
    if ( strlen( *argv)>1 && **argv==CMDLINE_OPTION_ESCAPE ) {

      if      ( strcmp( "d", (*argv)+1) == 0 ) {
        if ( --argc == 0 ) printHelp();
        g_debugLevel = atoi( *++argv);
      }

      else if ( strcmp( "D", (*argv)+1) == 0 ) {
        if ( --argc == 0 ) printHelp();
        ++argv;
        g_outputDir = calloc_check( 1, strlen( *argv)+2); //enough space for path seperator and null char
        strcpy( g_outputDir, *argv);
        if ( g_outputDir[strlen( *argv)-1] != PATH_SEP_CHAR )
          g_outputDir[strlen( *argv)] = PATH_SEP_CHAR;
      }

      else if ( strcmp( "k", (*argv)+1) == 0 ) {
        g_keepCorrupted = true;
      } 

      else if ( strcmp( "v", (*argv)+1) == 0 ) {
        g_beVerbose = true;
      } 

      else { 
        printHelp();
      }
    }
    // it must be a file
    else {
      // its REALLY vital to append it at the last position
      // otherwise the integrity check algorithm for parts
      // will not be consistent with command line order of files given
      *lastFilePtr             = calloc_check( 1, sizeof( struct inFileEntry));
      (*lastFilePtr)->fileName = *argv;
      lastFilePtr              = &((*lastFilePtr)->nextFile);
    }
  }

  // (roelle):
  //
  // Juergen, on win32 here should go the parsing of the arguments
  // to handle '*' and so on. Just building a list like done in the block above
  // should be sufficient.
  //
  // In case of D'nD we should set g_outputDir like if the -D options was given,
  // then output files will go in the same dir like input ones.
  // Does anyone know how to detect a D'nD call versus a cmdline call on windows?
  // In case of windows only, maybe we should assume D'nD when all files share the
  // same prefix and set g_outputDir to this prefix.
  //
  // Also all the message box stuff is still messing.


  // when no input file given, assume stdin
  if ( inFileList == NULL ) {
    inFileList = calloc_check( 1, sizeof( struct inFileEntry));
    strcpy_malloc( &(inFileList->fileName), "-");
  }

  // process input files
  tmpInFile = inFileList;
  while( tmpInFile != NULL ) {
    ydecodeFile( tmpInFile->fileName);
    tmpInFile = tmpInFile->nextFile;
  }

  // check the written files
  checkFiles( g_yencFileList);

  // verbose summary
  if ( g_beVerbose ) printSummary( g_yencFileList);

  return g_errCnt ? EXIT_ERROR : EXIT_OK;
}


