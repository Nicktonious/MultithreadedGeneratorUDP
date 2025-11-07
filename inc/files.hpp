#pragma once
/// @defgroup files files
/// @brief filesystem interface
/// @{

#include <thread>
#include <vector>

class Files {
    /// start watcher stop on file change
    static void _watch(int idx, char *filename);
    /// file wather threads
    static std::vector<std::thread *> _watch_t;

   public:
    /// watch on file changed: stop on config/binary/source change
    static void watch(int argc, char *argv[]);
};

/// @}
