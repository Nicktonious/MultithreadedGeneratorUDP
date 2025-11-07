#ifndef RING_CPP
#define RING_CPP

#include "ring.hpp"

template <typename T>
T Ring<T>::pop() {
    assert(!empty());
    T item = std::move(data[read]);
    read = (read + 1) & Mask;
    count--;
    return item;
}

template <typename T>
void Ring<T>::push(const T& item) {
    assert(!full());
    data[write] = item;
    write = (write + 1) & Mask;
    count++;
}

template <typename T>
void Ring<T>::push(T&& item) noexcept {
    assert(!full());
    data[write] = std::move(item);
    write = (write + 1) & Mask;
    count++;
}

template <typename T>
bool Ring<T>::empty() const noexcept {
    return count == 0;
}

template <typename T>
bool Ring<T>::full() const noexcept {
    return count == Size;
}

template <typename T>
size_t Ring<T>::size() const noexcept {
    return count;
}

#endif  // RING_CPP
