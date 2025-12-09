#include "app.hpp"

zmq::context_t Dev::context(1);

uint8_t Dev::coreNum = 1;
pcpp::CoreMask Dev::coreMask;
pcpp::DpdkDevice *Dev::dev = nullptr;
uint16_t Dev::MTU = 1500;

void Dev::init() {
    std::clog << "dev:";

    Dev::coreNum = pcpp::getNumOfCores();
    assert(Dev::coreNum >= 4);
    std::clog << " cores:" << (uint)coreNum;

    Dev::coreMask = pcpp::getCoreMaskForAllMachineCores();
    std::clog << " cmask:" << std::format("{:032b}", Dev::coreMask) << "\n";

    assert(pcpp::DpdkDeviceList::initDpdk(Dev::coreMask, Dev::mBufPoolSize));

    // std::clog << " port:" << Dev::port;
    dev = pcpp::DpdkDeviceList::getInstance().getDeviceByPort(Dev::port);
    Dev::MTU = dev->getMtu();
    std::clog << "dev: " << dev->getDeviceName()            //
              << " id:" << dev->getDeviceId()               //
              << "\n\tmac:" << dev->getMacAddress()         //
              << " pci:" << dev->getPciAddress()            //
              << " pmd:" << dev->getPMDName()               //
              << "\n\ttx:" << dev->getTotalNumOfTxQueues()  //
              << " rx:" << dev->getTotalNumOfRxQueues()     //
              << " mbuf:" << dev->getAmountOfMbufsInUse()   //
              << '/' << dev->getAmountOfFreeMbufs()         //
              << " mtu:" << dev->getMtu()                   //
              << "\n";
    //
    assert(dev->openMultiQueues(1, 1));  // assert(dev->open());
}

void Dev::stop() {
    std::clog << "dev: stop\n";
    pcpp::DpdkDeviceList::getInstance().stopDpdkWorkerThreads();
    Worker::wait_inactive();
    Dev::dev->close();
}

void Dev::run_workers() {
    pcpp::DpdkDeviceList::getInstance().startDpdkWorkerThreads(  //
        Worker::coreMask, Worker::threads);
}
