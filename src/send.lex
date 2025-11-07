%{
    #include "app.hpp"
%}

%option noyywrap yylineno

%x comment                          

s  [+\-]
n  [0-9]
h2 [a-f0-9]{2}
d3 {n}{1,3}

%%
\#!.*               {}                  // #! shebang
\#.*                {}                  // # line comment

{s}?{n}+\.{n}+      {yylval.f = atof(yytext); return _NUM;}
{s}?{n}+            {yylval.n = atoi(yytext); return _INT;}

({h2}:){5}{h2}      {yylval.s = new std::string(yytext); return _MAC;}
({d3}+\.){3}{d3}+   {yylval.s = new std::string(yytext); return _IP ;}

"repl"              {return _REPL;}
"exit"              {return _EXIT;}
"restart"           {return _RESTART;}
"list"              {return _LIST;}
"open"              {return _OPEN;}
"garp"              {return _GARP;}
"send"              {return _SEND;}
"stat"              {return _STAT;}

[ \t\r\n]+          {}                  // drop spaces
.                   {yyerror("");}      // any undetected char

%%
/// current file name
char *yyfile = nullptr;

/// parse (and run) string as a command
void REPL::parse(char *source) {
    std::cerr << "\n[" << source << "]\n";
    YY_BUFFER_STATE buffer = yy_scan_string(source);
    yy_switch_to_buffer(buffer);
    yyparse();
    yy_delete_buffer(buffer);
}
