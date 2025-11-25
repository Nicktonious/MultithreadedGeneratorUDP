#include "send.hpp"
#include "stat.hpp"

std::vector<pcpp::DpdkWorkerThread *> Worker::threads;

Worker::Worker(pcpp::DpdkDevice *dev, long interval, int data_packs)
    : dev(dev),
      _stop(false),
      coreid(0),  // MAX_NUM_OF_CORES),
      interval(interval),
      data_packs(data_packs),
      count(0),
      total(0),
      runs(0) {}

bool Worker::schedule() {
    // std::this_thread::sleep_for(_loop_start + _interval);
    // const long split = 1000;
    // long a = interval / split;
    // long b = interval % split;
    // for (long i = 0; i < a; i++) {
    //     if (a) std::this_thread::sleep_for(std::chrono::nanoseconds(a));
    //     if (_stop) break;
    // }
    // if (b) std::this_thread::sleep_for(std::chrono::nanoseconds(b));
    std::this_thread::sleep_for(std::chrono::nanoseconds(interval));
    return true;
}

void Worker::stop() { _stop = true; }

uint32_t Worker::getCoreId() const { return coreid; }

bool Worker::any_started = false;

bool Worker::run(uint32_t coreid) {
    any_started = true;
    getcpu = sched_getcpu();
    coreid = coreid;
    _stop = false;
    std::cerr << "\n\tcore:" << coreid;

    pcpp::MBufRawPacket *mbufArr[data_packs];

    for (int i = 0; i < data_packs; i++) {
        // mutate UDP port
        pcpp::UdpLayer *udp = packet.getLayerOfType<pcpp::UdpLayer>();
        if (udp) {
            pcpp::udphdr *hdr = udp->getUdpHeader();
            assert(hdr);
            hdr->portDst = pcpp::hostToNet16(UDP_PORT + i % SPLIT);
            packet.computeCalculateFields();
        }
        // push raw packet into mbuf
        assert(mbufArr[i] = new pcpp::MBufRawPacket());
        mbufArr[i]->initFromRawPacket(packet.getRawPacket(), dev);
    }
    //     while (!_stop) {  // interval=0
    //         auto start = std::chrono::high_resolution_clock::now();
    //         for (int i = 0; i < 1000; i++)
    //             count += dev->sendPackets(mbufArr, data_packs, 0);
    //         auto end = std::chrono::high_resolution_clock::now();
    //         std::cerr << "\n" << (end - start) / 1e3 << "\n";
    //     }
    do {
        runs++;
        auto loop_start = std::chrono::steady_clock::now();
        int t = dev->sendPackets(mbufArr, data_packs, 0, true);
        count += t;
        total += t;
        if (total >= PACKS_LIMIT) stop();
    } while (!_stop && schedule());
    //
    return true;
}

#include <cxxabi.h>

std::string Worker::tag() {
    int status;
    return abi::__cxa_demangle(typeid(*this).name(), 0, 0, &status);
}
