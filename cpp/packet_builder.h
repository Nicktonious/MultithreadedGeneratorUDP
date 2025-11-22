#pragma once

#include "work_args.h"
#include <pcapplusplus/PcapLiveDevice.h>
#include <pcapplusplus/Packet.h>
#include <string>
#include <vector>
#include <memory>

class PacketBuilder {
private:
    pcpp::PcapLiveDevice* device;
    std::string interfaceName;
    
    // Вспомогательные методы для парсинга
    static void parseIpPort(const std::string& ipPort, std::string& ip, uint16_t& port);
    static pcpp::IPv4Address parseIpAddress(const std::string& ipStr);
    
public:
    PacketBuilder(const std::string& interface);
    ~PacketBuilder();
    
    // Инициализация устройства
    bool init();
    
    // Создание одного пакета
    std::unique_ptr<pcpp::Packet> createPacket(const SensorOpts& sensor, 
                                              int packetSize, 
                                              const uint8_t* payload = nullptr,
                                              size_t payloadSize = 0);
    
    // Создание буфера пакетов
    std::vector<std::unique_ptr<pcpp::Packet>> createPacketsBuffer(const WorkArgs& workArgs);
    
    // Отправка одного пакета
    bool sendPacket(pcpp::Packet* packet);
};