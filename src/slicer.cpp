#include <PacketUtils.h>

#include "IpAddress.h"
#include "app.hpp"
#include "config.hpp"
#include "config.json.hpp"

void SENSOR::slicer() {
    std::clog << "\n\tslicer:" << name << '\n';
    pcpp::Packet packet;
    auto eth_layer = new pcpp::EthLayer(sendMac, recvMac, PCPP_ETHERTYPE_IP);
    packet.addLayer(eth_layer);
    auto ipv4_layer = new pcpp::IPv4Layer(sendIp, recvIp);
    packet.addLayer(ipv4_layer);
    pcpp::iphdr *ip_hdr = ipv4_layer->getIPv4Header();
    pcpp::PayloadLayer *data_layer;
    uint16_t ipId = 0;
    struct __attribute__((packed)) {
        uint16_t src;
        uint16_t dst;
        uint16_t length = 0;
        uint16_t crc = 0;
        uint8_t data[FTU];
    } udp_frame = {.src = htobe16(src.port), .dst = htobe16(dst.port)};
    //
    while (!stop) {
        ipId++;
        // std::this_thread::sleep_for(std::chrono::milliseconds(1111));
        // auto data_addr = sensName1.start;
        // auto data_size = packetSize;  // sensName1.packetSize;
        //
        for (uint16_t offset = 0, fragment_size = 0;  //
             offset < packetSize;                     //
             offset += FTU) {
            //
            {
                packet.removeAllLayersAfter(ipv4_layer);  // clean packet
            }

            {
                if (offset + FTU < packetSize)
                    fragment_size = FTU;
                else
                    fragment_size = packetSize % FTU;

                memcpy(udp_frame.data, &start[offset], fragment_size);  //
                if (offset == 0) {                                      // first
                    udp_frame.length = htobe16(packetSize + 8);  // with UDP hdr
                    assert(data_layer = new pcpp::PayloadLayer(  //
                               (uint8_t *)&udp_frame, sizeof(udp_frame)));
                    sent_packets++;
                    sent_bytes += 20 + sizeof(udp_frame);
                    //
                } else {                                         // data
                    assert(data_layer = new pcpp::PayloadLayer(  //
                               udp_frame.data, fragment_size));
                    sent_bytes += 20 + fragment_size;
                }
                packet.addLayer(data_layer);
            }

            //
            {
                packet.computeCalculateFields();
                ip_hdr = ipv4_layer->getIPv4Header();           // fix IP header
                ip_hdr->ipId = htobe16(ipId);                   //
                ip_hdr->timeToLive = 5;                         // min TTL
                ip_hdr->protocol = pcpp::PACKETPP_IPPROTO_UDP;  //

                //
                ip_hdr->fragmentOffset =
                    htobe16((offset + (offset ? 8 : 0)) / sizeof(uint64_t));
                if (offset + MTU < packetSize)
                    ip_hdr->fragmentOffset |= MF_flag;
                else
                    ip_hdr->fragmentOffset &= ~MF_flag;

                //
                pcpp::ScalarBuffer<uint16_t> ip_scalar = {
                    (uint16_t *)ip_hdr,  //
                    (size_t)(ip_hdr->internetHeaderLength * 4)};
                assert(ip_scalar.len == 20);
                ip_hdr->headerChecksum = 0;
                ip_hdr->headerChecksum =
                    htobe16(pcpp::computeChecksum(&ip_scalar, 1));
            }

            {
                auto raw = packet.getRawPacket();
                auto mbuf = new pcpp::MBufRawPacket();
                mbuf->initFromRawPacket(raw, Net::dev);
                fifo.push(mbuf);
            }

            // sleep();
        }  // for(fragments++)
    }
}
