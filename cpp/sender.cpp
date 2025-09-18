#include "sender.h"
#include <iostream>
#include <random>
#include <zmq.hpp>

Sender::Sender(const WorkArgs& args, const std::string& clockAddr, const std::string& dataAddr)
    : workerData(args), clockAddress(clockAddr), dataAddress(dataAddr) {
    zmqContext = std::make_unique<zmq::context_t>(1);
}

bool Sender::connect() {
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

bool Sender::initClients() {
    try {
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
    }
}

void Sender::runBrokerSpeed() {
    if (!initClients() || !connect()) {
        return;
    }
    
    std::vector<uint8_t> payload(workerData.packetSize);
  
    // Заполнение буфера случайными данными
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<uint8_t> dis(0, 255);
    
    for (auto& byte : payload) {
        byte = dis(gen);
    }
    
    zmq::message_t message;

    uint8_t* payloadPtr = payload.data();
    size_t payloadSize = payload.size();
    
    while (true) {
        if (clockSub->recv(message, zmq::recv_flags::none)) {
            std::string msgStr(static_cast<char*>(message.data()), message.size());
            if (msgStr.substr(0, 5) == "clock") {
                auto t0 = std::chrono::high_resolution_clock::now();
                for (auto& client : clients) {
                    client->send(payloadPtr, payloadSize);
                    messageCount++;
                }
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