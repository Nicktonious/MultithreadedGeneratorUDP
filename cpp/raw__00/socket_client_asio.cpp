#include "socket_client.h"
#include <asio.hpp>
#include <iostream>

SocketClient::SocketClient(const std::string& name, const std::string& src, 
                          const std::string& dst, int socketIndex, int bufferSize)
    : name(name), socketIndex(socketIndex), bufferSize(bufferSize) {
    
    auto parseAddress = [](const std::string& address, std::string& ip, unsigned short& port) {
        size_t colonPos = address.find(':');
        if (colonPos != std::string::npos) {
            ip = address.substr(0, colonPos);
            std::string portStr = address.substr(colonPos + 1);
            port = static_cast<unsigned short>(std::stoi(portStr));
        }
    };
    
    parseAddress(src, srcIp, srcPort);
    parseAddress(dst, dstIp, dstPort);
    
    socket = std::make_unique<asio::ip::udp::socket>(ioContext);
    remoteEndpoint = asio::ip::udp::endpoint(
        asio::ip::make_address(dstIp), dstPort);
}

bool SocketClient::init() {
    try {
        asio::ip::udp::endpoint localEndpoint(
            asio::ip::make_address(srcIp), srcPort);
        
        socket->open(localEndpoint.protocol());
        socket->bind(localEndpoint);
        
        socket->set_option(asio::socket_base::send_buffer_size(bufferSize));
        socket->non_blocking(true);
        
        std::cout << "Socket bound to: " << srcIp << ":" << srcPort 
                  << " -> " << dstIp << ":" << dstPort << std::endl;
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Socket initialization error: " << e.what() << std::endl;
        return false;
    }
}

void SocketClient::send(const uint8_t* data, size_t size) {
    socket->send_to(asio::buffer(data, size), remoteEndpoint);
}
