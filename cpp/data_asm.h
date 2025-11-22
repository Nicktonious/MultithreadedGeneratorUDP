#pragma once

#include "work_args.h"
#include <string>
#include <vector>
#include <atomic>
#include <chrono>
#include <zmq.hpp>
#include <boost/interprocess/managed_shared_memory.hpp>
#include <boost/interprocess/sync/interprocess_mutex.hpp>
#include <boost/interprocess/sync/interprocess_condition.hpp>

namespace bip = boost::interprocess;

class DataAsm {
private:
    std::string clockAddress;
    std::string shmName;
    zmq::context_t zmqContext;
    zmq::socket_t clockSub;
    
    // Shared memory members
    bip::managed_shared_memory* segment;
    void* dataBuffer;
    uint32_t* messageCounter;
    std::atomic<bool>* stopFlag;
    bip::interprocess_mutex* mutex;
    bip::interprocess_condition* condition;
    
    // Data members
    // std::vector<std::string> sensorsInfo;
    std::atomic<bool> localStopFlag;
    size_t packetSize;
    size_t numSensors;
    
    // Performance tracking
    std::chrono::high_resolution_clock::time_point t0, t1;
    
    void Cleanup();

public:
    DataAsm(const WorkArgs& workerData, 
            const std::string& clockAddr, 
            const std::string& sharedMemName);
    ~DataAsm();
    
    bool Init();
    void Run(size_t packetSize);
    void Stop();
};
