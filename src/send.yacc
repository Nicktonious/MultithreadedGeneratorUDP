%{
    #include "app.hpp"
%}

%defines %union { long n; double f; std::string *s; }

%token<n> _INT
%token<f> _NUM
%token<s> _STR
%token<s> _ID

%token _REPL _EXIT _RESTART
%token _LIST _OPEN _GARP _SEND _STAT

%token<s> _MAC _IP

%%
syntax: | syntax expr | syntax config | syntax net | syntax repl

expr    : _INT          { std::cerr << "int:" <<  $1 << "\n"; }
        | _NUM          { std::cerr << "num:" <<  $1 << "\n"; }
        | _STR          { std::cerr << "str:" << *$1 << "\n"; }
        | _ID           { std::cerr <<  "id:" << *$1 << "\n"; }

config  : _MAC          { std::cerr << "mac:" << *$1 << "\n"; }
        | _IP           { std::cerr <<  "ip:" << *$1 << "\n"; }

net     : _LIST         { Net::list();      } // `list` available DPDK NIC's
        | _OPEN _INT    { Net::open($2);    } // `open <nic>`
        | _GARP         { GARP::command();  } // `garp` run @ref GARP workers
        | _SEND _INT _INT _INT   { Send::command($2,$3,$4);} // `garp` run @ref Send workers
        | _STAT         { Stat::command();  } // `garp` run @ref Send workers

repl    : _REPL         { REPL::repl();     } // `repl` run REPL from .ini
        | _EXIT         { REPL::exit();     } // `exit` exit send'er
        | _RESTART      { REPL::restart();  } // `exit` exit send'er
