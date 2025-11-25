#ifndef RING_HPP
#define RING_HPP

#include <atomic>
#include <cassert>
#include <condition_variable>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <utility>

/// fixed-size ring with byte counters
template <typename T, const size_t Size = 0x100>
class FIFO {
    static constexpr size_t Mask = (Size - 1);  /// ring mask
    static_assert((Size & (Size - 1)) == 0, "Size must be power of 2");
    static_assert(Size <= 0x100, "byte-sized indexes used");
    static_assert(Size >= 0x10, "Too small");

    T data[Size];       ///< packet buffer allocated in DPDK mbuf memory
    uint8_t read = 0;   ///< read pointer
    uint8_t write = 0;  ///< write pointer
    uint8_t count = 0;  ///< used elements in @ref data

    FIFO(const FIFO&) = delete;             ///< no copy
    FIFO& operator=(const FIFO&) = delete;  ///< no copy

   public:
    static const size_t max = Size;  ///< max @ref size()
    FIFO() = default;
    ~FIFO() = default;

    /// @name syncronization
    /// @{
    mutable std::mutex monopoly;  ///< lock ring until continous operation done
    mutable std::mutex change;    ///< lock used for waiting data change
    void wait(uint8_t elements);  ///< wait for at least `elements`
    void lock();                  ///< block ring before monopolic usage
    void unlock();                ///< unblock ring after monopolic usage
    // std::condition_variable on_unlock;
    /// @}

    /// @name SPCS producer-only
    /// @{
    bool push(const T& item);  ///< push element
    // std::condition_variable on_push;  ///< condvar for @ref push waiting
    /// @}

    /// @name SPCS consumer-only
    /// @{
    T* pop();  ///< pop element by reference
    T* top();  ///< top element by reference (don't pop)
    // std::condition_variable on_pop;  ///< condvar for @ref pop waiting
    T* multi_ptr();                  ///< pop mutiple elements at once
    size_t multi_size(uint8_t max);  ///< size of
    void multi_pop(size_t size);     ///< pop top `size` elements
    /// @}

    /// @name current size-related
    /// @{
    bool empty() const noexcept;   ///< empty check
    bool full() const noexcept;    ///< overflow check
    size_t size() const noexcept;  ///< current queue size

    /// @}

    /// @name statistics
    /// @{
    uint min_count, max_count, mid_count;

    /// @}
};

#include "fifo.cpp"

#endif  // RING_HPP
