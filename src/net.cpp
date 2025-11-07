#include "app.hpp"

void Net::init(bool dpdk) {
    std::clog << "\nnet:init";
    //
    Net::coreNum = pcpp::getNumOfCores();
    assert(Net::coreNum >= 4);
    std::clog << "\n\tcores:" << (int)Net::coreNum;
    //
    Net::coreMask = pcpp::getCoreMaskForAllMachineCores();
    std::clog << "\n\tcmask:" << std::format("{:032b}", Net::coreMask);
    //
    if (dpdk) {
        std::clog << "\n\n";
        assert(pcpp::DpdkDeviceList::initDpdk(Net::coreMask, MBUF_POOL_SIZE));
    }
    //
    open(0);  // open 0
    std::clog << "\n";
}

void Net::start() { abort(); /* TODO */ }

void Net::stop() {
    pcpp::DpdkDeviceList::getInstance().stopDpdkWorkerThreads();
    if (Net::dev) Net::dev->close();
}

void Net::list() {  //
    std::cerr << "\nlist:";
    auto dpdkDeviceList =
        pcpp::DpdkDeviceList::getInstance().getDpdkDeviceList();
    for (auto &dev : dpdkDeviceList) {  //
        auto mtu = dev->getMtu();
        pcpp::DpdkDevice::LinkStatus status;
        dev->getLinkStatus(status);
        if (mtu) {
            std::cerr << "\n\t" << dev->getDeviceId()      //
                      << ": " << dev->getDeviceName()      //
                      << " " << dev->getMacAddress()       //
                      << " " << dev->getPciAddress()       //
                      << " " << dev->getPMDName()          //
                      << "/" << dev->getPMDType()          //
                      << " mtu:" << mtu                    //
                      << " mbps:" << status.linkSpeedMbps  //
                      << " duplex:" << status.linkDuplex   //
                      << " up:" << status.linkUp           //
                ;
        }
    }
}

uint8_t Net::coreNum = 1;
pcpp::CoreMask Net::coreMask;
pcpp::DpdkDevice *Net::dev = nullptr;

void Net::open(int port) {  //
    std::cerr << "\nopen:" << port;
    dev = pcpp::DpdkDeviceList::getInstance().getDeviceByPort(port);
    assert(dev != nullptr);
    std::cerr                              //
        << "\n\t" << dev->getDeviceName()  //
        << " mtu:" << dev->getMtu();
    assert(dev->open());
}
