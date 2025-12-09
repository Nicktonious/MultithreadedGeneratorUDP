#include "app.hpp"

uint Sender::bytes = 0;

Sender::Sender(pcpp::DpdkDevice* dev, Group* g) : Worker(dev), g(g) {
    // zmq = "inproc://" + g->name();
    zmq = "ipc://" + g->name();
    assert(puller = new zmq::socket_t(Dev::context, zmq::socket_type::pull));
    puller->connect(zmq);
}

bool Sender::run(uint32_t coreId) {
    assert(Worker::run(coreId));
    timespec ts = {0x12345678};  // fake timestamp
    pcpp::RawPacket* raw;
    zmq::message_t message;
    // burst buffer
    pcpp::MBufRawPacket* burst[burst_sz];      //
    uint8_t buf[Sender::burst_sz * Dev::MTU];  //
    const uint frame_sz = 1442;                // 1400 + 28 + 20;
    //
    while (!_stop) {
        auto res = puller->recv(message, zmq::recv_flags::none);
        //
        // for (uint idx = 0; idx < burst_sz; idx++) {
        raw = new pcpp::RawPacket(  //
            (uint8_t*)message.data(), message.size(), ts, true);
        // collect
        // burst[idx] = new pcpp::MBufRawPacket();
        // burst[idx]->initFromRawPacket(raw, Dev::dev);
        // burst send
        // dev->sendPackets(burst, burst_sz);
        dev->sendPacket(*raw);
        Sender::bytes += raw->getRawDataLen();
    }
    return terminate();
}
