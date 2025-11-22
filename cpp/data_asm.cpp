#include "data_asm.h"
#include "work_args.h"
#include <iostream>
#include <thread>
#include <cstring>
#include <random>
#include <boost/interprocess/shared_memory_object.hpp>

DataAsm::DataAsm(const WorkArgs &workerData,
                 const std::string &clockAddr,
                 const std::string &sharedMemName)
    : clockAddress(clockAddr),
      shmName(sharedMemName),
      zmqContext(1),
      clockSub(zmqContext, ZMQ_SUB),
      segment(nullptr),
      dataBuffer(nullptr),
      messageCounter(nullptr),
      stopFlag(nullptr),
      mutex(nullptr),
      condition(nullptr),
      //   sensorsInfo(workerData.sensors),
      localStopFlag(false),
      numSensors(workerData.sensors.size()),
      packetSize(0)
{
}

DataAsm::~DataAsm()
{
    Cleanup();
}

bool DataAsm::Init()
{
    try
    {
        // Connect to clock subscriber
        clockSub.connect(clockAddress);
        clockSub.set(zmq::sockopt::subscribe, "clock");

        std::cout << "[ASM] ZMQ Sub connected to " << clockAddress
                  << ", Shared memory: " << shmName << std::endl;

        std::this_thread::sleep_for(std::chrono::milliseconds(100));
        return true;
    }
    catch (const std::exception &e)
    {
        std::cerr << "[ASM] Initialization error: " << e.what() << std::endl;
        return false;
    }
}

void DataAsm::Run(size_t packetSize)
{
    this->packetSize = packetSize;
    size_t totalSize = packetSize * numSensors;

    std::cout << "[ASM] Running with packetSize: " << packetSize
              << ", totalSize: " << totalSize << " bytes" << std::endl;

    try
    {
        // Check if we need to reallocate shared memory
        size_t requiredSize = totalSize + sizeof(uint32_t) + sizeof(std::atomic<bool>) +
                              sizeof(bip::interprocess_mutex) + sizeof(bip::interprocess_condition);

        // Cleanup existing objects
        /*if (segment) {
            Cleanup();
        }*/

        // Remove and recreate shared memory with correct size
        bip::shared_memory_object::remove(shmName.c_str());
        segment = new bip::managed_shared_memory(bip::create_only, shmName.c_str(), requiredSize);

        // Recreate objects
        messageCounter = segment->construct<uint32_t>("MessageCounter")(0);
        stopFlag = segment->construct<std::atomic<bool>>("StopFlag")(false);
        mutex = segment->construct<bip::interprocess_mutex>("Mutex")();
        condition = segment->construct<bip::interprocess_condition>("Condition")();

        // Allocate data buffer
        if (dataBuffer)
        {
            segment->deallocate(dataBuffer);
        }
        dataBuffer = segment->allocate(totalSize);
    }
    catch (const std::exception &e)
    {
        std::cerr << "[ASM] Memory allocation error: " << e.what() << std::endl;
        return;
    }

    // Initialize random data generator
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, 255);

    // Create local buffer for data generation
    std::vector<uint8_t> payload(totalSize);
    for (size_t i = 0; i < payload.size(); ++i)
    {
        payload[i] = static_cast<uint8_t>(dis(gen));
    }

    t0 = std::chrono::high_resolution_clock::now();
    uint32_t localCounter = 0;

    try
    {
        zmq::message_t message;
        while (!localStopFlag && !stopFlag->load())
        {
            // Wait for clock signal
            if (clockSub.recv(message, zmq::recv_flags::none))
            {
                std::string msgStr(static_cast<char *>(message.data()), message.size());
                if (msgStr.find("clock") != std::string::npos)
                {
                    // Write message counter at the beginning of each sensor's data
                    ++localCounter;
                    *messageCounter = localCounter;

                    for (size_t i = 0; i < numSensors; ++i)
                    {
                        size_t offset = i * packetSize;
                        if (offset + sizeof(uint32_t) <= payload.size())
                        {
                            std::memcpy(payload.data() + offset, &localCounter, sizeof(uint32_t));
                        }
                    }

                    // Write to shared memory with synchronization
                    {
                        bip::scoped_lock<bip::interprocess_mutex> lock(*mutex);
                        std::memcpy(dataBuffer, payload.data(), totalSize);
                        condition->notify_all(); // Notify readers that new data is available
                    }

                    t1 = std::chrono::high_resolution_clock::now();
                }
            }
        }

        auto duration = std::chrono::duration_cast<std::chrono::seconds>(t1 - t0);
        std::cout << "[ASM] Interval worktime: " << duration.count() << " seconds" << std::endl;
    }
    catch (const std::exception &e)
    {
        std::cerr << "[ASM] Runtime error: " << e.what() << std::endl;
    }
}

void DataAsm::Stop()
{
    localStopFlag = true;
    if (stopFlag)
    {
        stopFlag->store(true);
    }

    // Notify any waiting readers to wake up
    if (condition)
    {
        condition->notify_all();
    }
}

void DataAsm::Cleanup()
{
    if (segment)
    {
        try
        {
            // Destroy all objects
            if (messageCounter)
                segment->destroy<uint32_t>("MessageCounter");
            if (stopFlag)
                segment->destroy<std::atomic<bool>>("StopFlag");
            if (mutex)
                segment->destroy<bip::interprocess_mutex>("Mutex");
            if (condition)
                segment->destroy<bip::interprocess_condition>("Condition");
            if (dataBuffer)
                segment->deallocate(dataBuffer);

            delete segment;
            segment = nullptr;

            // Remove shared memory
            bip::shared_memory_object::remove(shmName.c_str());
        }
        catch (const std::exception &e)
        {
            std::cerr << "[ASM] Cleanup error: " << e.what() << std::endl;
        }
    }
}