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
    // assert(size % packetSize == 0);
    // assert(packets == size / packetSize);
    // // check headers for all packets
    // for (RIFTEK_HEADER *hdr = (RIFTEK_HEADER *)start;
    //      hdr < (RIFTEK_HEADER *)end; hdr += packetSize) {
    //     assert(hdr->Serial_number == sn);
    // }
    std::clog << "ok";
}

void SENSOR::init() {
    std::clog << "\n\tsensor:" << name << " #" << sn;
    // std::clog << "\n\t\tfile:" << dataPath;
    // std::clog << "\n\t\tsize:" << size;
    // std::clog << "\n\t\tpacketSize:" << packetSize;
    // std::clog << "\n\t\tpackets:" << packets;

    check();
}

void SENSOR::yield() {
    std::this_thread::sleep_for(
        std::chrono::nanoseconds(int(1.0 / freq * 1e9)));
}

void SENSOR::sleep() {
    std::this_thread::sleep_for(std::chrono::nanoseconds(1));
    // std::this_thread::sleep_for(std::chrono::milliseconds(111));
}

void SENSOR::run() {
    stop = false;
    t_slicer = std::thread([this]() { slicer(); });
    t_sender = std::thread([this]() { sender(); });
    SENSOR::sensors.push_back(this);
}

void SENSOR::join() {
    t_sender.join();
    t_slicer.join();
}
