#include "app.hpp"
#include "config.json.hpp"

pcpp::MacAddress sendMac(SENDMAC);
pcpp::MacAddress recvMac(RECVMAC);
pcpp::IPv4Address sendIp(SENDIP);
pcpp::IPv4Address recvIp(RECVIP);

Ring<int> ring;

void slicer() {
    for (int i = 0; i < 0x10; i++) {
        std::clog << "slicer:" << i << '\n';
        ring.push(i);
    }
}

void sender() {
    while (true) {  //
        std::clog << "sender:" << ring.pop() << '\n';
    }
}

void CONFIG::run() {  //
    std::clog << "\nconfig:run";
    for (auto s : config.sensors) s->init();
    std::clog << "\n\n";
    // 
    auto sls = std::thread::spawn(slicer);
    auto snd = std::thread::spawn(sender);
    std::thread::join(sls);
    std::thread::stop(snd);
}
