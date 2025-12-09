#include "app.hpp"

std::vector<pcpp::DpdkWorkerThread*> Worker::threads;

uint32_t Worker::coreMask = 0;

Worker::Worker(pcpp::DpdkDevice* dev) : dev(dev), _stop(false) {
    coreMask = (coreMask << 1) | 0b10;
    Worker::threads.push_back(this);
}

void Worker::stop() { _stop = true; }

std::atomic<int> Worker::active = {0};

bool Worker::run(uint32_t coreId) {
    _coreId = coreId;
    active.fetch_add(1, std::memory_order_relaxed);
    return terminate();
}

bool Worker::terminate() {
    active.fetch_sub(1, std::memory_order_relaxed);
    return true;
}

uint32_t Worker::getCoreId() const { return dev->getCurrentCoreId(); }

void Worker::wait_inactive() {
    int workers = Worker::active.load();
    while (workers>0) {
        fprintf(stderr, "\nwait workers: %i\n", workers);
        workers = Worker::active.load();
        std::this_thread::sleep_for(std::chrono::seconds(1));
    }
}
