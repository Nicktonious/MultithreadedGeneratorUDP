#include "app.hpp"

int main(int argc, char* argv[]) {  //
    arg(0, argv[0]);
    Watch::init(argc, argv);
    setup(argc, argv);
    for (int i = 1; i < argc; i++) arg(i, argv[i]);
    Dev::init();
    GARP::init();
    Stat::init();
    Config::init();
    Dev::run_workers();
    return loop();
}

void arg(int argc, char* argv) {  //
    std::clog << "arg[" << argc << "] = <" << argv << "]\n";
}

void setup(int argc, char* argv[]) {  //
    std::clog << "setup: ok\n";
}

int loop() {  //
    std::clog << "loop: \n";
    while (true) {
        // std::clog << '.';
        std::this_thread::sleep_for(std::chrono::seconds(1));
    }
    return 0;
}
