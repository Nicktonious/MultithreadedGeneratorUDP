#include "config.hpp"

const std::chrono::seconds GARP::interval(15);
const std::chrono::seconds Stat::interval(1);

const uint Sender::burst_sz = 64;

const pcpp::MacAddress Dev::broadcast(BROADCAST);
const pcpp::MacAddress Dev::sendMac(SENDMAC);
const pcpp::MacAddress Dev::recvMac(RECVMAC);
const pcpp::IPv4Address Dev::sendIp(SENDIP);
const pcpp::IPv4Address Dev::recvIp(RECVIP);

void Config::init() {
    std::clog << "config:\n";
    for (auto g : config.groups) {
        new Group(Dev::dev, g);
    }
}

void Config::stop() {
    std::clog << "config: stop\n";
    Dev::stop();
    exit(0);
}
