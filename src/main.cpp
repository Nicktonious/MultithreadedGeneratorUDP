#include "app.hpp"
#include "config.json.hpp"

std::thread *watcher[0x10];

void watch(int argc, char *argv[], char *filename) {
    int fd = inotify_init();
    inotify_add_watch(fd, argv[0], IN_ALL_EVENTS);
    /// wait
    char buf[1024];
    read(fd, buf, sizeof(buf));
    /// terminate
    /// stop network
    pcpp::DpdkDeviceList::getInstance().stopDpdkWorkerThreads();
    if (Net::dev) Net::dev->close();
    exit(0);
    // Restart process
    // char *args[argc + 1];
    // for (int i = 0; i < argc; i++) args[i] = argv[i];
    // args[argc] = nullptr;
    // execv(argv[0], args);
}

int main(int argc, char *argv[]) {  //
    arg(0, argv[0]);
    //
    signal(SIGINT, signal_handler);
    Files::watch(argc, argv);
    //
    Net::init(true);
    for (int i = 1; i < argc; i++) {  // drop .ini parsing
            arg(i, argv[i]);
    //     yyfile = argv[i];
    //     assert(yyin = fopen(yyfile, "r"));
    //     yyparse();
    //     fclose(yyin);
    //     yyfile = nullptr;
    }
    CONFIG::run();
    REPL::repl();
}

void arg(int argc, char *argv) {  //
    std::cerr << "arg[" << argc << "] = <" << argv << ">\n";
}

void signal_handler(int signal) {
    switch (signal) {
        case SIGSTOP:
            Net::stop();
            break;
        case SIGINT:  // Ctrl+C
            std::cerr << "\nInterrupted! (Ctrl+C pressed)\n";
            // REPL::restart();
            // break;
        case SIGKILL:
        case SIGTERM:  // async stop program
            exit(0);
    }
}
