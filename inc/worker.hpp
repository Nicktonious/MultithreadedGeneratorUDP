#pragma once

#include "net.hpp"

/// @brief common worker model
class Worker : public pcpp::DpdkWorkerThread {
    friend Net;

    pcpp::DpdkDevice *dev;  ///< transmitting device
    std::chrono::time_point<std::chrono::steady_clock>
        _loop_start;  ///< loop start time marker

   protected:
    static std::vector<pcpp::DpdkWorkerThread *> threads;
    // static Worker *singleton;  ///< single instance

    /// @name workers config
    /// @{
    int data_packs;  ///< data send group size, raw packets
    long interval;   ///< send sheduling interval, milliseconds

    /// @}

    bool _stop;                 ///< stop worker flag
    pcpp::Packet packet;        ///< semi-constant Gratuitous ARP
    pcpp::EthLayer *eth_layer;  ///< Ethernet layer for single frame making

   public:
    static const pcpp::CoreMask coreMask = 0;  ///< core mask for sender's group
    uint32_t coreid;                           ///< bounded CPU core
    uint32_t getcpu;  ///< CPU core via `sched_getcpu()` call
    /// @name counters
    /// @{
    size_t count;  ///< send packets count (zeroed every seond)
    size_t total;  ///< total packets count @ref PACKS_LIMIT
    size_t runs;   ///< count number of @ref run loops

    /// @}

    Worker(pcpp::DpdkDevice *dev, long interval,
           int data_packs = 1);  ///< worker preinit
    bool run(uint32_t coreid);   ///< run worker
    void stop();                 ///< stop worker (async)
    uint32_t getCoreId() const;  ///< get CPU core bound
    bool schedule();             ///< wait until next send shedule
    virtual std::string tag();   ///< worker class tag
};
