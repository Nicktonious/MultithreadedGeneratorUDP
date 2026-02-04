#pragma once
#include <iostream>
#include <string>
#include <vector>
#include <cstdint>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <fcntl.h>
#include <cstring>
#include <system_error>

class SocketClient {
private:
    std::string name;
    int socketIndex;
    std::string srcIp;
    unsigned short srcPort;
    std::string dstIp;
    unsigned short dstPort;
    int bufferSize;
    
    int socketFd;
    sockaddr_in remoteAddr;

    bool gsoEnabled;
    int gsoSize;
    
public:
    SocketClient(const std::string& name, const std::string& src, 
                const std::string& dst, int socketIndex, int bufferSize);
    ~SocketClient();
    
    bool init();
    void send(const uint8_t* data, size_t size);
    
    // Методы для GSO (не используются в текущей реализации)
    bool enableGso(int gsoSize);
    bool disableGso();
    bool isGsoSupported() const;
    
    std::string getName() const { return name; }
    int getSocketIndex() const { return socketIndex; }
    int getSocketFd() const { return socketFd; }
};