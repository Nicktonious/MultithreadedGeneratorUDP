#ifndef RING_CPP
#define RING_CPP

#include "fifo.hpp"

template <typename T, size_t Size>
void FIFO<T, Size>::wait(uint8_t elements) {
    while (size() < elements)
        std::this_thread::sleep_for(std::chrono::nanoseconds(1));
}

template <typename T, size_t Size>
void FIFO<T, Size>::lock() {
    monopoly.lock();
}

template <typename T, size_t Size>
void FIFO<T, Size>::unlock() {
    monopoly.unlock();
}

template <typename T, size_t Size>
T* FIFO<T, Size>::top() {
    assert(!empty());
    return &data[read];
}

template <typename T, size_t Size>
T* FIFO<T, Size>::pop() {
    assert(!empty());
    // T item = std::move(data[read]);
    T* item = &data[read];
    read = (read + 1) & Mask;
    count--;
    //
    min_count = count < min_count ? count : min_count;
    mid_count = (mid_count + count) >> 1;
    return item;
}

template <typename T, size_t Size>
T* FIFO<T, Size>::multi_ptr() {
    return top();
}

template <typename T, size_t Size>
size_t FIFO<T, Size>::multi_size(uint8_t max) {  // const noexcept {
    assert(!empty());
    size_t tail = Size - read;  // elements after `read` pointer
    // std::clog << "\ntail:" << (uint)tail   //
    //           << " read:" << (uint)read    //
    //           << " write:" << (uint)write  //
    //           << " count:" << (uint)count;
    // return 1;
    if (count <= tail)                     //
        return count < max ? count : max;  // no data[] wrap
    else                                   //
        return tail < max ? tail : max;    // only data[read..] part
}

template <typename T, size_t Size>
void FIFO<T, Size>::multi_pop(size_t sz) {  // const noexcept {
    assert(sz <= count);
    read = (read + sz) & Mask;
    count -= sz;
    // assert(sz <= size());
    // for (int i = 0; i < sz; i++) pop();
}

template <typename T, size_t Size>
bool FIFO<T, Size>::push(const T& item) {
    while (full())  //
        std::this_thread::sleep_for(std::chrono::nanoseconds(1));
    //
    lock();
    data[write] = item;
    write = (write + 1) & Mask;
    count++;
    //
    unlock();
    max_count = count > max_count ? count : max_count;
    mid_count = (mid_count + count) >> 1;
    return true;
}

template <typename T, size_t Size>
bool FIFO<T, Size>::empty() const noexcept {
    return count == 0;
}

template <typename T, size_t Size>
bool FIFO<T, Size>::full() const noexcept {
    return count == Size;
}

template <typename T, size_t Size>
size_t FIFO<T, Size>::size() const noexcept {
    return count;
}

#endif  // RING_CPP
