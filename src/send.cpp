#include "send.hpp"

std::vector<pcpp::DpdkWorkerThread *> Send::threads;

Send::Send(pcpp::DpdkDevice *dev, int shift, int data_packs, long interval)
    : Worker(dev, interval, data_packs) {
    assert(eth_layer = new pcpp::EthLayer(  //
               sendMac, recvMac, PCPP_ETHERTYPE_IP));
    packet.addLayer(eth_layer);
    assert(ipv4_layer = new pcpp::IPv4Layer(  //
               sendIp, recvIp));
    packet.addLayer(ipv4_layer);
    assert(udp_layer = new pcpp::UdpLayer(  //
               UDP_PORT, UDP_PORT + shift));
    packet.addLayer(udp_layer);
    assert(payload_layer = new pcpp::PayloadLayer(  //
               test_data, sizeof(test_data)));
    packet.addLayer(payload_layer);
    //
    packet.computeCalculateFields();
    //
    Send::coreMask = (Send::coreMask << 1) + 0b10;
}

pcpp::CoreMask Send::coreMask = 0;

uint8_t Send::test_data[DATA_SIZE];

void Send::command(int threads, int data_packs, long interval) {  //
    std::cerr << "\nsend:";
    for (int i = 0; i <= 8 && i < threads; i++)
        Send::threads.push_back(new Send(Net::dev, i, data_packs, interval));
    pcpp::DpdkDeviceList::getInstance().startDpdkWorkerThreads(  //
        Send::coreMask, Send::threads);
    std::cerr << "\n";
}

//     // ipv4_layer.getIPv4Header()->timeToLive = 11;  // shorter path
//     // ipv4_layer.getIPv4Header()->ipId =
//     //     pcpp::hostToNet16(4000);                  // multipart package
//     //
//     //
//     // udp_layer->getUdpHeader()->length = pcpp::hostToNet16(1234);
//     //
