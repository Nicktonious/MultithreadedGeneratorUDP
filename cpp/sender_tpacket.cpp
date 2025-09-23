#include "sender_tpacket.h"
#include "tpacket_client.h"
#include "packet_builder.h"
#include "work_args.h"
#include <iostream>
#include <random>
#include <zmq.hpp>

SenderTPacket::SenderTPacket(const WorkArgs& args, const std::string& clockAddress, const std::string& dataAddr)
    : workerData(args), clockAddress(clockAddress), dataAddress(dataAddr) {
    zmqContext = std::make_unique<zmq::context_t>(1);
}

bool SenderTPacket::connect() {
    try {
        clockSub = std::make_unique<zmq::socket_t>(*zmqContext, zmq::socket_type::sub);
        clockSub->connect(clockAddress);
        clockSub->set(zmq::sockopt::subscribe, "clock");
        
        dataSub = std::make_unique<zmq::socket_t>(*zmqContext, zmq::socket_type::pull);
        dataSub->connect(dataAddress);
        
        std::cout << "[Sender] ZMQ Sub connected to " << clockAddress 
                  << ", " << dataAddress << std::endl;
        return true;
    } catch (const zmq::error_t& e) {
        std::cerr << "ZMQ connection error: " << e.what() << std::endl;
        return false;
    }
}

bool SenderTPacket::initClients() {
    return true;
    /*try {
        for (const auto& sensor : workerData.sensors) {
            auto client = std::make_unique<SocketClient>(
                sensor.name, sensor.src, sensor.dst, 
                sensor.socketIndex, sensor.bufferSize);
            
            if (client->init()) {
                clients.push_back(std::move(client));
            }
        }
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Clients initialization error: " << e.what() << std::endl;
        return false;
    }*/
}

void SenderTPacket::runBrokerSpeed() {
    if (!initClients() || !connect()) {
        return;
    }
    std::string ifname = "enp1sn0";
    PacketBuilder packetBuilder(ifname);
    // 3. Создаем пакеты через PacketBuilder
    auto packets = packetBuilder.createPacketsBuffer(workerData);
    if (packets.empty()) {
        std::cerr << "Failed to create packets" << std::endl;
        return;
    }
    std::vector<std::vector<uint8_t>> raw_packets;
    for (auto& packet : packets) {
        const uint8_t* data = packet->getRawPacket()->getRawData();
        size_t size = packet->getRawPacket()->getRawDataLen();
        raw_packets.emplace_back(data, data + size);
    }

    // Создаем и инициализируем клиент
    TPacketClient tx_client(ifname, 2048, 512);
    if (!tx_client.initialize()) {
        std::cerr << "Failed to initialize TPacketClient" << std::endl;
        return;
    }

    tx_client.preparePacketBuffer(raw_packets);

    zmq::message_t message;
    while (true) {
        if (clockSub->recv(message, zmq::recv_flags::none)) {
            std::string msgStr(static_cast<char*>(message.data()), message.size());
            if (msgStr.substr(0, 5) == "clock") {
                auto t0 = std::chrono::high_resolution_clock::now();
                tx_client.sendPreparedBuffer();
                ticks++;
                /*auto t1 = std::chrono::high_resolution_clock::now();
                auto dt = std::chrono::duration_cast<std::chrono::microseconds>(t1 - t0).count();
                
                // Проверяем порог и выводим предупреждение
                if (dt > 100) {
                    std::cout << "WARNING: Processing time " << dt << " μs exceeds 100 μs threshold" << std::endl;
                }*/
            }
        }
    }
}