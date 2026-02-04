#pragma once

#include <string>
#include <vector>
struct SensorOpts {
    std::string name;
    std::string src;
    std::string dst;
    int socketIndex;
    int bufferSize;
    int packetSize;
    std::string dataPath;
};

struct WorkArgs {
    std::string groupName;
    std::vector<SensorOpts> sensors;
    int baseCPUIndex;
    int threadIndex;
};