#include "app.hpp"
#include "config.json.hpp"

pcpp::MacAddress sendMac(SENDMAC);
pcpp::MacAddress recvMac(RECVMAC);
pcpp::IPv4Address sendIp(SENDIP);
pcpp::IPv4Address recvIp(RECVIP);

void CONFIG::run() {
    std::clog << "\nconfig:run";
    for (auto s : config.sensors) s->init();
    //
    GARP::command();
    for (auto s : config.sensors) { s->run(); }
    // sensName1.run();
    // sensName2.run();
    // sensName3.run();
    //
    SENSOR::t_stat = std::thread([]() { SENSOR::stat(); });
    // sensName1.join();
    // sensName2.join();
    // sensName3.join();
}
