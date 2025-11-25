#pragma once

// #include "app.hpp"
#include "net.hpp"
#include "worker.hpp"

/// @defgroup garp garp
/// @ingroup worker

/// worker: regular sending Gratuitous ARP annonsments
/// @ingroup garp
class GARP : public Worker {
    static const int data_packs = 1;  ///< data send group size, raw packets
    pcpp::ArpLayer *arp_layer;        ///<

   public:
    /// core mask for sender's group
    static const pcpp::CoreMask coreMask = 0b0100000000;
    static std::vector<pcpp::DpdkWorkerThread *> threads;
    static void command();  ///< start subsystem from REPL
    /// build @GARP worker -> @ref threads
    GARP(pcpp::DpdkDevice *dev, long interval = 1000UL * 1000 * 1000 * 5);
};
