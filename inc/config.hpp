#pragma once

#include "EthLayer.h"
#include "IPv4Layer.h"
#include "config.json.hpp"

/// @defgroup config config
/// @{

/// @name mac/ip
/// @{
#define BROADCAST "ff:ff:ff:ff:ff:ff"
#define SENDMAC "e8:eb:d3:93:42:98"
#define SENDIP "10.120.101.111"
#define SENDIP_BYTES \
    { 10, 120, 101, 111 }
// #define SENDMAC2 "e8:eb:d3:93:42:99"
#define RECVMAC "e8:eb:d3:93:42:91"
#define RECVIP "10.120.101.11"
#define RECVIP_BYTES \
    { 10, 120, 101, 11 }
/// @}

/// starting UDP port
#define UDP_PORT 40000
/// number of UDP ports
#define UDP_COUNT 1
/// test data payload size
#define DATA_SIZE 1400
/// test packets count
// #define DATA_PACKS 1000
/// split recv UDP ports / cores
#define SPLIT 24
/// limit count of sent packets on single `send` command
#define PACKS_LIMIT 100000000UL

/// @name constant send/recv addresses
/// @{

extern pcpp::MacAddress sendMac;
extern pcpp::IPv4Address sendIp;
extern pcpp::MacAddress recvMac;
extern pcpp::IPv4Address recvIp;
/// @}

extern FIFO<pcpp::MBufRawPacket *> fifo;
extern void slicer();
extern void sender();

/// @}
