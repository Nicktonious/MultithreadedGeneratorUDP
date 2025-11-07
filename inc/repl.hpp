#pragma once

/// @defgroup repl repl
/// @brief interactive command line
/// @{
/// @}
class REPL {
    static int queryId;         ///< autoincremented command/query id
    static char ps[];           ///< @ref quaryId `>`
    static char *command;       ///< input buffer
    static void parse(char *);  ///< code implemented in .lex
    static char file[];

   public:
    static void repl();     ///< interactive command console
    static void incId();    ///< increment @ref queryId & reformat @ref ps
    static void restart();  ///< restart active REPL
    static void exit();     ///< stop `send`
};

extern REPL repl;  ///< singleton: command line shell
