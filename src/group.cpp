#include "app.hpp"

Group::Group(pcpp::DpdkDevice* dev, GROUP* g) : Worker(dev), g(g) {
    // init order required:
    assert(sender = new Sender(dev, this));
    assert(pusher = new zmq::socket_t(Dev::context, zmq::socket_type::push));
    pusher->bind(sender->zmq);
    std::clog << "\tgroup:" << g->name;
    for (auto s : g->sensors) {
        std::clog << "\n\t\t" << s->name                        //
                  << " : " << s->src.ip << ':' << s->src.port   //
                  << " -> " << s->dst.ip << ':' << s->dst.port  //
                  << " packet:" << s->packetSize;
    }
    std::clog << "\n";
}

#include "config.json.hpp"

bool Group::run(uint32_t coreId) {
    assert(Worker::run(coreId));
    //
    pcpp::Packet packet;
    pcpp::RawPacket* raw;
    pcpp::EthLayer eth_layer(Dev::sendMac, Dev::recvMac, PCPP_ETHERTYPE_IP);
    packet.addLayer(&eth_layer);
    //
    uint16_t ipId = 0;
    static const uint16_t FTU = 1400;
    pcpp::iphdr* ip_hdr;
    pcpp::PayloadLayer* data_layer;
    struct __attribute__((packed)) {
        uint16_t src;
        uint16_t dst;
        uint16_t length = 0;
        uint16_t crc = 0;
        uint8_t data[FTU];
    } udp_frame;
    static const uint8_t MF_flag = 0b00100000;  // `More Fragments` flag mask
    //
    for (auto s : g->sensors) s->data = s->start;
    period = std::chrono::nanoseconds(long(1e9 / g->freq));
    //
    while (!_stop) {
        start_time = std::chrono::high_resolution_clock::now();
        for (auto s : g->sensors) {
            //
            ipId++;
            packet.removeAllLayersAfter(&eth_layer);
            auto ipv4_layer = new pcpp::IPv4Layer(s->src.ip, s->dst.ip);
            packet.addLayer(ipv4_layer);
            udp_frame.src = htobe16(s->src.port);
            udp_frame.dst = htobe16(s->dst.port);
            udp_frame.length = htobe16(s->packetSize + 8);
            // std::clog << "sensor:" << s->name << "\n";
            for (uint16_t offset = 0, fragment_size = 0; offset < s->packetSize;
                 offset += FTU) {
                //
                if (offset + FTU <= s->packetSize)
                    fragment_size = FTU;
                else
                    fragment_size = s->packetSize % FTU;
                // std::clog << "\tfragment_size:" << fragment_size;
                assert(fragment_size);
                memcpy(udp_frame.data, &s->data, fragment_size);
                s->data += fragment_size;
                if (s->data > s->start + s->size) s->data = s->start;
                //
                if (offset == 0) {
                    assert(data_layer = new pcpp::PayloadLayer(  //
                               (uint8_t*)&udp_frame, sizeof(udp_frame)));
                } else {
                    assert(data_layer = new pcpp::PayloadLayer(  //
                               udp_frame.data, fragment_size));
                }
                packet.removeAllLayersAfter(ipv4_layer);
                packet.addLayer(data_layer);
                //
                packet.computeCalculateFields();
                ip_hdr = ipv4_layer->getIPv4Header();
                ip_hdr->timeToLive = 5;
                ip_hdr->ipId = htobe16(ipId);
                ip_hdr->protocol = pcpp::PACKETPP_IPPROTO_UDP;
                ip_hdr->fragmentOffset =
                    htobe16((offset + (offset ? 8 : 0)) / sizeof(uint64_t));
                if (offset + FTU < s->packetSize)
                    ip_hdr->fragmentOffset |= MF_flag;
                else
                    ip_hdr->fragmentOffset &= ~MF_flag;
                pcpp::ScalarBuffer<uint16_t> ip_scalar = {
                    (uint16_t*)ip_hdr,  //
                    (size_t)(ip_hdr->internetHeaderLength * 4)};
                ip_hdr->headerChecksum = 0;
                ip_hdr->headerChecksum =
                    htobe16(pcpp::computeChecksum(&ip_scalar, 1));
                //
                raw = packet.getRawPacket();
                pusher->send(zmq::buffer(  //
                    raw->getRawData(), raw->getRawDataLen()));
                // // pusher->send(zmq::buffer(S_1_1.start, S_1_1.size));
                // // pusher->send(zmq::buffer(S_1_1.start, 18500 * 28));
            }  // fragment
        }  // sensor
        end_time = std::chrono::high_resolution_clock::now();
        duration = end_time - start_time;
        if (period > duration)
            std::this_thread::sleep_for(period - duration);
        else
            std::this_thread::sleep_for(std::chrono::nanoseconds(1));
    }  // worker
    //
    return terminate();
}
