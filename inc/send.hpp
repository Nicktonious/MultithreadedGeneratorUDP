#pragma once

#include "config.hpp"
#include "worker.hpp"

/// @brief  are DPDK structures for holding packet data
/// @details It is recommended to set a size that is a power of 2 minus 1
#define MBUF_POOL_SIZE (0x10000 - 1)

/// worker: test traffic sender for single target UDP port
class Send : public Worker {
    pcpp::IPv4Layer *ipv4_layer;
    pcpp::UdpLayer *udp_layer;
    pcpp::PayloadLayer *payload_layer;
    static uint8_t test_data[DATA_SIZE];  ///< test data payload
                                          /// data send group size, raw packets

   public:
    static pcpp::CoreMask coreMask;  ///< core mask for sender's group
    static std::vector<pcpp::DpdkWorkerThread *> threads;
    /// start subsystem from REPL
    static void command(int threads = 1, int data_packs = 1,
                        long interval = 1000 * 1000 * 1000);
    Send(pcpp::DpdkDevice *dev, int shift = 0, int data_packs = 1,
         long interval = 1000 * 1000 * 1000);
};
