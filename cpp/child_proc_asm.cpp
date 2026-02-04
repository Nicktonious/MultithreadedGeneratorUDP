#include "data_asm.h"
#include "work_args.h"
#include <iostream>
#include <thread>
#include <vector>
#include <string>
#include <sstream>
#include <cstdlib>
#include <json/json.h>
#include <pthread.h>
#include <sched.h>


// Глобальный указатель для доступа к sender из обработчика сигнала
static DataAsm* globalDasm = nullptr;

// Обработчик сигнала SIGINT
void signalHandler(int signal) {
    if (globalDasm && signal == SIGINT) {
        // std::cout << getpid() << ": Sent " << globalSender->getMessageCount() << std::endl;
        exit(0);
    }
}

void setCPUAffinity(int cpuCore) {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(cpuCore, &cpuset);
    
    if (pthread_setaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset) != 0) {
        std::cerr << "Failed to set CPU affinity" << std::endl;
    }
}

WorkArgs parseWorkerData(const std::string& jsonStr) {
    WorkArgs args;
    Json::Value root;
    Json::CharReaderBuilder reader;
    std::stringstream ss(jsonStr);
    std::string errors;
    
    if (Json::parseFromStream(reader, ss, &root, &errors)) {
        args.groupName = root["groupName"].asString();
        args.packetSize = root["packetSize"].asInt();
        args.baseCPUIndex = root["baseCPUIndex"].asInt();
        args.threadIndex = root["threadIndex"].asInt();
        
        const Json::Value sensors = root["sensors"];
        for (const auto& sensor : sensors) {
            SensorOpts opts;
            opts.name = sensor["name"].asString();
            opts.src = sensor["src"].asString();
            opts.dst = sensor["dst"].asString();
            opts.socketIndex = sensor["socketIndex"].asInt();
            opts.bufferSize = sensor["bufferSize"].asInt();
            args.sensors.push_back(opts);
        }
    }
    
    return args;
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: " << argv[0] << " <json_worker_data>" << std::endl;
        return 1;
    }
    
    WorkArgs workerData = parseWorkerData(argv[1]);
    
    int cpu = workerData.baseCPUIndex + ((workerData.threadIndex + 1) % std::thread::hardware_concurrency());
    setCPUAffinity(cpu);
    
    DataAsm dasm(workerData, 
                "ipc:///tmp/zmq_clock.ipc", 
                "zmq_data_" + std::to_string(workerData.threadIndex) + ".ipc");
    
    std::cout << "Process " << getpid() << " running on Core " << cpu 
            << ", preparing data for " << workerData.sensors.size() << " sockets" << std::endl;
    
    globalDasm = &dasm;
    signal(SIGINT, signalHandler);

            /*signal(SIGINT, [&](int) {
        std::cout << getpid() << ": Sent " << sender.getMessageCount() << std::endl;
        exit(0);
    });*/
    
    dasm.Init();
    dasm.Run(workerData.packetSize);
    
    return 0;
}