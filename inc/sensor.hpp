#pragma once

#include "app.hpp"

/// @brief UDP port configuration (send/recv)
struct UDP {
    pcpp::IPv4Address ip;  ///< IPV4
    uint16_t port;         ///< UDP port
};

/// @brief single @ref sensor configuration
struct SENSOR {
    std::string name;      ///<
    UDP src;               ///< @ref UDP for sender
    UDP dst;               ///< @ref UDP for receiver
    uint32_t sn;           ///< serial number
    std::string dataPath;  ///< file path for precomputed data

    /// @name precompiled data
    /// @{
    uint8_t* start;   ///<
    uint8_t* end;     ///<
    uint size;        ///< whole file size, bytes
    uint packetSize;  ///< single packet size, bytes
    uint packets;     ///< number of packets/data file
    uint16_t freq;    ///< poll frequency

    /// @}

    uint8_t* data;  ///< data read pointer
};
