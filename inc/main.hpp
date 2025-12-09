#pragma once

extern int main(int argc, char* argv[]);    ///< POSIX entry point
extern void arg(int argc, char* argv);      ///< process command line argument
extern void setup(int argc, char* argv[]);  ///< system setup
extern int loop();                          ///< event loop
