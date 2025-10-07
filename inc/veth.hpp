#pragma once

#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <iostream>

/// @defgroup main main
/// @brief program init & command line
/// @{

/// @brief POSIX entry point
/// @param[in] argc arguments count
/// @param[in] argv arguments array (`argv[0]` = program/firmware name)
extern int main(int argc, char *argv[]);

/// @brief callback for processing command line / boot loader arguments
/// @param[in] argc argument index (0 = program/firmware name)
/// @param[in] argv argument string value
extern void arg(int argc, char *argv);

/// @}

#include <Logger.h>
#include <PcapPlusPlusVersion.h>
#include <SystemUtils.h>

#ifdef DPDK
#include <DpdkDeviceList.h>
#include <rte_eal.h>
#endif  // DPDK

#ifdef PCAP
#include <PcapLiveDevice.h>
#include <PcapLiveDeviceList.h>
#endif  // PCAP

/// @defgroup eth eth
/// @brief Ethernet NIC's
/// @{

#define DEFAULT_MBUF_POOL_SIZE 4095

/// @brief Ethernet NIC's
class Eth {
   public:
    static void init(int argc, char *argv[]);  ///< initialize network subsystem
    static void list();                        ///< list NIC's
    static void logger();                      ///< setup logger
    //     static void recv(std::string eth);  ///< run receiver on `<eth>` NIC
    //     static void send(std::string eth);  ///< run sender on `<eth>` NIC
};

/// @}
