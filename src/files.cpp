#include "app.hpp"

void Files::_watch(int argc, char *argv) {
    int fd = inotify_init();
    int wd = inotify_add_watch(fd, argv, IN_CLOSE_WRITE | IN_ATTRIB);
    char buf[1024];
    read(fd, buf, sizeof(buf));
    inotify_rm_watch(fd, wd);
    Net::stop();
    exit(1);
}

std::vector<std::thread *> Files::_watch_t;

void Files::watch(int argc, char *argv[]) {
    for (int i = 0; i < argc; i++)
        _watch_t.push_back(new std::thread(_watch, i, argv[i]));
}
