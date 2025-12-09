let doxygen () =
  Sys.command "doxygen -l" |> ignore;
  Sys.command "mv DoxygenLayout.xml doc/" |> ignore;
  Sys.command "cp ~/icons/control_64x64.png doc/logo.png" |> ignore;
  touch ".doxygen" ~c:("
PROJECT_NAME           = \""^app^"\"
PROJECT_BRIEF          = \""^title^"\"
PROJECT_LOGO           = doc/logo.png
LAYOUT_FILE            = doc/DoxygenLayout.xml
OUTPUT_DIRECTORY       = doc
HTML_OUTPUT            = html
INPUT                  = README.md doc inc src
INPUT                 += hw cpu arch os
INCLUDE_PATH           = inc
EXCLUDE                = ref/* lib/python* *.pdf *.djvu
WARN_IF_UNDOCUMENTED   = NO
RECURSIVE              = YES
USE_MDFILE_AS_MAINPAGE = README.md
GENERATE_LATEX         = NO
FILE_PATTERNS         += *.lex *.yacc *.ragel *.rl
EXTENSION_MAPPING      = lex=C++ yacc=C++ ragel=C++ rl=C++ ino=C++
HAVE_DOT               = YES
EXTRACT_ALL            = YES
EXTRACT_STATIC         = YES
EXTRACT_PRIVATE        = YES
EXTRACT_PACKAGE        = YES
EXTRACT_LOCAL_CLASSES  = YES
EXTRACT_LOCAL_METHODS  = YES
EXTRACT_ANON_NSPACES   = YES
SORT_GROUP_NAMES       = YES
REPEAT_BRIEF           = NO
CALL_GRAPH             = YES
CALLER_GRAPH           = YES
") ()

let doc () =
  mkd "doc" ~c:"html/\n!.gitignore\n" ();
  doxygen()
