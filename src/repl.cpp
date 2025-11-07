#include "app.hpp"

int REPL::queryId = 0;

char REPL::ps[] = "\n123> ";

void REPL::incId() { sprintf(ps, "\n%.3i> ", ++queryId); }

char *REPL::command = nullptr;

char REPL::file[] = "repl";

void REPL::repl() {
    yyfile = file;
    while (true) {
        incId();
        yylineno = queryId;
        command = readline(ps);
        if (!command) break;
        if (*command) {
            add_history(command);
            REPL::parse(command);
        }
        free(command);
    }
}

void yyerror(const char *msg) {  //
    std::cerr << "\n\n"
              << yyfile << ':' << yylineno << ' ' << msg << " [" << yytext
              << "]\n\n";
    exit(EXIT_RESTART);
}

void REPL::exit() { ::exit(EXIT_OK); }

void REPL::restart() {
    // if (active) {
    //     rl_free_line_state();
    //     rl_cleanup_after_signal();
    //     incId();
    //     rl_replace_line(ps, 0);
    //     rl_redisplay();
    // }
    ::exit(EXIT_RESTART);
}
