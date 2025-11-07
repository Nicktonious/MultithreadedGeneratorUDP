#include "riftek.hpp"

#include <cassert>

void riftek(uint8_t packet) {
    assert(sizeof(RIFTEK_HEADER) == RIFTEK_HEADER_SIZE);  // check header size
}
