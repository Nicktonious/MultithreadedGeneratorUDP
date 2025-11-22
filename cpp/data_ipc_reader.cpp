#include "data_reader.h"
#include <iostream>
#include <chrono>

DataReader::DataReader() 
    : segment(nullptr), dataBuffer(nullptr), messageCounter(nullptr),
      stopFlag(nullptr), mutex(nullptr), condition(nullptr), lastReadCounter(0) {
}

DataReader::~DataReader() {
    Disconnect();
}

bool DataReader::Connect(const std::string& shmName) {
    try {
        segment = new bip::managed_shared_memory(bip::open_only, shmName.c_str());
        
        // Find objects in shared memory
        auto counterPair = segment->find<uint32_t>("MessageCounter");
        auto flagPair = segment->find<std::atomic<bool>>("StopFlag");
        auto mutexPair = segment->find<bip::interprocess_mutex>("Mutex");
        auto conditionPair = segment->find<bip::interprocess_condition>("Condition");
        
        if (!counterPair.first || !flagPair.first || !mutexPair.first || !conditionPair.first) {
            std::cerr << "[Reader] Failed to find shared memory objects" << std::endl;
            Disconnect();
            return false;
        }
        
        messageCounter = counterPair.first;
        stopFlag = flagPair.first;
        mutex = mutexPair.first;
        condition = conditionPair.first;
        
        // Data buffer is anonymous, we'll access it via size calculation
        dataBuffer = segment->get_address_from_handle(segment->get_handle_from_address(segment->get_segment_manager()));
        
        std::cout << "[Reader] Connected to shared memory: " << shmName << std::endl;
        return true;
        
    } catch (const std::exception& e) {
        std::cerr << "[Reader] Connection error: " << e.what() << std::endl;
        return false;
    }
}

bool DataReader::ReadData(std::vector<uint8_t>& buffer, size_t expectedSize, int timeoutMs) {
    if (!segment || !mutex || !condition) return false;
    
    try {
        bip::scoped_lock<bip::interprocess_mutex> lock(*mutex);
        
        // Wait for new data with timeout
        auto timeoutTime = std::chrono::steady_clock::now() + std::chrono::milliseconds(timeoutMs);
        
        while (*messageCounter == lastReadCounter && !stopFlag->load()) {
            if (condition->wait_until(lock, timeoutTime) == bip::cv_status::timeout) {
                return false; // Timeout
            }
        }
        
        if (stopFlag->load()) {
            return false; // Writer stopped
        }
        
        // Calculate data buffer location (after synchronization objects)
        void* dataStart = static_cast<char*>(segment->get_address()) + 
                         sizeof(uint32_t) + sizeof(std::atomic<bool>) +
                         sizeof(bip::interprocess_mutex) + sizeof(bip::interprocess_condition);
        
        // Copy data from shared memory
        buffer.resize(expectedSize);
        std::memcpy(buffer.data(), dataStart, expectedSize);
        
        lastReadCounter = *messageCounter;
        return true;
        
    } catch (const std::exception& e) {
        std::cerr << "[Reader] Read error: " << e.what() << std::endl;
        return false;
    }
}

void DataReader::Disconnect() {
    if (segment) {
        delete segment;
        segment = nullptr;
    }
    dataBuffer = nullptr;
    messageCounter = nullptr;
    stopFlag = nullptr;
    mutex = nullptr;
    condition = nullptr;
}