#pragma once

#include <sys/inotify.h>

/// @defgroup main main
/// @brief system startup
/// @ingroup app
/// @{

extern int main(int argc, char *argv[]);  ///< POSIX entry point
extern void arg(int argc, char *argv);    ///< process command line argument
extern void signal_handler(int signal);   ///< system signals handler

/// @name exit codes
/// @{

#define EXIT_OK 0
#define EXIT_RESTART 1
#define EXIT_ERROR -1

/// @}
/// @}
