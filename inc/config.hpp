#pragma once

#include "app.hpp"

#define BROADCAST "ff:ff:ff:ff:ff:ff"
#define SENDMAC "e8:eb:d3:93:42:98"
#define SENDIP "10.120.101.111"
#define RECVMAC "e8:eb:d3:93:42:91"
#define RECVIP "10.120.101.11"

class Config {
   public:
    static void init();
    static void stop();
};

/// @brief statically-compiled configuration
/// @details `src/json2cpp.py` **config compiler** used in cmake build
struct CONFIG {
    uint8_t baseCPUIndex;          ///< `=0` starting CPU core for DPDK
    std::vector<GROUP*> groups;    ///< sender groups
    std::vector<SENSOR*> sensors;  ///< list of all sensors in a system
};

extern CONFIG config;
