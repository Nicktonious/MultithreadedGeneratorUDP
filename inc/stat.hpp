#pragma once

#include "net.hpp"

/// worker:
class Stat : public Worker {
    static const int data_packs = 1;  ///< data send group size, raw packets

   public:
    static std::vector<pcpp::DpdkWorkerThread *> threads;
    /// core mask for @ref Stat worker
    static const pcpp::CoreMask coreMask = 0b1000000000;
    static void command();  ///< start subsystem from REPL
    Stat(pcpp::DpdkDevice *dev, long interval = 1000 * 1000 * 1000);
    bool run(uint32_t coreid);  ///< custom worker for statistics count
};
