#pragma once

#include <cstdint>
#include <string>
#include <vector>

// #include "DpdkDeviceList.h"
// #include "EthLayer.h"
#include "IPv4Layer.h"
// #include "PayloadLayer.h"
// #include "SystemUtils.h"
#include "UdpLayer.h"

/// @brief binary file path
typedef std::string path;

/// @brief UDP port configuration (send/recv)
struct UDP {
    pcpp::IPv4Address ip;  ///< IPV4
    uint16_t port;         ///< UDP port
};

#include "sensor.hpp"

/// @brief @ref SENSOR s group (single send with grouped packets)
struct GROUP {
    std::string name;              ///<
    uint duration;                 ///<
    bool loop;                     ///< repeat sending
    uint freq;                     ///<
    uint packetSize;               ///< UDP payload size, bytes
    std::vector<SENSOR*> sensors;  ///<
};

/// @brief statically-compiled configuration
/// @details `src/json2cpp.py` **config compiler** used in cmake build
struct CONFIG {
    uint baseCPUIndex;             ///< `=0` starting CPU core for DPDK
    std::vector<GROUP*> groups;    ///< sender groups
    std::vector<SENSOR*> sensors;  ///< list of all sensors in a system
    static void run();             ///< run preconfigured & static-compiled
};
