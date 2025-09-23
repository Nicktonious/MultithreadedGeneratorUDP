#pragma once

#include "tx_ring.h"
#include <vector>
#include <cstdint>
#include <memory>
#include <string>

class TPacketClient {
private:
    tx_ring_t* ring_;
    std::string interface_name_;
    unsigned int frame_size_;
    unsigned int frame_nr_;
    
    // Внутренние методы
    bool initializeRing();
    void cleanup();

public:
    TPacketClient(const std::string& interface, 
                  unsigned int frame_size = 2048, 
                  unsigned int frame_nr = 1024);
    ~TPacketClient();
    
    // Инициализация/деинициализация
    bool initialize();
    void shutdown();
    
    // Подготовка буфера - принимает готовые пакеты в виде сырых данных
    bool preparePacketBuffer(const std::vector<std::vector<uint8_t>>& packets);
    
    // Отправка подготовленного буфера
    bool sendPreparedBuffer();
    
    // Статус
    bool isInitialized() const { return ring_ != nullptr; }
    unsigned int getFrameSize() const { return frame_size_; }
    unsigned int getFrameCount() const { return frame_nr_; }
};