#pragma once

#include "app.hpp"

/// @defgroup worker worker

/// @brief common worker model
/// @ingroup worker
class Worker : public pcpp::DpdkWorkerThread {
    friend class Dev;
    static std::vector<pcpp::DpdkWorkerThread *> threads;
    static uint32_t coreMask;

   protected:
    friend class Sender;
    pcpp::DpdkDevice *dev;
    bool _stop;
    uint32_t _coreId;
    static std::atomic<int> active;  ///< active workers count
    bool terminate();

   public:
    Worker(pcpp::DpdkDevice *dev);  ///< worker preinit
    bool run(uint32_t coreid);      ///< run worker
    void stop();                    ///< stop worker (async)
    static void wait_inactive();     ///< wait all threads stopped
    uint32_t getCoreId() const;     ///< get CPU core bound
    bool schedule();                ///< wait until next send shedule
    static bool any_started;        ///< flag shows any worker was started
};
