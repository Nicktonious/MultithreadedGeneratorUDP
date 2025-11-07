#include "app.hpp"

std::vector<pcpp::DpdkWorkerThread *> GARP::threads;

void GARP::command() {  //
    GARP::threads.push_back(new GARP(Net::dev));
    pcpp::DpdkDeviceList::getInstance().startDpdkWorkerThreads(  //
        GARP::coreMask, GARP::threads);
    std::cerr << "\ngarp:\n";
}

GARP::GARP(pcpp::DpdkDevice *dev, long interval) : Worker(dev, interval) {
    //
    assert(eth_layer = new pcpp::EthLayer(  //
               sendMac, recvMac, PCPP_ETHERTYPE_ARP));
    packet.addLayer(eth_layer);
    //
    assert(arp_layer = new pcpp::ArpLayer(  //
               pcpp::ARP_REQUEST, sendMac, sendIp, recvMac, recvIp));
    packet.addLayer(arp_layer);
    //
    packet.computeCalculateFields();
}
