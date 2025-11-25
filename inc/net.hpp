#pragma once

#include "libc.hpp"

/// @defgroup net net
/// @brief raw networking config

#include "DpdkDeviceList.h"
#include "EthLayer.h"
#include "IPv4Layer.h"
#include "PayloadLayer.h"
#include "SystemUtils.h"
#include "UdpLayer.h"
// #include "DpdkDevice.h"
// #include "IpAddress.h"
// #include "MacAddress.h"
// #include "Packet.h"
// #include "PcapLiveDeviceList.h"
// #include "RawPacket.h"

/// single packet size, bytes

/// standard IP transfer unit
#define MTU 1500
/// frame transfer unit: (MTU-8-20)
#define FTU 1400
// (MTU - sizeof(pcpp::udphdr) - sizeof(pcpp::iphdr))

/// *More Fragments*: fragmentation flag mask
#define MF_flag 0b00100000

/// @ingroup net
class Net {
    static uint8_t coreNum;          ///< number of cores
    static pcpp::CoreMask coreMask;  ///< mask of cores load

   public:
    static pcpp::DpdkDevice *dev;         ///< DPDK device
    static void init(bool dpdk = false);  ///< initialize DPDK & hw config
    static void list();                   ///< list known NIC's
    static void open(int port);           ///< open DPDK device by port id
    static void start();                  ///< start traffic generation
    static void stop();                   ///< stop traffic generation
    static void garp();                   ///< start @reg GARP worker
    static void send();                   ///< start @reg Send worker
};
