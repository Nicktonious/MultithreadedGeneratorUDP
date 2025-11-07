#pragma once
/// @defgroup sensor sensor
/// @brief sensor
/// @{

#include "net.hpp"
#include "ring.hpp"

/// @brief single @ref sensor configuration
struct SENSOR {
    std::string name;  ///<
    UDP src;           ///< @ref UDP for sender
    UDP dst;           ///< @ref UDP for receiver
    uint32_t sn;       ///< serial number
    path dataPath;     ///< file path for precomputed data

    /// @name precompiled data
    /// @{
    uint8_t* start;   ///<
    uint8_t* end;     ///<
    uint size;        ///< whole file sizem, bytes
    uint packetSize;  ///< single packet size, bytes
    uint packets;     ///< number of packets/data file
    /// @}

    /// @name object operations
    /// @{
    FILE* fh;      ///< data file handler
    void init();   ///< preload sensor state after program startup
    void check();  ///< check file data correctness (sizes, headers,..)

    /// @name DPDK workers
    /// @{
    Ring<pcpp::RawPacket> ring;  ///< r/w ring buffer
    void slicer();               ///< split .gen data into UDP/Ethernet frames
    void sender();               ///< @ref pcpp::SendPackets from @ref ring

    /// @}
    /// @}
};

/// @}
