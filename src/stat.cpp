#include "app.hpp"

void Stat::command() {  //
    std::cerr << "\nstat:";
    Stat::threads.push_back(new Stat(Net::dev));
    pcpp::DpdkDeviceList::getInstance().startDpdkWorkerThreads(  //
        Stat::coreMask, threads);
    std::cerr << "\n";
}

std::vector<pcpp::DpdkWorkerThread *> Stat::threads;

Stat::Stat(pcpp::DpdkDevice *dev, long interval) : Worker(dev, interval) {}

static void _stat(Worker *w) {
    float kbs = w->count * DATA_SIZE / 1024.;
    float gbit = float(w->count * DATA_SIZE) * 8 / 1e9;
    if (gbit < 1e-3) gbit = 0;
    std::cerr << "\n\t\t core:" << w->coreid << '/' << getcpu  //
              << " packs:" << w->count << " /s"                //
              << " total:" << w->total << " /s"                //
              << " data:" << kbs << " Kb/s"                    //
              << " mbps:" << gbit << " gbit"                   //
              << " runs:" << w->runs << " /s";                 //
    w->count = 0;  // \ zero for nest second stat clooection
    w->runs = 0;   // /
}

bool Stat::run(uint32_t coreid) {
    coreid = coreid;  // std::this_thread::get_id();
    _stop = false;
    int _id = 0;
    do {
        runs++;
        auto loop_start = std::chrono::steady_clock::now();
        std::cerr << "\nstat: uptime:" << _id++ << "s";
        std::cerr << "\n\tsend:" << " coremask:" << Send::coreMask;
        for (auto &w : Send::threads) _stat(static_cast<Worker *>(w));
        std::cerr << "\n\tgarp:" << " coremask:" << GARP::coreMask;
        for (auto &w : GARP::threads) _stat(static_cast<Worker *>(w));
        std::cerr << "\n\tstat:" << " coremask:" << Stat::coreMask;
        for (auto &w : Stat::threads) _stat(static_cast<Worker *>(w));
        std::cerr << '\n';
    } while (!_stop && schedule());
    //
    std::cerr << "======================\n";
    return true;
}

std::thread SENSOR::t_stat;
std::vector<SENSOR *> SENSOR::sensors;
uint SENSOR::total_packets;
uint SENSOR::total_bytes;

void SENSOR::stat() {
    std::this_thread::sleep_for(std::chrono::milliseconds(1000));
    uint pps = 0, bps = 0;
    while (true) {
        //
        auto now =  //
            std::chrono::system_clock::now();
        auto local_time =  //
            std::chrono::zoned_time{std::chrono::current_zone(), now};
        std::cout << "{ \"ts\":\"" << local_time << "\",";
        //
        pps = 0, bps = 0;
        for (auto s : sensors) {
            pps += s->sent_packets, s->sent_packets = 0;
            bps += s->sent_bytes, s->sent_bytes = 0;
        }
        total_packets += pps, total_bytes += bps;
        //
        const uint Mb = 1024 * 1024;
        std::cout << " \"packets\":" << total_packets << ",";
        std::cout << " \"mbytes\":" << total_bytes / Mb << ",";
        std::cout << " \"pps\":" << pps << ",";
        std::cout << " \"mbps\":" << bps / Mb << " }\n";
        //
        std::this_thread::sleep_for(std::chrono::milliseconds(1000));  /// 1s
    }
}
