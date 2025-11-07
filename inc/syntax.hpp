#pragma once

#include <readline/history.h>
#include <readline/readline.h>

#include "libc.hpp"

/// @defgroup syntax syntax
/// @brief command/syntax parser
/// @{
extern int yylex();                    ///< lexer
extern int yylineno;                   ///< line number
extern char *yyfile;                   ///< current file name
extern FILE *yyin;                     ///< file handler
extern char *yytext;                   ///< lexeme (token) string value
extern void parse(char *);             ///< parse string
extern int yyparse();                  ///< parser
extern void yyerror(const char *msg);  ///< syntax error callback
#include "send.yacc.hpp"
/// @}
