#include "work_args.h"
#include "packet_builder.h"
#include <pcapplusplus/EthLayer.h>
#include <pcapplusplus/IPv4Layer.h>
#include <pcapplusplus/UdpLayer.h>
#include <pcapplusplus/PayloadLayer.h>
#include <pcapplusplus/PcapLiveDeviceList.h>
#include <pcapplusplus/Packet.h>
#include <random>
#include <iostream>

using namespace pcpp;

// Парсинг строки "ip:port"
void PacketBuilder::parseIpPort(const std::string& ipPort, std::string& ip, uint16_t& port) {
    size_t colonPos = ipPort.find(':');
    if (colonPos != std::string::npos) {
        ip = ipPort.substr(0, colonPos);
        std::string portStr = ipPort.substr(colonPos + 1);
        port = static_cast<uint16_t>(std::stoi(portStr));
    } else {
        ip = ipPort;
        port = 0;
    }
}

// Парсинг IP адреса
IPv4Address PacketBuilder::parseIpAddress(const std::string& ipStr) {
    return IPv4Address(ipStr);
}

// Конструктор
PacketBuilder::PacketBuilder(const std::string& interface) 
    : interfaceName(interface), device(nullptr) {}

// Деструктор
PacketBuilder::~PacketBuilder() {
    if (device && device->isOpened()) {
        device->close();
    }
}

// Инициализация
bool PacketBuilder::init() {
    device = PcapLiveDeviceList::getInstance().getDeviceByName(interfaceName);
    if (!device) {
        std::cerr << "Cannot find interface: " << interfaceName << std::endl;
        return false;
    }
    
    if (!device->open()) {
        std::cerr << "Cannot open interface: " << interfaceName << std::endl;
        return false;
    }
    
    return true;
}

// Создание одного пакета
std::unique_ptr<Packet> PacketBuilder::createPacket(const SensorOpts& sensor, 
                                                int packetSize,
                                                const uint8_t* payload,
                                                size_t payloadSize) {
    std::string srcIpStr, dstIpStr;
    uint16_t srcPort, dstPort;
    
    // Парсим адреса из sensor
    parseIpPort(sensor.src, srcIpStr, srcPort);
    parseIpPort(sensor.dst, dstIpStr, dstPort);
    
    // Преобразуем в объекты PcapPlusPlus
    IPv4Address srcIp = parseIpAddress(srcIpStr);
    IPv4Address dstIp = parseIpAddress(dstIpStr);
    
    // Получаем MAC адреса (упрощенно - используем MAC устройства)
    MacAddress deviceMac = device->getMacAddress();
    MacAddress destMac("FF:FF:FF:FF:FF:FF"); // Broadcast или можно получить через ARP
    
    // Создаем пакет
    auto packet = std::make_unique<Packet>();
    
    // 1. Ethernet слой
    EthLayer* ethLayer = new EthLayer(deviceMac, destMac);
    packet->addLayer(ethLayer);
    
    // 2. IP слой
    IPv4Layer* ipLayer = new IPv4Layer(srcIp, dstIp);
    ipLayer->getIPv4Header()->timeToLive = 64;
    ipLayer->getIPv4Header()->ipId  = htobe16(rand() % 65535);
    packet->addLayer(ipLayer);
    
    // 3. UDP слой
    UdpLayer* udpLayer = new UdpLayer(srcPort, dstPort);
    packet->addLayer(udpLayer);
    
    // 4. Payload
    size_t headersSize = ethLayer->getHeaderLen() + 
                        ipLayer->getHeaderLen() + 
                        udpLayer->getHeaderLen();
    
    size_t requiredPayloadSize = packetSize - headersSize;
    
    // Используем переданный payload или генерируем случайный
    std::vector<uint8_t> generatedPayload;
    const uint8_t* finalPayload = payload;
    size_t finalPayloadSize = payloadSize;
    
    if (payload == nullptr || payloadSize < requiredPayloadSize) {
        // Генерируем случайный payload нужного размера
        generatedPayload.resize(requiredPayloadSize);
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<> dis(0, 255);
        
        for (auto& byte : generatedPayload) {
            byte = static_cast<uint8_t>(dis(gen));
        }
        
        finalPayload = generatedPayload.data();
        finalPayloadSize = generatedPayload.size();
    }
    
    PayloadLayer* payloadLayer = new PayloadLayer(finalPayload, finalPayloadSize);
    packet->addLayer(payloadLayer);
    
    // Вычисляем контрольные суммы
    packet->computeCalculateFields();
    
    // Проверяем размер
    if (packet->getRawPacket()->getRawDataLen() != packetSize) {
        std::cerr << "Warning: Packet size mismatch. Expected: " << packetSize
                  << ", Actual: " << packet->getRawPacket()->getRawDataLen() << std::endl;
    }
    
    return packet;
}

// Создание буфера пакетов
std::vector<std::unique_ptr<Packet>> PacketBuilder::createPacketsBuffer(const WorkArgs& workArgs) {
    std::vector<std::unique_ptr<Packet>> packets;
    
    // Генерируем общий payload для всех пакетов
    std::vector<uint8_t> commonPayload;
    if (workArgs.packetSize > 0) {
        // Рассчитываем размер payload (вычитаем размер заголовков)
        size_t headersSize = 14 + 20 + 8; // Eth + IP + UDP
        size_t payloadSize = workArgs.packetSize - headersSize;
        
        if (payloadSize > 0) {
            commonPayload.resize(payloadSize);
            std::random_device rd;
            std::mt19937 gen(rd());
            std::uniform_int_distribution<> dis(0, 255);
            
            for (auto& byte : commonPayload) {
                byte = static_cast<uint8_t>(dis(gen));
            }
        }
    }
    
    // Создаем пакет для каждого сенсора
    for (const auto& sensor : workArgs.sensors) {
        auto packet = createPacket(sensor, workArgs.packetSize, 
                                 commonPayload.data(), commonPayload.size());
        packets.push_back(std::move(packet));
    }
    
    return packets;
}

// Отправка одного пакета
bool PacketBuilder::sendPacket(Packet* packet) {
    if (!device || !device->isOpened()) {
        std::cerr << "Device not initialized" << std::endl;
        return false;
    }
    
    return device->sendPacket(packet);
}