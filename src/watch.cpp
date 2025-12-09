#include "watch.hpp"

std::vector<std::thread *> Watch::threads;

void Watch::init(int argc, char *argv[]) {
    signal(SIGINT, Watch::signal_handler);
    for (int i = 0; i < argc; i++)
        threads.push_back(new std::thread(Watch::watch, i, argv[i]));
}

void Watch::signal_handler(int signal) {
    fprintf(stderr,"'\n\nsignal:%i\n\n",signal);
    switch (signal) {
        case SIGSTOP:
            std::cerr << "\nSIGSTOP\n";
            Config::stop();
            break;
        case SIGINT:  // Ctrl+C
            std::cerr << "\nSIGINT: Interrupted! (Ctrl+C pressed)\n";
            Config::stop();
            break;
        case SIGKILL:  // kill -9
            std::cerr << "\nSIGKILL\n";
            Config::stop();
            break;
        case SIGTERM:  // async stop program
            std::cerr << "\nSIGKILL\n";
            Config::stop();
            break;
    }
}

void Watch::watch(int argc, char *argv) {
    int fd = inotify_init();
    inotify_add_watch(fd, argv, IN_ALL_EVENTS);
    /// wait
    char buf[1024];
    read(fd, buf, sizeof(buf));
    /// terminate
    Dev::stop();
    // restart process using make loop
    exit(1);
}
