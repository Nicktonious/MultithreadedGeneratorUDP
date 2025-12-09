# [[net/UDP|UDP]] traffic generator
## @ [[org/MAS|MAS]]

## [[протокол 281025]]

https://discord.com/channels/1129456870898278450/1432614238777770034/1432615460305764373
![](https://media.discordapp.net/attachments/1432614238777770034/1432615460393848863/image.png?ex=6901b29e&is=6900611e&hm=545a0518dbcd2c89327fc940af243cec721f81abf49dbac1d2464c2c2acf2482&=&format=webp&quality=lossless)

## [[протокол 061125]]
## [[протокол 111125]]


## датчики [[РИФТЭК]]

- [[RF62X-SDK]]
	- [[RF627]]
	- [[РФ631]]
	- https://github.com/RIFTEK-LLC/RF62X-SDK

## [[тестовые данные]]

- [[LLDP]] @ [[S6730-H48X6C]]

- send
	- mac: e8:eb:d3:93:42:98
		- mac2: e8:eb:d3:93:42:99
	- IP: 10.120.101.111
	- virtuals: 10.120.101.200..250 (camera/sensors emulation)
- recv
	- mac: e8:eb:d3:93:42:91
	- ip: 10.120.101.11
	- port: 40000..40024

```c
#define SENDMAC "e8:eb:d3:93:42:98"
#define SENDIP "10.120.101.111"
#define SENDMAC2 "e8:eb:d3:93:42:99"
#define SEND_INTERVAL_MS 1111 /* ms */
#define GARP_INTERVAL_MS 5555 /* ms */

#define BROADCAST "ff:ff:ff:ff:ff:ff"
#define RECVMAC "e8:eb:d3:93:42:91"
#define RECVIP "10.120.101.11"

#define SENDPORT 12345
#define RECVPORT 40000
```

## [[net/debug|debug]]

## шаблон конфигурации
составляемой пользователем перед запуском

```json
{
    "id": 0,
    "workTime": 60,
    "sysChannel": {
        "host": "10.101.1.52:9999"
    },
    "groups": [
        {
            "name": "1d",
            "filesPath": "./1d_sensors.zip",
            "loop": false,
            "freq": 1000,
            "packetSize": 8192,
            "sensors": [
                {
                    "name": "sensName1",
                    "src": "10.110.100.1:40000",
                    "dst": "10.120.101.11:50000",
                    "vlan": "1001"
                },
                {
                    "name": "sensName2",
                    "src": "10.110.100.2:40000",
                    "dst": "10.120.101.11:50001",
                    "vlan": "1002"
                }
            ]
        },
        {
            "name": "2d",
            "filesPath": "./2d_sensors.zip",
            "loop": false,
            "freq": 1000,
            "packetSize": 8192,
            "sensors": [
                {
                    "name": "sensName1",
                    "src": "10.110.100.21:40000",
                    "dst": "10.120.101.11:51000",
                    "vlan": "2001"
                }
            ]
        }
    ]
}
```

## JSON парсер

```cpp
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
```
```cpp
WorkArgs parseWorkerData(const std::string& jsonStr) {
    WorkArgs args;
    Json::Value root;
    Json::CharReaderBuilder reader;
    std::stringstream ss(jsonStr);
    std::string errors;
    
    if (Json::parseFromStream(reader, ss, &root, &errors)) {
        args.groupName = root["groupName"].asString();
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
            args.packetSize = sensor["packetSize"].asInt();
            args.dataPath = sensor["dataPath"].asInt();
            args.sensors.push_back(opts);
        }
    }
    
    return args;
}
```


## [[тесты]]
