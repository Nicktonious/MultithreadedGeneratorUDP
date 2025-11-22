#pragma once
#include <iostream>
#include <string>
#include <memory>
#include <asio.hpp>
#include <vector>

class SocketClient {
private:
    std::string name;
    int socketIndex;
    std::string srcIp;
    unsigned short srcPort;
    std::string dstIp;
    unsigned short dstPort;
    int bufferSize;
    
    asio::io_context ioContext;
    std::unique_ptr<asio::ip::udp::socket> socket;
    asio::ip::udp::endpoint remoteEndpoint;
    
public:
    SocketClient(const std::string& name, const std::string& src, 
                const std::string& dst, int socketIndex, int bufferSize);
    
    bool init();
    void send(const uint8_t* data, size_t size);
    
    std::string getName() const { return name; }
    int getSocketIndex() const { return socketIndex; }
};