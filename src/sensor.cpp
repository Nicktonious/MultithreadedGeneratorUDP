#include "app.hpp"
#include "config.json.hpp"

void SENSOR::check() {
    std::clog << "\n\t\tcheck:";
    assert(sizeof(RIFTEK_HEADER) == RIFTEK_HEADER_SIZE);
    // check file exists
    assert(fh = fopen(dataPath.c_str(), "rb"));
    fclose(fh);
    // check file size
    assert(size == end - start);
    assert(size % packetSize == 0);
    assert(packets == size / packetSize);
    // check headers for all packets
    for (RIFTEK_HEADER *hdr = (RIFTEK_HEADER *)start;
         hdr < (RIFTEK_HEADER *)end; hdr += packetSize) {
        assert(hdr->Serial_number == sn);
    }
    std::clog << "ok\n";
}

void SENSOR::init() {
    std::clog << "\n\tsensor:" << name << " #" << sn;
    std::clog << "\n\t\tfile:" << dataPath;
    std::clog << "\n\t\tsize:" << size;
    std::clog << "\n\t\tpacketSize:" << packetSize;
    std::clog << "\n\t\tpackets:" << packets;

    check();
}
