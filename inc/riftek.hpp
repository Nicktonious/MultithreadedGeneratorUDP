#pragma once

#include <cstdint>

/// @defgroup riftek riftek
/// @brief data format specification
/// @{

/// @brief data type marker
enum class DATA_TYPE_MARKER : uint8_t {
    PLAIN_MEASURE = 0x10,  ///< @ref MEASURE plain measure
    PROFILE_POLY = 0x20,   ///< @ref PROFILE plain profile by poly
};

/// @brief Packet flags
struct __attribute__((packed)) PACKET_FLAG {
    uint8_t BRIGHTNESS_INCLUDED : 1;    ///< bit #0: included brightness data
    uint8_t INTERPOLATION_ENABLED : 1;  ///< bit #1: interpolation state
    uint8_t : 6;                        ///< reserved bits
};

struct __attribute__((packed)) PROTOCOL_VERSION {
    uint8_t Major;
    uint8_t Minor;
};

typedef int16_t X;   ///< X axes measure type
typedef uint16_t Z;  ///< Z axes measure type

/// X axes points
#define X_points 1296
/// Z axes points
#define Z_points 648

// frame size
enum class FRAME_SIZE {
    RF627 = 5248,
    RF631 = 18496,
};

/// @brief fixed @ref RIFTEK_HEADER size in bytes
#define RIFTEK_HEADER_SIZE 64

/// @brief RF62x lazer scaner package structure
struct __attribute__((packed)) RIFTEK_HEADER {
    DATA_TYPE_MARKER Data_type;  ///< @ref DATA_TYPE_MARKER
    PACKET_FLAG Flags;           ///<
    uint16_t Device_ID;          ///< = RF:627/631
    uint32_t Serial_number;      ///< serial #
    uint64_t System_time;        ///< starting of exposing, ns
    PROTOCOL_VERSION Protocol;   ///< @ref PROTOCOL_VERSION
    /// start address of hw paramas durin measure
    uint8_t Hardware_params_shift;
    uint8_t Data_shift;                 ///< start address of data in packet
    uint32_t Software_packets_counter;  ///< Seq number of emitted packet
    uint32_t Measures_counter;          ///< Counter of measures
    uint16_t ZMR;                       ///< Measurement range by Z, mm * 0.1
    uint16_t XEMR;  ///< Measurement range by X, end, mm * 0.1
    ///  Scaling factor to convert valuies, mm/descrete
    float Scaling_factor;
    uint16_t Alignment;
    uint8_t _reserved[6];
    uint32_t License_hash;   ///< Hash for checking the sw liocense
    uint32_t Exposure_time;  ///< CMOS exposure time,ns
    uint32_t Laser_value;    ///< Level of lazer powerer (ns?)
    uint32_t Step_counter;   ///< Step value in STEP/DIR mode, or encoder value
    uint8_t Dir;             ///< DiR value of STEP/DIR trigger mode, or ignored
    uint16_t Payload_size;  ///< Profile/measure data size (without header size)
    uint8_t Bytes_per_point;  ///< plain measure: =2 (u16 for Z), profile: =4
                              ///< ( @ref X, @ref Z )
};

struct __attribute__((packed)) MEASURE {
    Z z;
};

struct __attribute__((packed)) PROFILE {
    X x;
    Z z;
};

union __attribute__((packed)) DATA {
    MEASURE mp[Z_points];  ///< @ref MEASURE plain
    MEASURE mx[X_points];  ///< @ref MEASURE extended
    PROFILE pp[Z_points];  ///< @ref PROFILE plain
    PROFILE px[X_points];  ///< @ref PROFILE extended
};

struct __attribute__((packed)) RIFTEK {
    RIFTEK_HEADER header;
    DATA data;
};

extern void riftek(RIFTEK* packet);  ///< process RF627 measure packet

/// @}

/// @defgroup rf_config config
/// @ingroup riftek
/// @{

struct RF_CONFIG {
    uint16_t Device_ID;         ///< 631
    PROTOCOL_VERSION Protocol;  ///< 1.2
    bool Flags;                 ///< 0,
    uint32_t License_hash;      ///< 0,
    uint32_t Exposure_time;     ///< 200000,
    uint32_t Laser_value;       ///< 50,
    uint16_t Alignment;         ///< 0,
    float Scaling_factor;       ///< 0.02,
    uint16_t ZMR;               ///< 1600,
    uint16_t XEMR;              ///< 4600,
    uint8_t Bytes_per_point;    ///< 4,
    uint8_t _reserved[6];       ///< [0,0,0,0,0,0],
    uint16_t Points;            ///< 4608
};

/// @}
