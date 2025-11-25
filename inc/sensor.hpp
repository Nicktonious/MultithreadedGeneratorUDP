#pragma once
/// @defgroup sensor sensor
/// @brief sensor
/// @{

#include "fifo.hpp"
#include "net.hpp"

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
    uint size;        ///< whole file size, bytes
    uint packetSize;  ///< single packet size, bytes
    uint packets;     ///< number of packets/data file
    uint16_t freq;    ///< poll frequency
    /// @}

    /// @name object operations
    /// @{
    FILE* fh;      ///< data file handler
    void init();   ///< preload sensor state after program startup
    void check();  ///< check file data correctness (sizes, headers,..)

    /// @name DPDK workers
    /// @{
    FIFO<pcpp::MBufRawPacket*> fifo;  ///< ring buffer
    void slicer();         ///< split .gen data into UDP/Ethernet frames
    std::thread t_slicer;  ///<
    void sender();         ///< @ref pcpp::SendPackets from @ref ring
    std::thread t_sender;  ///<
    void yield();          ///< minimal delay for task yielding
    void sleep();          ///< config-predefined sleep for next packets send
    bool stop = false;     ///< stop flag
    void run();            ///< start sensor's threads
    void join();           ///< wait sensor's all threads stop
    /// @}
    /// @}

    /// @name statistics
    /// @{
    uint sent_packets = 0;                ///< sent packets counter
    uint sent_bytes = 0;                  ///< sent bytes counter
    static void stat();                   ///< stattistics counting thread
    static std::thread t_stat;            ///<
    static std::vector<SENSOR*> sensors;  ///< all sensors registry
    static uint total_packets;
    static uint total_bytes;
    /// @}
};

/// @}
