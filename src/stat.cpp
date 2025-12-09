#include "stat.hpp"

Stat* Stat::stat = nullptr;

Stat::Stat(pcpp::DpdkDevice* dev) : Worker(dev) {
    assert(!Stat::stat);  // check singleton
    Stat::stat = this;
    std::clog << "stat: sheduled\n";
}

void Stat::init() { stat = new Stat(Dev::dev); }

#define M (1024. * 1024.)
#define G (M * 1024.)

bool Stat::run(uint32_t coreId) {
    assert(Worker::run(coreId));  //
    uint n = 0;
    while (!_stop) {
        dev->getStatistics(stats);

        std::clog << "stat:" << ++n                                           //
                  << " core:" << getCoreId()                                  //
                  << " mbuf:" << dev->getAmountOfMbufsInUse()                 //
                  << '/' << dev->getAmountOfFreeMbufs()                       //
                  << " packets:" << stats.aggregatedTxStats.packets           //
                  << " pps:" << stats.aggregatedTxStats.packetsPerSec         //
                  << " mbps:" << stats.aggregatedTxStats.bytesPerSec / M      //
                  << " gbit:" << stats.aggregatedTxStats.bytesPerSec / G * 8  //
                  << " gbytes:" << Sender::bytes / G                          //
                  << "\n";

        Sender::bytes = 0;

        std::this_thread::sleep_for(interval);
    }
    return terminate();
}
