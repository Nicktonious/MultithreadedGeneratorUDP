#pragma once

#include "sender.h"
#include "tpacket_client.h"
#include "work_args.h"
#include <iostream>
#include <random>
#include <zmq.hpp>

class SenderTPacket {
private:
    WorkArgs workerData;
    std::string clockAddress;
    std::string dataAddress;

    std::unique_ptr<zmq::context_t> zmqContext;
    std::unique_ptr<zmq::socket_t> clockSub;
    std::unique_ptr<zmq::socket_t> dataSub;

    int messageCount{0};
    int ticks{0};
    
public:
    SenderTPacket(const WorkArgs& args, const std::string& clockAddr, const std::string& dataAddr);

    bool connect();

    bool initClients();

    void runBrokerSpeed();

    int getMessageCount() const { return messageCount; }
    int getTicks() const { return ticks; }
};