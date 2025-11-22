#include "socket_client.h"
#if defined(__linux__)
#include <linux/udp.h>
// Если макросы не определены, определяем их сами
#ifndef SOL_UDP
#define SOL_UDP 17
#endif
#ifndef UDP_SEGMENT
#define UDP_SEGMENT 103
#endif
#endif

SocketClient::SocketClient(const std::string& name, const std::string& src, 
                          const std::string& dst, int socketIndex, int bufferSize)
    : name(name), socketIndex(socketIndex), bufferSize(bufferSize), socketFd(-1) {
    
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
    
    // Инициализация remote address
    memset(&remoteAddr, 0, sizeof(remoteAddr));
    remoteAddr.sin_family = AF_INET;
    remoteAddr.sin_port = htons(dstPort);
    inet_pton(AF_INET, dstIp.c_str(), &remoteAddr.sin_addr);
}

SocketClient::~SocketClient() {
    if (socketFd != -1) {
        close(socketFd);
        socketFd = -1;
    }
}

bool SocketClient::init() {
    try {
        // Создаем UDP сокет
        socketFd = socket(AF_INET, SOCK_DGRAM, 0);
        if (socketFd == -1) {
            throw std::system_error(errno, std::system_category(), "socket creation failed");
        }
        
        // Устанавливаем non-blocking mode
        int flags = fcntl(socketFd, F_GETFL, 0);
        if (flags == -1) {
            throw std::system_error(errno, std::system_category(), "fcntl F_GETFL failed");
        }
        if (fcntl(socketFd, F_SETFL, flags | O_NONBLOCK) == -1) {
            throw std::system_error(errno, std::system_category(), "fcntl O_NONBLOCK failed");
        }
        
        // Устанавливаем размер буфера отправки
        if (setsockopt(socketFd, SOL_SOCKET, SO_SNDBUF, &bufferSize, sizeof(bufferSize)) == -1) {
            throw std::system_error(errno, std::system_category(), "setsockopt SO_SNDBUF failed");
        }
        
        // Привязываем сокет к локальному адресу
        sockaddr_in localAddr;
        memset(&localAddr, 0, sizeof(localAddr));
        localAddr.sin_family = AF_INET;
        localAddr.sin_port = htons(srcPort);
        inet_pton(AF_INET, srcIp.c_str(), &localAddr.sin_addr);
        
        if (bind(socketFd, (sockaddr*)&localAddr, sizeof(localAddr)) == -1) {
            throw std::system_error(errno, std::system_category(), "bind failed");
        }
        
        std::cout << "Socket bound to: " << srcIp << ":" << srcPort 
                  << " -> " << dstIp << ":" << dstPort << std::endl;
        return true;
        
    } catch (const std::exception& e) {
        std::cerr << "Socket initialization error: " << e.what() << std::endl;
        if (socketFd != -1) {
            close(socketFd);
            socketFd = -1;
        }
        return false;
    }
}

void SocketClient::send(const uint8_t* data, size_t size) {
    ssize_t bytesSent = sendto(socketFd, data, size, 0, 
                              (sockaddr*)&remoteAddr, sizeof(remoteAddr));
    
    if (bytesSent == -1) {
        // Игнорируем ошибки для non-blocking сокета (EWOULDBLOCK/EAGAIN)
        if (errno != EWOULDBLOCK && errno != EAGAIN) {
            std::cerr << "Send error: " << strerror(errno) << std::endl;
        }
    }
}

bool SocketClient::enableGso(int gsoSize) {
    if (socketFd == -1) {
        std::cerr << "GSO enable failed: socket not initialized" << std::endl;
        return false;
    }
    
    if (!isGsoSupported()) {
        std::cerr << "GSO enable failed: not supported by system" << std::endl;
        return false;
    }
    
    if (setsockopt(socketFd, SOL_UDP, UDP_SEGMENT, &gsoSize, sizeof(gsoSize)) == -1) {
        std::cerr << "GSO enable failed: " << strerror(errno) << std::endl;
        return false;
    }
    
    this->gsoEnabled = true;
    this->gsoSize = gsoSize;
    
    std::cout << "GSO enabled with segment size: " << gsoSize << " bytes" << std::endl;
    return true;
}

bool SocketClient::disableGso() {
    if (socketFd == -1 || !gsoEnabled) {
        return false;
    }
    
    // Для отключения GSO устанавливаем размер сегмента в 0
    int disableValue = 0;
    if (setsockopt(socketFd, SOL_UDP, UDP_SEGMENT, &disableValue, sizeof(disableValue)) == -1) {
        std::cerr << "GSO disable failed: " << strerror(errno) << std::endl;
        return false;
    }
    
    gsoEnabled = false;
    gsoSize = 0;
    
    std::cout << "GSO disabled" << std::endl;
    return true;
}

bool SocketClient::isGsoSupported() const {
    if (socketFd == -1) {
        return false;
    }
    
    // Проверяем поддержку GSO путем попытки получить текущее значение
    int currentValue = 0;
    socklen_t len = sizeof(currentValue);
    
    int result = getsockopt(socketFd, SOL_UDP, UDP_SEGMENT, &currentValue, &len);
    return (result == 0);
}