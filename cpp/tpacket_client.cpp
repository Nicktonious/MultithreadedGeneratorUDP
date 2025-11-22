#include "tpacket_client.h"
#include "tx_ring.h"
#include <iostream>
#include <cstring>
#include <algorithm>

TPacketClient::TPacketClient(const std::string& interface, 
                           unsigned int frame_size, 
                           unsigned int frame_nr)
    : interface_name_(interface)
    , frame_size_(frame_size)
    , frame_nr_(frame_nr)
    , ring_(nullptr) {
}

TPacketClient::~TPacketClient() {
    shutdown();
}

bool TPacketClient::initialize() {
    if (ring_) {
        std::cout << "TPacketClient already initialized" << std::endl;
        return true;
    }
    
    if (!initializeRing()) {
        std::cerr << "Failed to initialize TX ring on interface: " << interface_name_ << std::endl;
        return false;
    }
    
    std::cout << "TPacketClient initialized successfully" << std::endl;
    std::cout << "Interface: " << interface_name_ 
              << ", Frame size: " << frame_size_ 
              << ", Frame count: " << frame_nr_ << std::endl;
    
    return true;
}

void TPacketClient::shutdown() {
    cleanup();
}

bool TPacketClient::initializeRing() {
    ring_ = tx_ring_init(interface_name_.c_str(), frame_size_, frame_nr_);
    return ring_ != nullptr;
}

void TPacketClient::cleanup() {
    if (ring_) {
        tx_ring_destroy(ring_);
        ring_ = nullptr;
    }
}

bool TPacketClient::preparePacketBuffer(const std::vector<std::vector<uint8_t>>& packets) {
    if (!ring_) {
        std::cerr << "TPacketClient not initialized. Call initialize() first." << std::endl;
        return false;
    }
    
    if (packets.empty()) {
        std::cerr << "Empty packets buffer provided" << std::endl;
        return false;
    }
    
    // Очищаем текущий буфер TX_RING, отправляя все pending фреймы
    tx_ring_send(ring_);
    
    // Заполняем TX_RING новыми пакетами
    size_t packets_committed = 0;
    
    for (const auto& packet : packets) {
        // Проверяем размер пакета
        if (packet.size() > frame_size_ - TPACKET_HDRLEN) {
            std::cerr << "Packet size " << packet.size() 
                      << " exceeds available frame space " 
                      << (frame_size_ - TPACKET_HDRLEN) << std::endl;
            continue;
        }
        
        // Получаем свободный фрейм
        uint8_t* frame_data = tx_ring_get_frame(ring_);
        if (!frame_data) {
            // Буфер полон - отправляем то, что уже подготовили
            std::cout << "TX ring full after " << packets_committed 
                      << " packets. Sending partial buffer..." << std::endl;
            break;
        }
        
        // Копируем пакет во фрейм
        memcpy(frame_data, packet.data(), packet.size());
        tx_ring_commit_frame(ring_, packet.size());
        packets_committed++;
    }
    
    std::cout << "Prepared " << packets_committed << " packets in TX ring" << std::endl;
    return packets_committed > 0;
}

bool TPacketClient::sendPreparedBuffer() {
    if (!ring_) {
        std::cerr << "TPacketClient not initialized" << std::endl;
        return false;
    }
    
    // Отправляем все подготовленные фреймы
    if (tx_ring_send(ring_) == -1) {
        std::cerr << "Failed to send prepared buffer" << std::endl;
        return false;
    }
    
    std::cout << "Sent prepared buffer successfully" << std::endl;
    return true;
}