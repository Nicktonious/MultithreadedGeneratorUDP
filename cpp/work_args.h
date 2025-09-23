#pragma once

#include <string>
#include <vector>
struct SensorOpts {
    std::string name;
    std::string src;
    std::string dst;
    int socketIndex;
    int bufferSize;
};

struct WorkArgs {
    std::string groupName;
    int packetSize;
    std::vector<SensorOpts> sensors;
    int baseCPUIndex;
    int threadIndex;
};