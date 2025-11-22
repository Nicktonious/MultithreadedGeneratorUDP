cmake_minimum_required(VERSION 3.12)
project(udp_sender)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# add_subdirectory(/home/dev01/PcapPlusPlus ${CMAKE_BINARY_DIR}/PcapPlusPlus)

# Поиск необходимых библиотек
find_package(PkgConfig REQUIRED)

pkg_check_modules(ZeroMQ REQUIRED libzmq)
pkg_check_modules(JSONCPP REQUIRED jsoncpp)

include_directories(${CMAKE_SOURCE_DIR})
include_directories(${ZeroMQ_INCLUDE_DIRS} ${JSONCPP_INCLUDE_DIRS} ${Boost_INCLUDE_DIRS})
# include_directories(
#     /home/dev01/PcapPlusPlus/Pcap++/header/
#     /home/dev01/PcapPlusPlus/Packet++/header/
#     /home/dev01/PcapPlusPlus/Common++/header/
# )


# Настройка флагов компиляции
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -pthread")

# Создаем исполняемый файл
add_executable(udp_sender
    main.cpp
    sender.cpp
    socket_client.cpp
    work_args.h
)

# Линковка библиотек
target_link_libraries(udp_sender
    ${ZeroMQ_LIBRARIES}
    ${JSONCPP_LIBRARIES}
    pthread
)

add_executable(dasm
    child_proc_asm.cpp
    data_asm.cpp
    work_args.h)

target_link_libraries(dasm
    ${ZeroMQ_LIBRARIES}
    ${JSONCPP_LIBRARIES}
    ${Boost_LIBRARIES}
    pthread
    rt
    dl
)

# add_executable(sender_tpacket 
#     main_tpacket.cpp
#     packet_builder.cpp
#     sender_tpacket.cpp
#     tpacket_client.cpp
#     tx_ring.cpp
#     work_args.h)

# target_link_libraries(sender_tpacket
#     /home/dev01/PcapPlusPlus/build/Pcap++/libPcap++.a
#     /home/dev01/PcapPlusPlus/build/Packet++/libPacket++.a
#     /home/dev01/PcapPlusPlus/build/Common++/libCommon++.a
#     ${ZeroMQ_LIBRARIES}
#     ${JSONCPP_LIBRARIES}
#     pthread
#     pcap
# )

# Установка целевого файла
install(TARGETS udp_sender dasm DESTINATION bin)