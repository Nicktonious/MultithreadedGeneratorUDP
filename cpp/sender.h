#pragma once
#include <vector>
#include <memory>
#include <atomic>
#include <chrono>
#include <zmq.hpp>
#include "socket_client.h"

struct SensorOpts {
    std::string name;
    std::string src;
    std::string dst;
    int socketIndex;
    int bufferSize;
};

struct WorkArgs {
    std::string groupName;
    int packetSize;
    std::vector<SensorOpts> sensors;
    int baseCPUIndex;
    int threadIndex;
};

class Sender {
private:
    WorkArgs workerData;
    std::string clockAddress;
    std::string dataAddress;
    
    std::vector<std::unique_ptr<SocketClient>> clients;
    std::unique_ptr<zmq::context_t> zmqContext;
    std::unique_ptr<zmq::socket_t> clockSub;
    std::unique_ptr<zmq::socket_t> dataSub;
    
    int messageCount{0};
    int ticks{0};
    
public:
    Sender(const WorkArgs& args, const std::string& clockAddr, const std::string& dataAddr);
    bool connect();
    bool initClients();
    void runBrokerSpeed();
    
    int getMessageCount() const { return messageCount; }
    int getTicks() const { return ticks; }
};