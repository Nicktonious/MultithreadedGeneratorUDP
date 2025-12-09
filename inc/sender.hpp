#pragma once

#include "app.hpp"

class Sender : public Worker {
    friend class Group;
    friend class Stat;
    Group* g;
    std::string zmq;
    zmq::socket_t* puller;
    static const uint burst_sz;
    static uint bytes;

   public:
    Sender(pcpp::DpdkDevice* dev, Group* g);
    bool run(uint32_t coreid);
};
