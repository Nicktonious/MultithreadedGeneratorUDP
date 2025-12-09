#pragma once

#include "app.hpp"

class Watch {
    /// file wather threads
    static std::vector<std::thread *> threads;
    /// start watcher stop on file change
    static void watch(int argc, char *argv);

   public:
    /// watch on file changed: stop on config/binary/source change
    static void init(int argc, char *argv[]);
    static void signal_handler(int signal);
};
