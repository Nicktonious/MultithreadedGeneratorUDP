#include "app.hpp"
#include "config.json.hpp"

void SENSOR::sender() {
    // std::clog << "\n\tsender:" << name << '\n';
    while (!stop) {
        const uint8_t packs_per_send = packetSize / FTU + 1;
        fifo.wait(packs_per_send);  // frames for at least one send
        fifo.lock();
        // repeat until
        for (int sent = 0; sent < packs_per_send;) {
            uint packets = fifo.multi_size(packs_per_send - sent);
            // std::clog << "\nname:" << name << " packets:" << packets;
            auto ptr = fifo.multi_ptr();
            assert(ptr == fifo.top());
            Net::dev->sendPackets(ptr, packets, 0, false);
            fifo.multi_pop(packets);
            // sent_packets += packets;
            // sent_bytes += packets * FTU;
            sent += packets;
        }

        fifo.unlock();
        yield();
    }
}
