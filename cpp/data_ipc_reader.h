#pragma once

#include <string>
#include <vector>
#include <atomic>
#include <boost/interprocess/managed_shared_memory.hpp>
#include <boost/interprocess/sync/interprocess_mutex.hpp>
#include <boost/interprocess/sync/interprocess_condition.hpp>

namespace bip = boost::interprocess;

class DataReader {
private:
    bip::managed_shared_memory* segment;
    void* dataBuffer;
    uint32_t* messageCounter;
    std::atomic<bool>* stopFlag;
    bip::interprocess_mutex* mutex;
    bip::interprocess_condition* condition;
    uint32_t lastReadCounter;

public:
    DataReader();
    ~DataReader();
    
    bool Connect(const std::string& shmName);
    void Disconnect();
    bool ReadData(std::vector<uint8_t>& buffer, size_t expectedSize, int timeoutMs = 1000);
};
